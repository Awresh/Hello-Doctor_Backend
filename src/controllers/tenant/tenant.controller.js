import { Tenant, BusinessType, Role, Store, TenantUser } from "../../models/index.js";
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
            include: [{ model: BusinessType }]
        });

        if (!tenant) {
            return sendResponse(res, { statusCode: STATUS_CODES.NOT_FOUND, success: false, message: "Tenant not found" });
        }

        const limits = {
            maxRoles: tenant.customMaxRoles !== null ? tenant.customMaxRoles : (tenant.BusinessType?.maxRoles || 0),
            maxUsers: tenant.customMaxUsers !== null ? tenant.customMaxUsers : (tenant.BusinessType?.maxUsers || 0),
            maxStores: tenant.customMaxStores !== null ? tenant.customMaxStores : (tenant.BusinessType?.maxStores || 0),
            maxDoctors: tenant.customMaxDoctors !== null ? tenant.customMaxDoctors : (tenant.BusinessType?.maxDoctors || 0),
            maxStaff: tenant.customMaxStaff !== null ? tenant.customMaxStaff : (tenant.BusinessType?.maxStaff || 0),
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
                    [Op.or]: [
                        { role: { [Op.iLike]: 'doctor' } },
                        { role: '3' }
                    ]
                } 
            }),
            TenantUser.count({ 
                where: { 
                    tenantId,
                     [Op.and]: [
                        { role: { [Op.notILike]: 'doctor' } },
                        { role: { [Op.ne]: '3' } }
                    ]
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
