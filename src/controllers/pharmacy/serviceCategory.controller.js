import { Category } from "../../models/index.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";

// Get all service categories
export const getAllServiceCategories = async (req, res) => {
    try {
        const tenant = req.tenant;
        const tenantId = tenant.id;

        const categories = await Category.findAll({
            where: {
                tenantId,
                type: 'Service'
            }
        });

        return sendResponse(res, {
            message: "Service categories fetched successfully",
            data: categories,
        });
    } catch (error) {
        console.error(error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.FETCH_ERROR,
        });
    }
};

// Create service category
export const createServiceCategory = async (req, res) => {
    try {
        const { name, description, isActive } = req.body;
        const tenant = req.tenant;
        const tenantId = tenant.id;

        const newCategory = await Category.create({
            tenantId,
            name,
            description,
            type: 'Service',
            isActive: isActive !== undefined ? isActive : true
        });

        return sendResponse(res, {
            statusCode: STATUS_CODES.CREATED,
            message: "Service category created successfully",
            data: newCategory,
        });
    } catch (error) {
        console.error(error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.CREATE_ERROR,
        });
    }
};

// Update service category
export const updateServiceCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        delete updates.type; // Prevent type change

        const [updatedRowsCount] = await Category.update(updates, {
            where: { id, type: 'Service' }
        });

        if (updatedRowsCount === 0) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: "Service Category not found",
            });
        }

        const category = await Category.findByPk(id);

        return sendResponse(res, {
            message: "Service Category updated successfully",
            data: category,
        });
    } catch (error) {
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.UPDATE_ERROR,
        });
    }
};

// Delete service category
export const deleteServiceCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // TODO: Check if services exist for this category?

        const deletedRowCount = await Category.destroy({
            where: { id, type: 'Service' }
        });

        if (deletedRowCount === 0) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: "Service Category not found",
            });
        }

        return sendResponse(res, { message: "Service Category deleted successfully" });
    } catch (error) {
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.DELETE_ERROR,
        });
    }
};

export default {
    getAllServiceCategories,
    createServiceCategory,
    updateServiceCategory,
    deleteServiceCategory
};
