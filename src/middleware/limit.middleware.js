import { TenantUser, Store } from "../models/index.js";
import { STATUS_CODES } from "../config/statusCodes.js";
import { sendResponse } from "../utils/response.util.js";

/**
 * Middleware to check if a tenant has reached their plan limit for a specific resource.
 * @param {string} resourceType - 'users', 'doctors', 'stores', 'staff'
 */
export const checkLimit = (resourceTypeOrFn) => {
    return async (req, res, next) => {
        try {
            const resourceType = typeof resourceTypeOrFn === 'function' ? resourceTypeOrFn(req) : resourceTypeOrFn;
            const tenant = req.tenant;
            if (!tenant) {
                return sendResponse(res, {
                    statusCode: STATUS_CODES.UNAUTHORIZED,
                    success: false,
                    message: "Tenant context missing."
                });
            }

            // Get effective limits (Plan + Custom Overrides)
            // Ensure getLimits exists, assuming it was added to Tenant prototype
            const limits = await tenant.getLimits();
            
            let limit = 0;
            let currentCount = 0;

            switch (resourceType) {
                case 'doctors':
                    limit = limits.maxDoctors;
                    currentCount = await TenantUser.count({ where: { tenantId: tenant.id, isDoctor: true } });
                    break;
                case 'users':
                    limit = limits.maxUsers;
                    currentCount = await TenantUser.count({ where: { tenantId: tenant.id } });
                    break;
                case 'stores':
                    limit = limits.maxStores;
                    currentCount = await Store.count({ where: { tenantId: tenant.id } });
                    break;
                case 'staff':
                    limit = limits.maxStaff;
                    currentCount = await TenantUser.count({ where: { tenantId: tenant.id, isDoctor: false } }); 
                    break;

                default:
                    // Unknown resource, maybe allow or block?
                    console.warn(`Unknown resource type for limit check: ${resourceType}`);
                    return next();
            }

            // 0 means unlimited? Or null means unlimited?
            // In Plan model, comment said "0 for unlimited".
            // But usually 0 means 0. Unlimited is often -1.
            // Let's assume 0 is NO LIMIT for now based on Plan model comment?
            // Plan model: "comment: '0 for unlimited'"
            if (limit === 0) {
                return next();
            }

            if (currentCount >= limit) {
                return sendResponse(res, {
                    statusCode: STATUS_CODES.FORBIDDEN,
                    success: false,
                    message: `Plan limit reached for ${resourceType}. Upgrade your plan to add more.`,
                    data: {
                        limit,
                        currentCount
                    }
                });
            }

            next();

        } catch (error) {
            console.error("Check Limit Error:", error);
            return sendResponse(res, {
                statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
                success: false,
                message: "Failed to check plan limits"
            });
        }
    };
};
