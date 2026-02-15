

import { TenantUser, Tenant, BusinessType, Role, DoctorDetails, DoctorService, Product } from "../../models/index.js";
import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { Op } from "sequelize";
import { checkLimit } from "../../utils/billing.util.js";

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

        // --- License Limit Check (Subscription Based) ---
        // 1. Total Users Check
        const userCheck = await checkLimit(tenantId, 'users');
        if (!userCheck.allowed) {
            return sendResponse(res, { statusCode: STATUS_CODES.FORBIDDEN, success: false, message: userCheck.message });
        }

        // 2. Doctor/Staff Limit Check
        const specificType = isDoctor ? 'doctors' : 'staff';
        const typeCheck = await checkLimit(tenantId, specificType);
        if (!typeCheck.allowed) {
            return sendResponse(res, { statusCode: STATUS_CODES.FORBIDDEN, success: false, message: typeCheck.message });
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

            // Create Doctor Services
            if (doctorDetails.services && Array.isArray(doctorDetails.services)) {
                const servicePromises = doctorDetails.services.map(service => {
                    return DoctorService.create({
                        tenantId,
                        tenantUserId: tenantUser.id,
                        serviceId: service.serviceId,
                        price: service.price || 0
                    });
                });
                await Promise.all(servicePromises);
            }
        }

        // Fetch created user with details for response
        const createdUser = await TenantUser.findByPk(tenantUser.id, {
            include: [
                { model: DoctorDetails, as: 'doctorDetails' },
                {
                    model: DoctorService,
                    as: 'assignedServices',
                    include: [{ model: Product, as: 'service' }]
                }
            ]
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
            include: [
                { model: DoctorDetails, as: 'doctorDetails' },
                {
                    model: DoctorService,
                    as: 'assignedServices',
                    include: [{ model: Product, as: 'service' }]
                }
            ]
        });

        // Fetch roles to map manually due to type mismatch (role is String vs ID is Integer)
        const roles = await Role.findAll({
            where: { tenantId },
            attributes: ['id', 'name', 'roleType']
        });

        const usersWithRoles = users.map(user => {
            const userJson = user.toJSON();
            // Try to find role by ID (fuzzy match for string vs int)
            const role = roles.find(r => r.id == user.role);
            userJson.userRole = role || null;
            return userJson;
        });

        return sendResponse(res, {
            message: "Tenant users fetched successfully",
            data: usersWithRoles
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
            include: [
                { model: DoctorDetails, as: 'doctorDetails' },
                {
                    model: DoctorService,
                    as: 'assignedServices',
                    include: [{ model: Product, as: 'service' }]
                }
            ]
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

            // Update Services
            if (doctorDetails.services && Array.isArray(doctorDetails.services)) {
                // Delete existing services
                await DoctorService.destroy({
                    where: { tenantUserId: user.id }
                });

                // Create new services
                const servicePromises = doctorDetails.services.map(service => {
                    return DoctorService.create({
                        tenantId: user.tenantId, // Ensure tenant consistency
                        tenantUserId: user.id,
                        serviceId: service.serviceId,
                        price: service.price || 0
                    });
                });
                await Promise.all(servicePromises);
            }
        }

        // Re-fetch updated user
        const updatedUser = await TenantUser.findByPk(id, {
            include: [
                { model: DoctorDetails, as: 'doctorDetails' },
                {
                    model: DoctorService,
                    as: 'assignedServices',
                    include: [{ model: Product, as: 'service' }]
                }
            ]
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

// Update own profile (Self)
export const updateProfile = async (req, res) => {
    try {
        const tenantId = getTenantId(req);

        // Scenario 1: Tenant User (Doctor, Staff, etc.)
        if (req.user && req.user.id) {
            const userId = req.user.id;
            const { name, businessName, oldPassword, newPassword, phone, profilePic } = req.body;

            const user = await TenantUser.scope('withPassword').findOne({
                where: { id: userId, tenantId }
            });

            if (!user) {
                return sendResponse(res, {
                    statusCode: STATUS_CODES.NOT_FOUND,
                    success: false,
                    message: "User not found"
                });
            }

            const updateData = {};
            if (name) updateData.name = name;
            if (phone) updateData.phone = phone;
            // Explicitly allow setting profilePic to null (for delete) or new string
            if (profilePic !== undefined) updateData.profilePic = profilePic;

            if (businessName || name) {
                const tenant = await Tenant.findByPk(tenantId);
                if (tenant) {
                    const tenantUpdate = {};
                    if (businessName) tenantUpdate.businessName = businessName;
                    if (name) tenantUpdate.name = name;
                    // If user is admin/owner, maybe sync profile pic? 
                    // Let's keep it separate for now unless requested.
                    // But if this user IS the owner logic wise? 
                    // Scenario 1 is for "Users".
                    await tenant.update(tenantUpdate);
                }
            }

            if (newPassword && newPassword.trim() !== '') {
                if (!oldPassword) {
                    return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: "Old password is required" });
                }
                const isMatch = await user.comparePassword(oldPassword);
                if (!isMatch) {
                    return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: "Incorrect old password" });
                }
                updateData.password = newPassword;
            }

            if (Object.keys(updateData).length > 0) {
                await user.update(updateData);
            }

            const updatedUser = await TenantUser.findByPk(userId);
            const updatedTenant = await Tenant.findByPk(tenantId);

            return sendResponse(res, {
                message: "Profile updated successfully",
                data: {
                    ...updatedUser.toJSON(),
                    businessName: updatedTenant.businessName
                }
            });
        }

        // Scenario 2: Tenant Owner (Direct Tenant Login)
        else if (req.tenant && req.tenant.id) {
            const { name, businessName, oldPassword, newPassword, phone, profilePic } = req.body;

            // Re-fetch tenant with password
            const tenant = await Tenant.scope('withPassword').findByPk(tenantId);

            if (!tenant) {
                return sendResponse(res, {
                    statusCode: STATUS_CODES.NOT_FOUND,
                    success: false,
                    message: "Tenant account not found"
                });
            }

            const updateData = {};
            if (name) updateData.name = name;
            if (businessName) updateData.businessName = businessName;
            if (phone) updateData.phone = phone;
            if (profilePic !== undefined) updateData.profilePic = profilePic;

            if (newPassword && newPassword.trim() !== '') {
                if (!oldPassword) {
                    return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: "Old password is required" });
                }
                // Verify against TENANT password
                const isMatch = await tenant.comparePassword(oldPassword);
                if (!isMatch) {
                    return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: "Incorrect old password" });
                }
                updateData.password = newPassword;
            }

            if (Object.keys(updateData).length > 0) {
                await tenant.update(updateData);
            }

            // Return updated tenant data, structured to look like a user profile for consistency
            const updatedTenant = await Tenant.findByPk(tenantId);
            const responseData = updatedTenant.toJSON();

            // Map tenant fields to user-like structure for frontend
            return sendResponse(res, {
                message: "Profile updated successfully",
                data: {
                    ...responseData,
                    role: 'admin', // Owner is always admin
                    vendorType: responseData.BusinessType ? responseData.BusinessType.name : null
                }
            });

        } else {
            return sendResponse(res, {
                statusCode: STATUS_CODES.UNAUTHORIZED,
                success: false,
                message: MESSAGES.AUTH.UNAUTHORIZED
            });
        }

    } catch (error) {
        console.error('Update Profile Error:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.UPDATE_ERROR
        });
    }
};

export default {
    createTenantUser,
    getAllTenantUsers,
    getTenantUserById,
    updateTenantUser,
    deleteTenantUser,
    updateProfile
};
