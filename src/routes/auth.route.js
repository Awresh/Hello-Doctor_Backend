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



export default router