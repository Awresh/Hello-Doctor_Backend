
import express from 'express';
import { createPlan, updatePlan, getAdminPlans, deletePlan } from '../controllers/admin/plan.controller.js';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route to view plans (or maybe authenticated but generic)
// For now, let's allow anyone to see plans to pick one
router.get('/', getAdminPlans);

// Admin only routes
router.post('/', createPlan);
router.put('/:id', updatePlan);
router.delete('/:id',  deletePlan);

export default router;
