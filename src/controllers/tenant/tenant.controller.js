import { Tenant, BusinessType, Role, Store, TenantUser, Subscription, Plan } from "../../models/index.js";
import { Op } from "sequelize";
import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { MESSAGES } from "../../config/serverConfig.js";

// Get tenant profile
export const getTenantProfile = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.UNAUTHORIZED,
                success: false,
                message: "Tenant not found in request"
            });
        }

        const tenant = await Tenant.findByPk(tenantId, {
            include: [{ model: BusinessType, attributes: ['name'] }]
        });

        if (!tenant) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: "Tenant not found"
            });
        }

        return sendResponse(res, {
            message: "Tenant profile fetched successfully",
            data: tenant
        });
    } catch (error) {
        console.error('Get Tenant Profile Error:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.FETCH_ERROR
        });
    }
};

// Update tenant profile
export const updateTenantProfile = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.UNAUTHORIZED,
                success: false,
                message: "Tenant not found in request"
            });
        }

        const { name, businessName, businessTypeId } = req.body;

        const tenant = await Tenant.findByPk(tenantId);
        if (!tenant) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: "Tenant not found"
            });
        }

        await tenant.update({
            name,
            businessName,
            businessTypeId
        });

        const updatedTenant = await Tenant.findByPk(tenantId, {
            include: [{ model: BusinessType, attributes: ['name'] }]
        });

        return sendResponse(res, {
            message: "Tenant profile updated successfully",
            data: updatedTenant
        });
    } catch (error) {
        console.error('Update Tenant Profile Error:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.UPDATE_ERROR
        });
    }
};

// Get License Usage
export const getLicenseUsage = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) {
            return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: "Tenant not found" });
        }

        const tenant = await Tenant.findByPk(tenantId, {
            include: [
                { model: BusinessType },
                { 
                    model: Subscription, 
                    where: { status: 'active' }, 
                    required: false, // Left join, so we get tenant even if no active subscription
                    include: [{ model: Plan }]
                }
            ]
        });

        if (!tenant) {
            return sendResponse(res, { statusCode: STATUS_CODES.NOT_FOUND, success: false, message: "Tenant not found" });
        }

        const activePlan = tenant.Subscription?.Plan;

        const limits = {
            maxRoles: tenant.customMaxRoles ?? activePlan?.maxRoles ?? tenant.BusinessType?.maxRoles ?? 0,
            maxUsers: tenant.customMaxUsers ?? activePlan?.maxUsers ?? tenant.BusinessType?.maxUsers ?? 0,
            maxStores: tenant.customMaxStores ?? activePlan?.maxStores ?? tenant.BusinessType?.maxStores ?? 0,
            maxDoctors: tenant.customMaxDoctors ?? activePlan?.maxDoctors ?? tenant.BusinessType?.maxDoctors ?? 0,
            maxStaff: tenant.customMaxStaff ?? activePlan?.maxStaff ?? tenant.BusinessType?.maxStaff ?? 0,
            whatsappCredits: tenant.whatsappCredits || 0
        };

        const [
            rolesCount,
            storesCount,
            usersCount,
            doctorsCount,
            staffCount
        ] = await Promise.all([
            Role.count({ where: { tenantId, isActive: true } }),
            Store.count({ where: { tenantId, isActive: true } }),
            TenantUser.count({ where: { tenantId } }),
            TenantUser.count({
                where: {
                    tenantId,
                    isDoctor: true
                }
            }),
            TenantUser.count({
                where: {
                    tenantId,
                    isDoctor: false
                }
            })
        ]);

        return sendResponse(res, {
            message: "License usage fetched successfully",
            data: {
                limits,
                usage: {
                    roles: rolesCount,
                    stores: storesCount,
                    users: usersCount,
                    doctors: doctorsCount,
                    staff: staffCount
                }
            }
        });

    } catch (error) {
        console.error('Get License Usage Error:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.FETCH_ERROR
        });
    }
};

export default {
    getTenantProfile,
    updateTenantProfile,
    getLicenseUsage
};
