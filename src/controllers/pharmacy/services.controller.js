import { Product, Category, Brand, Unit, Supplier, Store } from "../../models/index.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { Op } from "sequelize";

// Get all services
export const getAllServices = async (req, res) => {
    try {
        const tenant = req.tenant;
        const tenantId = tenant.id;
        const storeData = req.store;

        // Base filter: tenant and type="Service"
        let whereClause = {
            tenantId,
            type: 'Service'
        };
        let storeFilter = null;

        // If logged in as a store, filter by store allocations (if applicable for services)
        // Services might be global or store-specific. Assuming global for now unless allocated.
        if (storeData) {
            storeFilter = {
                storeAllocations: {
                    [Op.contains]: [{ storeId: storeData.id, isActive: true }]
                }
            };
            // Note: If services are not allocated to stores, this might filter them all out.
            // Check logic: Do services need store allocation? 
            // If they are purely service items (consultation etc), maybe not.
            // But if they are tracked per store, then yes.
            whereClause = { ...whereClause, ...storeFilter };
        }

        const services = await Product.findAll({
            where: whereClause,
            include: [
                { model: Category, as: 'category', attributes: ['name', 'id'] },
                // Services might not have Brand/Unit/Supplier but including just in case
                { model: Unit, as: 'unit', attributes: ['name', 'id'] }
            ]
        });

        return sendResponse(res, {
            message: "Services fetched successfully",
            data: services,
        });
    } catch (error) {
        console.error('SERVICES_FETCH_ERROR:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.FETCH_ERROR,
        });
    }
};

// Get service by ID
export const getServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const service = await Product.findOne({
            where: { id, type: 'Service' },
            include: [
                { model: Category, attributes: ['name'] },
                { model: Unit, attributes: ['name'] }
            ]
        });

        if (!service) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: "Service not found",
            });
        }

        return sendResponse(res, {
            message: "Service fetched successfully",
            data: service,
        });
    } catch (error) {
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.FETCH_ERROR,
        });
    }
};

// Create new service
export const createService = async (req, res) => {
    try {
        let { name, categoryId, isActive, sellingPrice, costPrice, sku, status, description, minStock, stock } = req.body;
        const tenant = req.tenant;
        const tenantId = tenant.id;
        const storeData = req.store; // If creating from store level

        let storeAllocations = [];
        if (storeData) {
            storeAllocations = [{
                storeId: storeData.id,
                stock: stock || 0, // Services usually don't have stock, but structure might require it
                sellingPrice,
                isActive: true
            }]
        }

        const newService = await Product.create({
            tenantId,
            name,
            categoryId,
            isActive: isActive !== undefined ? isActive : true,
            buyPrice: costPrice, // Mapping costPrice to buyPrice
            sellingPrice,
            sku,
            status: status || 'Active',
            description,
            type: 'Service', // Enforce type
            globalStock: 0, // Services don't usually track stock
            storeAllocations: storeAllocations,
            minStock: minStock || 0
        });

        return sendResponse(res, {
            statusCode: STATUS_CODES.CREATED,
            message: "Service created successfully",
            data: newService,
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

// Update service
export const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Ensure we don't accidentally change type
        delete updates.type;

        const [updatedRowsCount] = await Product.update(updates, {
            where: { id, type: 'Service' }
        });

        if (updatedRowsCount === 0) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: "Service not found",
            });
        }

        const service = await Product.findByPk(id);

        return sendResponse(res, {
            message: "Service updated successfully",
            data: service,
        });
    } catch (error) {
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.UPDATE_ERROR,
        });
    }
};

// Delete service
export const deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedRowCount = await Product.destroy({
            where: { id, type: 'Service' }
        });

        if (deletedRowCount === 0) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: "Service not found",
            });
        }

        return sendResponse(res, { message: "Service deleted successfully" });
    } catch (error) {
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.DELETE_ERROR,
        });
    }
};

export default {
    getAllServices,
    getServiceById,
    createService,
    updateService,
    deleteService
};
