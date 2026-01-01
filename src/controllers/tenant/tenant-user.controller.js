

import { TenantUser, Tenant, BusinessType, Role, DoctorDetails } from "../../models/index.js";
import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { Op } from "sequelize";

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

        const { name, role, email, phone, password, permissions, about, description, experience, speciality, doctorId, doctorDetails } = req.body;

        // Log the payload for debugging if needed
        // console.log("Creating TenantUser Payload:", { name, role, email, phone, hasPassword: !!password, permissionsCount: permissions?.length });

        if (!name || !role) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: "Name and role are required"
            });
        }

        // Determine if user is a doctor based on Role Type
        let isDoctor = false;
        // Check if role is an ID (integer) or string logic fallback
        if (!isNaN(role)) {
             const selectedRole = await Role.findByPk(role);
             if (selectedRole && selectedRole.roleType === 'doctor') {
                 isDoctor = true;
             }
        }
        // Fallback or legacy check
        if (!isDoctor) {
             isDoctor = String(role).toLowerCase() === 'doctor' || role == 3 || role === '3';
        }

        // --- License Limit Check ---
        const tenant = await Tenant.findByPk(tenantId, {
            include: [{ model: BusinessType }]
        });

        if (tenant && tenant.BusinessType) {
            const maxUsers = tenant.customMaxUsers !== null ? tenant.customMaxUsers : (tenant.BusinessType.maxUsers || 0);
            const maxDoctors = tenant.customMaxDoctors !== null ? tenant.customMaxDoctors : (tenant.BusinessType.maxDoctors || 0);
            const maxStaff = tenant.customMaxStaff !== null ? tenant.customMaxStaff : (tenant.BusinessType.maxStaff || 0);

            // 1. Total Users Check
            if (maxUsers > 0) {
                const totalUsers = await TenantUser.count({ where: { tenantId } });
                if (totalUsers >= maxUsers) {
                    return sendResponse(res, { statusCode: STATUS_CODES.FORBIDDEN, success: false, message: `User creation limit reached. Max allowed: ${maxUsers}` });
                }
            }
            
            // 2. Doctor Limit Check
            if (isDoctor && maxDoctors > 0) {
                // Count existing doctors by isDoctor flag OR legacy role check
                const doctorCount = await TenantUser.count({ 
                    where: { 
                        tenantId,
                        [Op.or]: [
                            { isDoctor: true },
                            { role: { [Op.iLike]: 'doctor' } },
                            { role: '3' }
                        ]
                    } 
                });
                
                if (doctorCount >= maxDoctors) {
                    return sendResponse(res, { statusCode: STATUS_CODES.FORBIDDEN, success: false, message: `Doctor creation limit reached. Max allowed: ${maxDoctors}` });
                }
            }

            // 3. Staff Limit Check (Non-Doctors)
            if (!isDoctor && maxStaff > 0) {
                 const staffCount = await TenantUser.count({ 
                    where: { 
                        tenantId,
                         [Op.and]: [
                            { isDoctor: false }, // Explicitly not doctor flag
                            { role: { [Op.notILike]: 'doctor' } },
                            { role: { [Op.ne]: '3' } }
                        ]
                    } 
                });

                if (staffCount >= maxStaff) {
                    return sendResponse(res, { statusCode: STATUS_CODES.FORBIDDEN, success: false, message: `Staff creation limit reached. Max allowed: ${maxStaff}` });
                }
            }
        }
        // ---------------------------

        const tenantUser = await TenantUser.create({
            name,
            role,
            name,
            role,
            email,
            phone,
            password, // Password hashing is handled by BeforeSave hook in model
            permissions: permissions || [], // Default to empty array if not provided
            about,
            description,
            experience,
            speciality,
            tenantId,
            doctorId,
            isDoctor // Set flag
        });

        // Create Doctor Details if provided and is doctor
        if (isDoctor && doctorDetails) {
            await DoctorDetails.create({
                tenantUserId: tenantUser.id,
                ...doctorDetails
            });
        }

        // Fetch created user with details for response
        const createdUser = await TenantUser.findByPk(tenantUser.id, {
             include: [{ model: DoctorDetails, as: 'doctorDetails' }]
        });

        return sendResponse(res, {
            statusCode: STATUS_CODES.CREATED,
            message: "Tenant user created successfully",
            data: createdUser
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
            where: { tenantId },
            include: [{ model: DoctorDetails, as: 'doctorDetails' }]
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
            where: { id, tenantId },
            include: [{ model: DoctorDetails, as: 'doctorDetails' }]
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
        const { name, role, email, phone, password, permissions, about, description, experience, speciality, doctorId, doctorDetails } = req.body;

        const user = await TenantUser.findOne({
            where: { id, tenantId },
            include: [{ model: DoctorDetails, as: 'doctorDetails' }] // Include to check existence
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
            phone,
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
        }

        // Using user.update instance method usually triggers hooks
        await user.update(updateData);

        // Update Doctor Details if provided
        if (doctorDetails) {
            if (user.doctorDetails) {
                // Update existing
                await user.doctorDetails.update(doctorDetails);
            } else {
                // Create new
                await DoctorDetails.create({
                    tenantUserId: user.id,
                    ...doctorDetails
                });
            }
        }

        // Re-fetch updated user
         const updatedUser = await TenantUser.findByPk(id, {
            include: [{ model: DoctorDetails, as: 'doctorDetails' }]
        });

        return sendResponse(res, {
            message: "Tenant user updated successfully",
            data: updatedUser
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
