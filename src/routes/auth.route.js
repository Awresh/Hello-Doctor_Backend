import express from 'express'
import { API_ROUTES } from '../config/serverConfig.js'
import authController from '../controllers/auth/auth.controllers.js'

const router = express.Router()


// POST / - Login user
router.post(API_ROUTES.LOGIN, authController.login)


// POST / - Register user
router.post(API_ROUTES.REGISTER, authController.register)

// POST / - Check email
router.post('/auth/check-email', authController.checkEmail)

// POST / - Forgot password
router.post(API_ROUTES.FORGOT_PASSWORD, authController.forgotPassword)

// POST / - Reset password
router.post(API_ROUTES.RESET_PASSWORD, authController.resetPassword)

// POST / - Send OTP
router.post('/auth/send-otp', authController.sendOTP)

// POST / - Verify OTP
router.post('/auth/verify-otp', authController.verifyOTP)

export default router