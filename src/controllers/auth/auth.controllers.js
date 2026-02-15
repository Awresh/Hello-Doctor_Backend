import { sendResponse } from "../../utils/response.util.js"
import { STATUS_CODES } from "../../config/statusCodes.js"
import { AuthService } from "../../services/auth.service.js"
import { AuthValidator } from "../../validators/auth.validator.js"

const authService = new AuthService();
const authValidator = new AuthValidator();

// Login tenant
export const login = async (req, res) => {
  try {
    authValidator.validateLogin(req.body);
    const data = await authService.login(req.body.email, req.body.password);
    return sendResponse(res, { message: 'Login successful', data });
  } catch (error) {
    console.log('Login Error', error);
    const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Login failed';
    return sendResponse(res, { statusCode, success: false, message });
  }
}

// Register tenant
export const register = async (req, res) => {
  try {
    authValidator.validateRegister(req.body);
    const data = await authService.register(req.body);
    return sendResponse(res, { statusCode: STATUS_CODES.CREATED, message: 'Registration successful', data });
  } catch (error) {
    console.error('Registration Error:', error);
    const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Registration failed';
    return sendResponse(res, { statusCode, success: false, message });
  }
}

// Check if email already exists
export const checkEmail = async (req, res) => {
  try {
    authValidator.validateEmail(req.body);
    await authService.checkEmail(req.body.email);
    return sendResponse(res, { statusCode: STATUS_CODES.OK, success: true, message: 'Email is available' });
  } catch (error) {
    console.error('Email Check Error:', error);
    const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Failed to check email';
    return sendResponse(res, { statusCode, success: false, message });
  }
}

export default {
  login,
  register,
  checkEmail
}