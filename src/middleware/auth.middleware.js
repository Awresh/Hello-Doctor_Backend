import jwt from "jsonwebtoken";
import { STATUS_CODES } from "../config/statusCodes.js";
import { sendResponse } from "../utils/response.util.js";
import { AuthStrategyFactory } from "../services/auth-strategy.service.js";
import { JwtService } from "../services/jwt.service.js";

const jwtService = new JwtService();

export const verifyToken = async (req, res, next) => {
    // Skip token verification for specific paths
    const skipPaths = [
        '/inventory/stores/login',
        '/base-route',
        '/sections',
        '/auth/unified-login'
    ];
    
    if (skipPaths.includes(req.path) || req.path.startsWith('/item') || req.path.startsWith('/section')) {
        return next();
    }

    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.UNAUTHORIZED,
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.UNAUTHORIZED,
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        try {
            const decoded = jwtService.verifyToken(token);
            const strategy = AuthStrategyFactory.getStrategy(decoded);
            const authResult = await strategy.authenticate(decoded);
            
            Object.assign(req, authResult);
            next();
        } catch (err) {
            console.error('Token Verification Error:', err);
            const statusCode = err.statusCode || STATUS_CODES.UNAUTHORIZED;
            const message = err.message || 'Invalid token.';
            return sendResponse(res, { statusCode, success: false, message });
        }
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Internal server error during authentication.'
        });
    }
};

export const requireAdmin = (req, res, next) => {
    if (!req.admin) {
        return sendResponse(res, {
            statusCode: STATUS_CODES.FORBIDDEN,
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
};
