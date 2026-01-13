import { Plan, Subscription, PaymentMethod, BillingHistory, TenantUser, Role, Store, Tenant, CallBillingHistory } from "../../models/index.js";
import { Op } from "sequelize";
import Razorpay from "razorpay";
import crypto from 'crypto';
import { STATUS_CODES } from "../../config/statusCodes.js";
import { sendResponse } from "../../utils/response.util.js";
import { encrypt, decrypt } from "../../utils/crypto.util.js";

// Get Billing Dashboard Info (Plan + Usage + Payment + History)
export const getBillingDashboard = async (req, res) => {
    try {
        const tenantId = req.tenant.id;

        // 1. Get Plan & Subscription
        const subscription = await Subscription.findOne({
            where: { tenantId },
            include: [{ model: Plan }]
        });

        // 2. Get Payment Methods
        const paymentMethods = await PaymentMethod.findAll({
            where: { tenantId },
            order: [['isPrimary', 'DESC'], ['createdAt', 'DESC']]
        });

        // Decrypt data for frontend display
        const decryptedMethods = paymentMethods.map(pm => {
            const method = pm.toJSON();
            if (method.encryptedData && method.iv) {
                try {
                    const decryptedString = decrypt(method.encryptedData, method.iv);
                    if (decryptedString) {
                        const details = JSON.parse(decryptedString);
                        // Merge decrypted details meant for display
                        method.cardNumber = details.cardNumber || method.last4;
                        method.cvv = details.cvv;
                    }
                } catch (e) {
                    console.error("Failed to decrypt method", method.id, e);
                }
            }
            return method;
        });

        // 3. Get Billing History
        const billingHistory = await BillingHistory.findAll({
            where: { tenantId },
            order: [['invoiceDate', 'DESC']],
            limit: 10
        });

        // 4. Usage Calculation
        // Using same logic as getLicenseUsage
        const [doctorCount, storeCount, userCount, staffCount, rolesCount] = await Promise.all([
            TenantUser.count({ where: { tenantId, isDoctor: true } }),
            Store.count({ where: { tenantId, isActive: true } }),
            TenantUser.count({ where: { tenantId } }),
            TenantUser.count({ where: { tenantId, isDoctor: false } }),
            Role.count({ where: { tenantId, isActive: true } })
        ]);

        const usage = {
            doctors: doctorCount,
            stores: storeCount,
            users: userCount,
            staff: staffCount,
            roles: rolesCount
        };

        // 5. Get current wallet balance
        const tenant = await Tenant.findByPk(tenantId, { attributes: ['walletBalance'] });

        // 6. Get Call Billing History
        const callBillingHistory = await CallBillingHistory.findAll({
            where: { tenantId },
            include: [
                {
                    model: TenantUser,
                    as: 'Caller',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: TenantUser,
                    as: 'Receiver',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['timestamp', 'DESC']],
            limit: 20
        });

        return sendResponse(res, {
            message: "Billing dashboard fetched",
            data: {
                subscription,
                paymentMethods: decryptedMethods,
                billingHistory,
                usage,
                walletBalance: tenant ? tenant.walletBalance : 0,
                callBillingHistory
            }
        });

    } catch (error) {
        console.error("Billing Dashboard Error:", error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Failed to fetch billing info"
        });
    }
};

// List all plans
export const getPlans = async (req, res) => {
    try {
        const plans = await Plan.findAll({ where: { isActive: true } });
        return sendResponse(res, { data: plans });
    } catch (error) {
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Failed to fetch plans"
        });
    }
};

// Add Payment Method
export const addPaymentMethod = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { type, label, holderName, cardNumber, expiryMonth, expiryYear, cvv, brand, upiId, isPrimary } = req.body;

        // If setting as primary, unset others first
        if (isPrimary) {
            await PaymentMethod.update({ isPrimary: false }, { where: { tenantId } });
        }

        // Prepare data for encryption
        let encryptedData = null;
        let iv = null;
        let last4 = null;

        if (type === 'Card' && cardNumber) {
            const sensitiveData = {
                cardNumber,
                cvv
            };
            const encryptionResult = encrypt(JSON.stringify(sensitiveData));
            if (encryptionResult.errorCode) {
                throw new Error("Encryption failed");
            }
            encryptedData = encryptionResult.content;
            iv = encryptionResult.iv;
            last4 = cardNumber.slice(-4);
        }

        const method = await PaymentMethod.create({
            tenantId,
            type,
            label,
            holderName,
            last4: last4 || req.body.last4, // Use calculated last4 or provided
            expiryMonth,
            expiryYear,
            brand,
            upiId,
            isPrimary,
            encryptedData,
            iv
        });

        return sendResponse(res, {
            statusCode: STATUS_CODES.CREATED,
            message: "Payment method added successfully",
            data: method
        });

    } catch (error) {
        console.error("Add Payment Method Error:", error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Failed to add payment method"
        });
    }
};

// Delete Payment Method
export const deletePaymentMethod = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;

        const method = await PaymentMethod.findOne({ where: { id, tenantId } });
        if (!method) {
            return sendResponse(res, { statusCode: STATUS_CODES.NOT_FOUND, success: false, message: "Payment method not found" });
        }

        if (method.isPrimary) {
            return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: "Cannot delete primary payment method" });
        }

        await method.destroy();
        return sendResponse(res, { message: "Payment method deleted" });

    } catch (error) {
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Failed to delete payment method"
        });
    }
};

// Set Primary Method
export const setPrimaryMethod = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;

        await PaymentMethod.update({ isPrimary: false }, { where: { tenantId } });
        await PaymentMethod.update({ isPrimary: true }, { where: { id, tenantId } });

        return sendResponse(res, { message: "Primary payment method updated" });

    } catch (error) {
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Failed to update primary method"
        });
    }
};

// Wallet Recharge: Create Order
export const createWalletRechargeOrder = async (req, res) => {
    try {
        const { amount } = req.body; // Amount in Tokens (1 Token = 1 INR)

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.error("Razorpay keys missing in .env");
            return sendResponse(res, {
                statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
                success: false,
                message: "Payment gateway configuration missing"
            });
        }

        if (!amount || amount <= 0) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: "Invalid amount"
            });
        }

        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: amount * 100, // Amount in paise
            currency: "INR",
            receipt: `wallet_rc_${Date.now()}_${req.tenant.id}`,
            notes: {
                tenantId: req.tenant.id,
                type: 'wallet_recharge'
            }
        };

        const order = await instance.orders.create(options);

        return sendResponse(res, {
            message: "Order created",
            data: order
        });

    } catch (error) {
        console.error("Create Wallet Order Error:", error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Failed to create payment order"
        });
    }
};

// Wallet Recharge: Verify Payment
export const verifyWalletRecharge = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
        const tenantId = req.tenant.id;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // 1. Update Wallet Balance
            const tenant = await Tenant.findByPk(tenantId);
            const rechargeAmount = parseInt(amount); // Tokens

            await tenant.increment('walletBalance', { by: rechargeAmount });

            // 2. Log Transaction (Optional but recommended - using BillingHistory or new WalletTransaction model)
            // For now, let's add to BillingHistory so it shows up in the list
            await BillingHistory.create({
                tenantId,
                invoiceNumber: `WAL-${Date.now()}`,
                invoiceDate: new Date(),
                amount: rechargeAmount,
                status: 'Paid',
                description: `Wallet Recharge - ${rechargeAmount} Tokens`
            });

            return sendResponse(res, {
                message: "Wallet recharged successfully",
                data: {
                    newBalance: tenant.walletBalance + rechargeAmount
                }
            });
        } else {
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: "Invalid payment signature"
            });
        }

    } catch (error) {
        console.error("Verify Wallet Payment Error:", error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Failed to verify payment"
        });
    }
};

export default {
    getBillingDashboard,
    getPlans,
    addPaymentMethod,
    deletePaymentMethod,
    setPrimaryMethod,
    createWalletRechargeOrder,
    verifyWalletRecharge
};
