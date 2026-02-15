import { Role } from "../../models/tenant/role.model.js";
import { Tenant, BusinessType } from "../../models/index.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";

// Create Role
export const createRole = async (req, res) => {
    try {
        const { name, description, permissions, roleType } = req.body;
        const tenantId = req.tenant.id;

        // --- License Limit Check ---
        const tenant = await Tenant.findByPk(tenantId, {
            include: [{ model: BusinessType }] // Ensure relation is set up in models/index.js
        });

        if (tenant && tenant.BusinessType) {
            const maxRoles = tenant.customMaxRoles !== null ? tenant.customMaxRoles : (tenant.BusinessType.maxRoles || 0);
            if (maxRoles > 0) {
                const currentCount = await Role.count({ where: { tenantId, isActive: true } });
                if (currentCount >= maxRoles) {
                    return sendResponse(res, { 
                        statusCode: STATUS_CODES.FORBIDDEN, 
                        success: false, 
                        message: `Role creation limit reached. Your plan allows a maximum of ${maxRoles} roles.` 
                    });
                }
            }
        }
        // ---------------------------

        const role = await Role.create({
            name,
            description,
            roleType,
            permissions,
            tenantId
        });

        return sendResponse(res, {
            statusCode: STATUS_CODES.CREATED,
            message: "Role created successfully",
            data: role
        });
    } catch (error) {
        console.error("Create Role Error:", error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.CREATE_ERROR,
            error: error.message,
            stack: error.stack // Temporary for debugging
        });
    }
};

// Get All Roles
export const getRoles = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const roles = await Role.findAll({ where: { tenantId, isActive: true } });

        return sendResponse(res, {
            message: "Roles fetched successfully",
            data: roles
        });
    } catch (error) {
        console.error("Get roles error:", error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.FETCH_ERROR
        });
    }
};

// Update Role
export const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, permissions, roleType } = req.body;

        const role = await Role.findByPk(id);
        if (!role) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: "Role not found"
            });
        }

        await role.update({ name, description, permissions, roleType });

        return sendResponse(res, {
            message: "Role updated successfully",
            data: role
        });
    } catch (error) {
        console.error("Update role error:", error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.UPDATE_ERROR
        });
    }
};

// Delete Role
export const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Role.findByPk(id);

        if (!role) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: "Role not found"
            });
        }

        await role.update({ isActive: false }); // Soft delete

        return sendResponse(res, {
            message: "Role deleted successfully"
        });
    } catch (error) {
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.DELETE_ERROR
        });
    }
};
