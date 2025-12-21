import { TenantUser } from "../../models/tenant/tenent.user.model.js";
import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { MESSAGES } from "../../config/serverConfig.js";

/**
 * Helper to get and validate tenantId from request
 */
const getTenantId = (req) => {
    const tenantId = req.headers['x-tenant-id'] || req.body?.tenantId || req.query?.tenantId || req.tenant?.id;
    return tenantId;
};

// Create new tenant user
export const createTenantUser = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        if (!tenantId) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: "Tenant ID is required"
            });
        }

        const { name, role, email, password, permissions, about, description, experience, speciality, doctorId } = req.body;

        // Log the payload for debugging if needed
        // console.log("Creating TenantUser Payload:", { name, role, email, hasPassword: !!password, permissionsCount: permissions?.length });

        if (!name || !role) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: "Name and role are required"
            });
        }

        const tenantUser = await TenantUser.create({
            name,
            role,
            email,
            password, // Password hashing is handled by BeforeSave hook in model
            permissions: permissions || [], // Default to empty array if not provided
            about,
            description,
            experience,
            speciality,
            tenantId,
            doctorId
        });

        return sendResponse(res, {
            statusCode: STATUS_CODES.CREATED,
            message: "Tenant user created successfully",
            data: tenantUser
        });
    } catch (error) {
        console.error('Create Tenant User Error:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.CREATE_ERROR
        });
    }
};

// Get all users for a tenant
export const getAllTenantUsers = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        if (!tenantId) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: "Tenant ID is required"
            });
        }

        const users = await TenantUser.findAll({
            where: { tenantId }
        });

        return sendResponse(res, {
            message: "Tenant users fetched successfully",
            data: users
        });
    } catch (error) {
        console.error('Get All Tenant Users Error:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.FETCH_ERROR
        });
    }
};

// Get tenant user by ID
export const getTenantUserById = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        if (!tenantId) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: "Tenant ID is required"
            });
        }

        const { id } = req.params;
        const user = await TenantUser.findOne({
            where: { id, tenantId }
        });

        if (!user) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: "Tenant user not found"
            });
        }

        return sendResponse(res, {
            message: "Tenant user fetched successfully",
            data: user
        });
    } catch (error) {
        console.error('Get Tenant User By ID Error:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.FETCH_ERROR
        });
    }
};

// Update tenant user
export const updateTenantUser = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        if (!tenantId) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: "Tenant ID is required"
            });
        }

        const { id } = req.params;
        const { name, role, email, password, permissions, about, description, experience, speciality, doctorId } = req.body;

        const user = await TenantUser.findOne({
            where: { id, tenantId }
        });

        if (!user) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: "Tenant user not found"
            });
        }

        const updateData = {
            name,
            role,
            email,
            permissions,
            about,
            description,
            experience,
            speciality,
            doctorId
        };

        // Only update password if provided and not empty
        if (password && password.trim() !== '') {
            updateData.password = password;
            // IMPORTANT: Sequelize hook 'beforeSave' includes 'beforeUpdate' which runs on save(). 
            // However, `update()` method should also trigger hooks if individualHooks: true is set, or beforeSave/beforeUpdate are set up correctly. 
            // The model uses `beforeSave`. Let's ensure it catches this.
        }

        // Using user.update instance method usually triggers hooks
        await user.update(updateData);

        return sendResponse(res, {
            message: "Tenant user updated successfully",
            data: user
        });
    } catch (error) {
        console.error('Update Tenant User Error:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.UPDATE_ERROR
        });
    }
};

// Delete tenant user
export const deleteTenantUser = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        if (!tenantId) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: "Tenant ID is required"
            });
        }

        const { id } = req.params;
        const user = await TenantUser.findOne({
            where: { id, tenantId }
        });

        if (!user) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: "Tenant user not found"
            });
        }

        await user.destroy();

        return sendResponse(res, {
            message: "Tenant user deleted successfully"
        });
    } catch (error) {
        console.error('Delete Tenant User Error:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.DELETE_ERROR
        });
    }
};

export default {
    createTenantUser,
    getAllTenantUsers,
    getTenantUserById,
    updateTenantUser,
    deleteTenantUser
};
