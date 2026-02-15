import { Plan, Subscription } from '../../models/index.js';
import { STATUS_CODES } from '../../config/statusCodes.js';
import { sendResponse } from '../../utils/response.util.js';

// Create a new Plan
export const createPlan = async (req, res) => {
    try {
        console.log("Create Plan API Request Body:", req.body); // Debug Log

        const { name, description, monthlyPrice, yearlyPrice, maxDoctors, maxUsers, maxStores, maxStaff, maxRoles, features, isActive } = req.body;

        // Validations (Basic)
        if (!name || !monthlyPrice || !yearlyPrice) {
             console.error("Create Plan Error: Missing required fields");
             return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: "Name, Monthly Price and Yearly Price are required."
            });
        }

        const plan = await Plan.create({
            name,
            description,
            monthlyPrice,
            yearlyPrice,
            maxDoctors,
            maxUsers,
            maxStores,
            maxStaff,
            maxRoles,
            features,
            isActive
        });

        console.log("Plan Created Successfully:", plan.id); // Debug Log

        return sendResponse(res, {
            statusCode: STATUS_CODES.CREATED,
            message: "Plan created successfully",
            data: plan
        });

    } catch (error) {
        console.error("Create Plan Error:", error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Failed to create plan: " + error.message
        });
    }
};

// Update an existing Plan
export const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const plan = await Plan.findByPk(id);
        if (!plan) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: "Plan not found"
            });
        }

        await plan.update(updates);

        return sendResponse(res, {
            message: "Plan updated successfully",
            data: plan
        });

    } catch (error) {
        console.error("Update Plan Error:", error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Failed to update plan"
        });
    }
};

// Get List of Plans (Admin View - includes inactive?)
export const getAdminPlans = async (req, res) => {
    try {
        const plans = await Plan.findAll({ order: [['monthlyPrice', 'ASC']] });
        return sendResponse(res, { data: plans });
    } catch (error) {
        console.error("Get Plans Error:", error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Failed to fetch plans"
        });
    }
};

// Delete (Soft Delete or Hard Delete depends on requirement, here hard delete or toggle active)
export const deletePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await Plan.findByPk(id);
        
        if (!plan) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: "Plan not found"
            });
        }

        // Check if plan is used in any subscriptions
        const subscriptionCount = await Subscription.count({ where: { planId: id } });

        if (subscriptionCount > 0) {
            // Soft delete (Archive) if used
            await plan.update({ isActive: false });
            return sendResponse(res, {
                message: "Plan marked as inactive because it has valid subscriptions."
            });
        } else {
            // Hard delete if not used
            await plan.destroy();
            return sendResponse(res, {
                message: "Plan deleted successfully"
            });
        }

    } catch (error) {
        console.error("Delete Plan Error:", error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Failed to delete plan"
        });
    }
};
