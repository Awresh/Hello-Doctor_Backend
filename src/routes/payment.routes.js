import express from 'express';
import { createOrder, verifyPayment, createSubscription } from '../controllers/payment/razorpay.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route for signup
router.post('/razorpay/order/public', createOrder);
router.post('/razorpay/subscription/public', createSubscription);

router.post('/razorpay/order', verifyToken, createOrder);
router.post('/razorpay/verify', verifyToken, verifyPayment);

export default router;
