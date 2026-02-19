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

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    authValidator.validateForgotPassword(req.body);
    await authService.forgotPassword(req.body.email);
    return sendResponse(res, { statusCode: STATUS_CODES.OK, success: true, message: 'Password reset link sent successfully' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Failed to process forgot password request';
    return sendResponse(res, { statusCode, success: false, message });
  }
}

// Reset password
export const resetPassword = async (req, res) => {
  try {
    authValidator.validateResetPassword(req.body);
    await authService.resetPassword(req.body.token, req.body.password);
    return sendResponse(res, { statusCode: STATUS_CODES.OK, success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Failed to reset password';
    return sendResponse(res, { statusCode, success: false, message });
  }
}

// Send OTP
export const sendOTP = async (req, res) => {
  try {
    authValidator.validateEmail(req.body);
    await authService.sendOTP(req.body.email);
    return sendResponse(res, { statusCode: STATUS_CODES.OK, success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP Error:', error);
    const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Failed to send OTP';
    return sendResponse(res, { statusCode, success: false, message });
  }
}

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      throw { statusCode: 400, message: 'Email and OTP are required' };
    }
    await authService.verifyOTP(email, otp);
    return sendResponse(res, { statusCode: STATUS_CODES.OK, success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Invalid or expired OTP';
    return sendResponse(res, { statusCode, success: false, message });
  }
}

export default {
  login,
  register,
  checkEmail,
  forgotPassword,
  resetPassword,
  sendOTP,
  verifyOTP
}