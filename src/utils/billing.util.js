import { Subscription, Plan, TenantUser, Store } from "../models/index.js";
import { Op } from "sequelize";

/**
 * Checks if a tenant has reached their plan limit for a specific resource.
 * @param {number} tenantId - The ID of the tenant.
 * @param {string} resourceType - 'users', 'doctors', 'stores', 'staff'.
 * @returns {Promise<{allowed: boolean, message: string, max: number, current: number}>}
 */
export const checkLimit = async (tenantId, resourceType) => {
    try {
        // 1. Get Active Subscription
        const subscription = await Subscription.findOne({
            where: { tenantId, status: 'active' },
            include: [{ model: Plan }]
        });

        if (!subscription || !subscription.Plan) {
            return { allowed: false, message: "No active subscription found.", max: 0, current: 0 };
        }

        const plan = subscription.Plan;
        let max = 0;
        let current = 0;

        switch (resourceType) {
            case 'users':
                max = plan.maxUsers;
                current = await TenantUser.count({ where: { tenantId } });
                break;
            case 'doctors':
                max = plan.maxDoctors;
                current = await TenantUser.count({
                    where: {
                        tenantId,
                        [Op.or]: [{ isDoctor: true }, { role: 3 }]
                    }
                });
                break;
            case 'stores':
                max = plan.maxStores;
                current = await Store.count({ where: { tenantId } });
                break;
            case 'staff':
                max = plan.maxStaff;
                current = await TenantUser.count({
                    where: {
                        tenantId,
                        isDoctor: false,
                        role: { [Op.ne]: 3 }
                    }
                });
                break;
            default:
                return { allowed: true, message: "Unknown resource type", max: 0, current: 0 };
        }

        // max 0 means unlimited
        if (max === 0) return { allowed: true, max, current };

        if (current >= max) {
            return {
                allowed: false,
                message: `Limit reached for ${resourceType}. Max allowed: ${max}`,
                max,
                current
            };
        }

        return { allowed: true, max, current };

    } catch (error) {
        console.error("Limit Check Error:", error);
        return { allowed: false, message: "Error checking limits", max: 0, current: 0 };
    }
};
