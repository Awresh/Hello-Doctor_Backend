import jwt from "jsonwebtoken";
import { Tenant, Store, BusinessType, Admin, TenantUser } from "../models/index.js";
import { STATUS_CODES } from "../config/statusCodes.js";
import { sendResponse } from "../utils/response.util.js";

export const verifyToken = async (req, res, next) => {
    // Skip token verification for store login
    if (req.path === '/inventory/stores/login') {
        return next();
    }
    if (req.path === '/base-route' || req.path === '/sections' || req.path==='/auth/unified-login' || req.path.startsWith('/item') || req.path.startsWith('/section')) {
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
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            // console.log("decoded",decoded);
            if (decoded.storeId) {
                const store = await Store.findByPk(decoded.storeId, {
                    include: [{
                        model: Tenant,
                        include: [{ model: BusinessType, attributes: ['name'] }]
                    }]
                });

                if (!store) {
                    return sendResponse(res, {
                        statusCode: STATUS_CODES.UNAUTHORIZED,
                        success: false,
                        message: 'Invalid token. Store not found.'
                    });
                }

                req.store = store;
                req.tenant = store.Tenant; // Maintain compatibility
            } else if (decoded.userId) { // Handle TenantUser
                const user = await TenantUser.findByPk(decoded.userId, {
                    include: [{
                        model: Tenant,
                        include: [{ model: BusinessType, attributes: ['name'] }]
                    }]
                });

                if (!user) {
                    return sendResponse(res, {
                        statusCode: STATUS_CODES.UNAUTHORIZED,
                        success: false,
                        message: 'Invalid token. User not found.'
                    });
                }

                if (!user.Tenant || !user.Tenant.isActive) {
                    return sendResponse(res, {
                        statusCode: STATUS_CODES.UNAUTHORIZED,
                        success: false,
                        message: 'Business account is inactive.'
                    });
                }

                req.user = user;
                req.tenant = user.Tenant;
                req.tenant.userId = user.id;
            } else if (decoded.adminId) {
                const admin = await Admin.findByPk(decoded.adminId);

                if (!admin) {
                    return sendResponse(res, {
                        statusCode: STATUS_CODES.UNAUTHORIZED,
                        success: false,
                        message: 'Invalid token. Admin not found.'
                    });
                }

                if (!admin.isActive) {
                    return sendResponse(res, {
                        statusCode: STATUS_CODES.UNAUTHORIZED,
                        success: false,
                        message: 'Admin account is inactive.'
                    });
                }

                req.admin = admin;
            } else {
                const tenant = await Tenant.findByPk(decoded.tenantId, {
                    include: [{ model: BusinessType, attributes: ['name'] }]
                });

                if (!tenant) {
                    return sendResponse(res, {
                        statusCode: STATUS_CODES.UNAUTHORIZED,
                        success: false,
                        message: 'Invalid token. Tenant not found.'
                    });
                }


                req.tenant = tenant;
            }

            next();
        } catch (err) {
            console.error('Token Verification Error:', err);
            return sendResponse(res, {
                statusCode: STATUS_CODES.UNAUTHORIZED,
                success: false,
                message: 'Invalid token.'
            });
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
