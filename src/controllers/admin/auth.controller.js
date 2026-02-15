import { sendResponse } from "../../utils/response.util.js"
import { STATUS_CODES } from "../../config/statusCodes.js"
import { AdminService } from "../../services/admin.service.js"
import { AdminValidator } from "../../validators/admin.validator.js"

const adminService = new AdminService();
const adminValidator = new AdminValidator();

// Login admin
export const login = async (req, res) => {
    try {
        adminValidator.validateLogin(req.body);

        const data = await adminService.login(req.body.email, req.body.password);
        return sendResponse(res, { message: 'Login successful', data });
    } catch (error) {
        console.error('Admin Login Error:', error);
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || 'Login failed';
        return sendResponse(res, { statusCode, success: false, message });
    }
}

// Register admin
export const register = async (req, res) => {
    try {
        adminValidator.validateRegister(req.body);
        const data = await adminService.register(req.body);
        return sendResponse(res, { statusCode: STATUS_CODES.CREATED, message: 'Registration successful', data });
    } catch (error) {
        console.error('Admin Registration Error:', error);
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || 'Registration failed';
        return sendResponse(res, { statusCode, success: false, message });
    }
}

export default {
    login,
    register
}
