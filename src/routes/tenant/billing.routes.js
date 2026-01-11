import express from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import billingController from "../../controllers/tenant/billing.controller.js";

const router = express.Router();

// All billing routes require authentication
router.use(verifyToken);

// Dashboard & Plans
router.get("/dashboard", billingController.getBillingDashboard);
router.get("/plans", billingController.getPlans);

// Payment Methods
router.post("/payment-methods", billingController.addPaymentMethod);
router.delete("/payment-methods/:id", billingController.deletePaymentMethod);
router.patch("/payment-methods/:id/primary", billingController.setPrimaryMethod);

export default router;
