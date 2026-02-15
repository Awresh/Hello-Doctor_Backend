import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { TenantService } from "../../services/tenant.service.js";

const tenantService = new TenantService();

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

        const tenant = await tenantService.getTenantProfile(tenantId);
        return sendResponse(res, { message: "Tenant profile fetched successfully", data: tenant });
    } catch (error) {
        console.error('Get Tenant Profile Error:', error);
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || MESSAGES.FETCH_ERROR;
        return sendResponse(res, { statusCode, success: false, message });
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

        const updatedTenant = await tenantService.updateTenantProfile(tenantId, req.body);
        return sendResponse(res, { message: "Tenant profile updated successfully", data: updatedTenant });
    } catch (error) {
        console.error('Update Tenant Profile Error:', error);
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || MESSAGES.UPDATE_ERROR;
        return sendResponse(res, { statusCode, success: false, message });
    }
};

// Get License Usage
export const getLicenseUsage = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) {
            return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: "Tenant not found" });
        }

        const data = await tenantService.getLicenseUsage(tenantId);
        return sendResponse(res, { message: "License usage fetched successfully", data });
    } catch (error) {
        console.error('Get License Usage Error:', error);
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || MESSAGES.FETCH_ERROR;
        return sendResponse(res, { statusCode, success: false, message });
    }
};

export default {
    getTenantProfile,
    updateTenantProfile,
    getLicenseUsage
};
