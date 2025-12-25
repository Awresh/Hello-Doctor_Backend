import express from 'express';
import { createRole, getRoles, updateRole, deleteRole } from '../../controllers/tenant/role.controller.js';
import { verifyToken } from '../../middleware/auth.middleware.js';

import { API_ROUTES } from '../../config/serverConfig.js';

const router = express.Router();

router.post(API_ROUTES.ROLES, verifyToken, createRole);
router.get(API_ROUTES.ROLES, verifyToken, getRoles);
router.patch(API_ROUTES.ROLE_BY_ID, verifyToken, updateRole);
router.delete(API_ROUTES.ROLE_BY_ID, verifyToken, deleteRole);

export default router;
