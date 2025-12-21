import express from 'express';
import {
    createTenantUser,
    getAllTenantUsers,
    getTenantUserById,
    updateTenantUser,
    deleteTenantUser
} from '../controllers/tenant/tenant-user.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

import { API_ROUTES } from '../config/serverConfig.js';

const router = express.Router();

// All tenant user routes require authentication
router.use(verifyToken);

router.post(API_ROUTES.TENANT_USERS, createTenantUser);
router.get(API_ROUTES.TENANT_USERS, getAllTenantUsers);
router.get(API_ROUTES.TENANT_USER_BY_ID, getTenantUserById);
router.put(API_ROUTES.TENANT_USER_BY_ID, updateTenantUser);
router.delete(API_ROUTES.TENANT_USER_BY_ID, deleteTenantUser);

export default router;
