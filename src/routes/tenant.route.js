import express from 'express';
import { getTenantProfile, updateTenantProfile } from '../controllers/tenant/tenant.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { API_ROUTES } from '../config/serverConfig.js';

const router = express.Router();

// All tenant routes require authentication
router.use(verifyToken);

router.get(API_ROUTES.TENANT_PROFILE, getTenantProfile);
router.put(API_ROUTES.TENANT_PROFILE, updateTenantProfile);

export default router;
