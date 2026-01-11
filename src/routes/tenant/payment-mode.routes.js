
import express from 'express';
import { getPaymentModes, createPaymentMode, updatePaymentMode, deletePaymentMode } from '../../controllers/tenant/payment-mode.controller.js';
import { verifyToken } from '../../middleware/auth.middleware.js';
import { API_ROUTES } from '../../config/serverConfig.js';

const router = express.Router();

router.get(API_ROUTES.PAYMENT_MODES, verifyToken, getPaymentModes);
router.post(API_ROUTES.PAYMENT_MODES, verifyToken, createPaymentMode);
router.patch(API_ROUTES.PAYMENT_MODE_BY_ID, verifyToken, updatePaymentMode);
router.delete(API_ROUTES.PAYMENT_MODE_BY_ID, verifyToken, deletePaymentMode);

export default router;
