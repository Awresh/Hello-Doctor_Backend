import Razorpay from 'razorpay';
import crypto from 'crypto';
import { STATUS_CODES } from '../../config/statusCodes.js';
import { sendResponse } from '../../utils/response.util.js';
import dotenv from 'dotenv';
dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_S0drC6NquOd0Q3', // Default test key
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'pFnVBF5XKaTHH9zz4G3zFz1z'
});

// Helper to get or create plan
const getOrCreatePlan = async (planName, amount, currency, period) => {
    // For now, we will create a plan dynamically or return a dummy one based on rules
    // Ideally we should cache this or store in DB.
    // period: 'monthly' or 'yearly'
    const planOptions = {
        period,
        interval: 1,
        item: {
            name: `${planName} - ${period}`,
            amount: Math.round(amount * 100),
            currency,
            description: `Subscription for ${planName} (${period})`
        }
    };

    console.log("Creating Razorpay Plan with options:", JSON.stringify(planOptions, null, 2));

    try {
        const plan = await razorpay.plans.create(planOptions);
        console.log("Plan created:", plan.id);
        return plan.id;
    } catch (e) {
        console.error("Error creating Razorpay plan", e);
        throw e;
    }
}

export const createOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;

        const options = {
            amount: amount * 100, // Amount in paise
            currency,
            receipt,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);

        return sendResponse(res, {
            message: "Order created successfully",
            data: order
        });
    } catch (error) {
        console.error("Razorpay Create Order Error:", error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Failed to create Razorpay order"
        });
    }
};

export const createSubscription = async (req, res) => {
    try {
        const { planId, billingCycle, amount, currency = 'INR' } = req.body;
        // planId here is our DB ID or name. Let's assume passed name or ID to look up price.
        // Actually frontend sends amount.
        // We need a Razorpay Plan ID.
        
        const period = billingCycle === 'yearly' ? 'yearly' : 'monthly';
        const razorpayPlanId = await getOrCreatePlan(`Plan ${planId}`, amount, currency, period);

        const subscription = await razorpay.subscriptions.create({
            plan_id: razorpayPlanId,
            total_count: period === 'yearly' ? 10 : 120, // Run for 10 years or 120 months
            quantity: 1,
            customer_notify: 1,
        });

        return sendResponse(res, {
            message: "Subscription created successfully",
            data: subscription
        });

    } catch (error) {
        console.error("Razorpay Subscription Error:", error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Failed to create subscription"
        });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Save transaction to DB here (e.g., BillingHistory)
            // For now, just return success
            return sendResponse(res, {
                message: "Payment verified successfully",
                data: { orderId: razorpay_order_id, paymentId: razorpay_payment_id }
            });
        } else {
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: "Invalid payment signature"
            });
        }
    } catch (error) {
        console.error("Razorpay Verify Error:", error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Payment verification failed"
        });
    }
};
