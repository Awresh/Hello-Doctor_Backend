import { Tenant, BusinessType, Plan, Subscription, PaymentMethod, BillingHistory, sequelize } from "../../models/index.js"
import { MESSAGES } from "../../config/serverConfig.js"
import crypto from 'crypto';
import { sendResponse } from "../../utils/response.util.js"
import { STATUS_CODES } from "../../config/statusCodes.js"
import jwt from "jsonwebtoken"
import Razorpay from "razorpay"

// Login tenant
export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    
    const tenant = await Tenant.scope('withPassword').findOne({ 
      where: { email },
      include: [{ model: BusinessType, attributes: ['name'] }]
    })
    
    if (!tenant) {
      return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Invalid credentials' })
    }
    
    const isPasswordValid = await tenant.comparePassword(password)
    if (!isPasswordValid) {
      return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Invalid credentials' })
    }
    
    const token = jwt.sign({ tenantId: tenant.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' })
    
    // Remove password from response
    const tenantResponse = { ...tenant.toJSON() }
    delete tenantResponse.password
    
    return sendResponse(res, { message: 'Login successful', data: { tenant: tenantResponse, token } })
  } catch (error) {
    console.log('check Error', error)
    return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: 'Login failed' })
  }
}

// Register tenant
export const register = async (req, res) => {
  try {
    const { name, email, businessName, businessType, password, contact, subscriptionPlan, paymentMethod, paymentDetails } = req.body
    
    if (!businessType) {
      return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Business type is required' })
    }
    
    const existingTenant = await Tenant.findOne({ where: { email } })
    if (existingTenant) {
      return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Tenant already exists' })
    }
    


    // Verify Razorpay Payment or Subscription
    if (paymentDetails) {
         try {
             let body = "";
             let expectedSignature = "";
             const secret = process.env.RAZORPAY_KEY_SECRET || 'pFnVBF5XKaTHH9zz4G3zFz1z';

             if (paymentDetails.razorpay_subscription_id) {
                 // Subscription verification
                 body = paymentDetails.razorpay_payment_id + "|" + paymentDetails.razorpay_subscription_id;
                 expectedSignature = crypto
                    .createHmac("sha256", secret)
                    .update(body.toString())
                    .digest("hex");
             } else if (paymentDetails.razorpay_order_id) {
                 // Standard Order verification
                 body = paymentDetails.razorpay_order_id + "|" + paymentDetails.razorpay_payment_id;
                 expectedSignature = crypto
                    .createHmac("sha256", secret)
                    .update(body.toString())
                    .digest("hex");
             }

             if (expectedSignature !== paymentDetails.razorpay_signature) {
                 console.error(`Invalid payment signature. Expected: ${expectedSignature}, Received: ${paymentDetails.razorpay_signature} | Body: ${body}`);
                 return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Invalid payment signature' });
             }
         } catch (verifyError) {
             console.error("Signature verification failed:", verifyError);
             return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Payment verification failed' });
         }
    }

    const tenant = await Tenant.create({ 
      name, 
      email, 
      businessName, 
      businessTypeId: businessType, 
      password,
      phone: contact
    })

    // Handle Subscription if plan is selected
    if (subscriptionPlan) {
      try {
        let planModel = null;
        if (typeof subscriptionPlan === 'string' && isNaN(parseInt(subscriptionPlan))) {
           planModel = await Plan.findOne({ where: { name: { [sequelize.Op.iLike]: `%${subscriptionPlan}%` } } });
        } else {
           planModel = await Plan.findByPk(subscriptionPlan);
        }

        if (planModel) {
             const startDate = new Date();
             const endDate = new Date();
             const cycle = req.body.billingCycle === 'yearly' ? 'yearly' : 'monthly';

             if (cycle === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
             } else {
                endDate.setMonth(endDate.getMonth() + 1);
             }
             
             // Determine status based on payment
             const isPaid = paymentDetails && paymentDetails.razorpay_payment_id;

             await Subscription.create({
                 tenantId: tenant.id,
                 planId: planModel.id,
                 status: isPaid ? 'active' : 'trial', // Active if paid, otherwise trial
                 billingCycle: cycle,
                 currentPeriodStart: startDate,
                 currentPeriodEnd: endDate
             });

             // Create Billing History for Initial Payment if Paid
             if (isPaid) {
                 await BillingHistory.create({
                     tenantId: tenant.id,
                     planId: planModel.id,
                     amount: paymentDetails.amount || (cycle === 'yearly' ? planModel.yearlyPrice : planModel.monthlyPrice),
                     currency: 'INR',
                     status: 'paid',
                     paymentMethodDetails: { type: 'razorpay', paymentId: paymentDetails.razorpay_payment_id },
                     transactionId: paymentDetails.razorpay_payment_id,
                     invoiceDate: new Date()
                 });
                 
                  // Fetch payment details to save specific method
                  try {
                      // Initialize Razorpay instance
                      const RozorpayInstance = new Razorpay({
                          key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_S0drC6NquOd0Q3',
                          key_secret: process.env.RAZORPAY_KEY_SECRET || 'pFnVBF5XKaTHH9zz4G3zFz1z'
                      });

                      const paymentInfo = await RozorpayInstance.payments.fetch(paymentDetails.razorpay_payment_id);
                      
                      const methodData = {
                          tenantId: tenant.id,
                          isPrimary: true,
                          label: 'Primary Method'
                      };

                      if (paymentInfo.method === 'card') {
                          methodData.type = 'Card';
                          methodData.last4 = paymentInfo.card.last4;
                          methodData.brand = paymentInfo.card.network; // e.g., Visa
                          methodData.holderName = paymentInfo.card.name || name;
                          
                          // Attempt to capture expiry if available
                          // Note: Razorpay might redact this in some API tiers
                          if (paymentInfo.card.expiry_month && paymentInfo.card.expiry_year) {
                              methodData.expiryMonth = paymentInfo.card.expiry_month;
                              methodData.expiryYear = paymentInfo.card.expiry_year;
                          }
                      } else if (paymentInfo.method === 'upi') {
                          methodData.type = 'UPI';
                          methodData.upiId = paymentInfo.vpa;
                          methodData.brand = 'UPI';
                      } else {
                           methodData.type = 'Other';
                           methodData.label = paymentInfo.method;
                      }

                      await PaymentMethod.create(methodData);

                  } catch (fetchError) {
                      console.error("Failed to fetch/save Razorpay payment details:", fetchError);
                  }
              }
        }
        
      } catch (subError) {
          console.error("Subscription/History creation failed during signup:", subError);
      }
    }

    
    const populatedTenant = await Tenant.findByPk(tenant.id, {
      include: [{ model: BusinessType, attributes: ['name'] }]
    })
    
    const token = jwt.sign({ tenantId: tenant.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' })
    
    return sendResponse(res, { statusCode: STATUS_CODES.CREATED, message: 'Registration successful', data: { tenant: populatedTenant, token } })
  } catch (error) {
    console.error('Registration Error:', error)
    return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: 'Registration failed' })
  }
}

// Check if email already exists
export const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const existingTenant = await Tenant.findOne({ where: { email } });
    
    if (existingTenant) {
      return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Email already exists' });
    }
    
    return sendResponse(res, { statusCode: STATUS_CODES.OK, success: true, message: 'Email is available' });
  } catch (error) {
    console.error('Email Check Error:', error);
    return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: 'Failed to check email' });
  }
}

export default {
  login,
  register,
  checkEmail
}