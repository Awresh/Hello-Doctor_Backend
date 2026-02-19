import { TenantRepository } from "../repositories/tenant.repository.js";
import { JwtService } from "./jwt.service.js";
import { Tenant, TenantUser, OTP, Plan, Subscription, BillingHistory, PaymentMethod, sequelize, BusinessType } from "../models/index.js";
import { Op } from "sequelize";
import crypto from 'crypto';
import Razorpay from "razorpay";
import { UnifiedLoginService } from './auth/unified-login.service.js';
import { TenantLoginStrategy } from './auth/tenant-login.strategy.js';
import { TenantUserLoginStrategy } from './auth/tenant-user-login.strategy.js';
import { sendEmail } from '../utils/email.util.js';

export class AuthService {
    constructor() {
        this.tenantRepository = new TenantRepository();
        this.jwtService = new JwtService();
        this.loginService = new UnifiedLoginService([
            new TenantLoginStrategy(),
            new TenantUserLoginStrategy()
        ]);
    }

    async login(email, password) {
        return await this.loginService.login(email, password);
    }

    async verifyPayment(paymentDetails) {
        let body = "";
        let expectedSignature = "";
        const secret = process.env.RAZORPAY_KEY_SECRET || 'pFnVBF5XKaTHH9zz4G3zFz1z';

        if (paymentDetails.razorpay_subscription_id) {
            body = paymentDetails.razorpay_payment_id + "|" + paymentDetails.razorpay_subscription_id;
        } else if (paymentDetails.razorpay_order_id) {
            body = paymentDetails.razorpay_order_id + "|" + paymentDetails.razorpay_payment_id;
        }

        expectedSignature = crypto.createHmac("sha256", secret).update(body.toString()).digest("hex");

        if (expectedSignature !== paymentDetails.razorpay_signature) {
            throw { statusCode: 400, message: 'Invalid payment signature' };
        }
    }

    async createSubscription(tenantId, subscriptionPlan, billingCycle, paymentDetails) {
        let planModel = null;
        if (typeof subscriptionPlan === 'string' && isNaN(parseInt(subscriptionPlan))) {
            planModel = await Plan.findOne({ where: { name: { [Op.iLike]: `%${subscriptionPlan}%` } } });
        } else {
            planModel = await Plan.findByPk(subscriptionPlan);
        }

        if (!planModel) return;

        const startDate = new Date();
        const endDate = new Date();
        const cycle = billingCycle === 'yearly' ? 'yearly' : 'monthly';

        if (cycle === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
            endDate.setMonth(endDate.getMonth() + 1);
        }
        
        const isPaid = paymentDetails && paymentDetails.razorpay_payment_id;

        await Subscription.create({
            tenantId,
            planId: planModel.id,
            status: isPaid ? 'active' : 'trial',
            billingCycle: cycle,
            currentPeriodStart: startDate,
            currentPeriodEnd: endDate
        });

        if (isPaid) {
            await this.createBillingHistory(tenantId, planModel, cycle, paymentDetails);
            await this.savePaymentMethod(tenantId, paymentDetails);
        }
    }

    async createBillingHistory(tenantId, planModel, cycle, paymentDetails) {
        await BillingHistory.create({
            tenantId,
            planId: planModel.id,
            amount: paymentDetails.amount || (cycle === 'yearly' ? planModel.yearlyPrice : planModel.monthlyPrice),
            currency: 'INR',
            status: 'paid',
            paymentMethodDetails: { type: 'razorpay', paymentId: paymentDetails.razorpay_payment_id },
            transactionId: paymentDetails.razorpay_payment_id,
            invoiceDate: new Date()
        });
    }

    async savePaymentMethod(tenantId, paymentDetails) {
        try {
            const RozorpayInstance = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_S0drC6NquOd0Q3',
                key_secret: process.env.RAZORPAY_KEY_SECRET || 'pFnVBF5XKaTHH9zz4G3zFz1z'
            });

            const paymentInfo = await RozorpayInstance.payments.fetch(paymentDetails.razorpay_payment_id);
            
            const methodData = {
                tenantId,
                isPrimary: true,
                label: 'Primary Method'
            };

            if (paymentInfo.method === 'card') {
                methodData.type = 'Card';
                methodData.last4 = paymentInfo.card.last4;
                methodData.brand = paymentInfo.card.network;
                methodData.holderName = paymentInfo.card.name;
                
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
        } catch (error) {
            console.error("Failed to save payment method:", error);
        }
    }

    async register(data) {
        const { name, email, businessName, businessType, password, contact, contactCountryCode, subscriptionPlan, paymentDetails, billingCycle } = data;
        
        if (!businessType) {
            throw { statusCode: 400, message: 'Business type is required' };
        }
        
        const existingTenant = await Tenant.findOne({ where: { email } });
        if (existingTenant) {
            throw { statusCode: 400, message: 'Tenant already exists' };
        }

        if (paymentDetails) {
            await this.verifyPayment(paymentDetails);
        }

        const tenant = await Tenant.create({ 
            name, 
            email, 
            businessName, 
            businessTypeId: businessType, 
            password,
            phone: contact,
            phoneCountryCode: contactCountryCode
        });

        if (subscriptionPlan) {
            await this.createSubscription(tenant.id, subscriptionPlan, billingCycle, paymentDetails);
        }
        
        const populatedTenant = await this.tenantRepository.findById(tenant.id);
        const token = this.jwtService.generateToken({ tenantId: tenant.id });
        
        return { tenant: populatedTenant, token };
    }

    async checkEmail(email) {
        const existingTenant = await Tenant.findOne({ where: { email } });
        if (existingTenant) {
            throw { statusCode: 400, message: 'Email already exists' };
        }
        return true;
    }

    async forgotPassword(email) {
        // 1. Find user (Tenant or TenantUser)
        let user = await Tenant.findOne({ where: { email } });
        let userModel = Tenant;

        if (!user) {
            user = await TenantUser.findOne({ where: { email } });
            userModel = TenantUser;
        }

        if (!user) {
            throw { statusCode: 404, message: 'User with this email does not exist' };
        }

        // 2. Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        // 3. Save to database
        await user.update({
            resetPasswordToken: resetToken,
            resetPasswordExpires: tokenExpiry
        });

        // 4. Send email
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/reset-password?token=${resetToken}`;
        
        await sendEmail({
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h1>Password Reset</h1>
                <p>You requested a password reset. Please click the link below to set a new password:</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you did not request this, please ignore this email.</p>
            `
        });

        return true;
    }

    async resetPassword(token, newPassword) {
        // 1. Find user by token and check expiry
        let user = await Tenant.findOne({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: { [Op.gt]: new Date() }
            }
        });

        if (!user) {
            user = await TenantUser.findOne({
                where: {
                    resetPasswordToken: token,
                    resetPasswordExpires: { [Op.gt]: new Date() }
                }
            });
        }

        if (!user) {
            throw { statusCode: 400, message: 'Invalid or expired reset token' };
        }

        // 2. Update password and clear token
        await user.update({
            password: newPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null
        });

        return true;
    }

    async sendOTP(email) {
        // 1. Check if email already exists
        const existingTenant = await Tenant.findOne({ where: { email } });
        if (existingTenant) {
            throw { statusCode: 400, message: 'Email already exists' };
        }

        // 2. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

        // 3. Save to database (Upsert)
        await OTP.upsert({
            email,
            otp,
            expiresAt,
            isVerified: false
        });

        // 4. Send email
        await sendEmail({
            to: email,
            subject: 'Email Verification OTP - Hello Doctor',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h1 style="color: #1A1A5E;">Email Verification</h1>
                    <p>Thank you for signing up with Hello Doctor. Use the following OTP to verify your email address:</p>
                    <div style="background-color: #F4F4FF; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1A1A5E;">${otp}</span>
                    </div>
                    <p>This OTP will expire in 10 minutes.</p>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
            `
        });

        return true;
    }

    async verifyOTP(email, otp) {
        const record = await OTP.findOne({
            where: {
                email,
                otp,
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        if (!record) {
            throw { statusCode: 400, message: 'Invalid or expired OTP' };
        }

        await record.update({ isVerified: true });
        return true;
    }
}
