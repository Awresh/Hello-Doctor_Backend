import express from 'express'
import { API_ROUTES } from '../config/serverConfig.js'
import authController from '../controllers/admin/auth.controller.js'

const router = express.Router()

// POST /admin/login - Login admin
router.post(API_ROUTES.ADMIN_LOGIN, authController.login)

// POST /admin/register - Register admin
router.post(API_ROUTES.ADMIN_REGISTER, authController.register)

export default router
