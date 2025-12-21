import { Tenant, BusinessType } from "../../models/index.js";
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

export default {
    getTenantProfile,
    updateTenantProfile
};
