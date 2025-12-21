import { Admin } from "../../models/index.js"
import { MESSAGES } from "../../config/serverConfig.js"
import { sendResponse } from "../../utils/response.util.js"
import { STATUS_CODES } from "../../config/statusCodes.js"
import jwt from "jsonwebtoken"

// Login admin
export const login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Email and password are required' })
        }

        const admin = await Admin.scope('withPassword').findOne({
            where: { email }
        })

        if (!admin) {
            return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Invalid credentials' })
        }

        if (!admin.isActive) {
            return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Account is inactive' })
        }

        const isPasswordValid = await admin.comparePassword(password)
        if (!isPasswordValid) {
            return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Invalid credentials' })
        }

        const token = jwt.sign(
            { adminId: admin.id, type: admin.type },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        )

        // Remove password from response
        const adminResponse = { ...admin.toJSON() }
        delete adminResponse.password

        return sendResponse(res, { message: 'Login successful', data: { admin: adminResponse, token } })
    } catch (error) {
        console.error('Admin Login Error:', error)
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: 'Login failed' })
    }
}

// Register admin
export const register = async (req, res) => {
    try {
        const { name, email, mobile, password, type } = req.body

        // Validate required fields
        if (!name || !email || !password) {
            return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Name, email, and password are required' })
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ where: { email } })
        if (existingAdmin) {
            return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Admin already exists with this email' })
        }

        // Create admin
        const admin = await Admin.create({
            name,
            email,
            mobile,
            password,
            type: type || 'subadmin' // Default to subadmin if not specified
        })

        // Generate token
        const token = jwt.sign(
            { adminId: admin.id, type: admin.type },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        )

        // Fetch admin without password
        const adminResponse = await Admin.findByPk(admin.id)

        return sendResponse(res, { statusCode: STATUS_CODES.CREATED, message: 'Registration successful', data: { admin: adminResponse, token } })
    } catch (error) {
        console.error('Admin Registration Error:', error)
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: 'Registration failed' })
    }
}

export default {
    login,
    register
}
