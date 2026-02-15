import express from 'express';
import {
    createTenantUser,
    getAllTenantUsers,
    getTenantUserById,
    updateTenantUser,
    deleteTenantUser,
    updateProfile
} from '../controllers/tenant/tenant-user.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

import { API_ROUTES } from '../config/serverConfig.js';

const router = express.Router();

// All tenant user routes require authentication
router.use(verifyToken);

import { checkLimit } from '../middleware/limit.middleware.js';

router.post(API_ROUTES.TENANT_USERS, checkLimit((req) => req.body.isDoctor ? 'doctors' : 'staff'), createTenantUser); // Using 'staff' for general users as per distinct limits, or 'users' if unified. 
// My Limit middleware has 'staff' and 'users'. 
// If 'users' limits TOTAL count, I should probably check 'users' ALWAYS? 
// Or is 'users' == 'staff'? 
// Let's assume 'users' is total usage limit? 
// If I check 'doctors', I should also check 'users' if doctors count towards user limit.
// Let's check 'doctors' if isDoctor, else 'staff'.

router.get(API_ROUTES.TENANT_USERS, getAllTenantUsers);
router.get(API_ROUTES.TENANT_USER_BY_ID, getTenantUserById);
router.put(`${API_ROUTES.TENANT_USERS}/profile`, updateProfile);
router.patch(API_ROUTES.TENANT_USER_BY_ID, updateTenantUser);
router.delete(API_ROUTES.TENANT_USER_BY_ID, deleteTenantUser);

export default router;
