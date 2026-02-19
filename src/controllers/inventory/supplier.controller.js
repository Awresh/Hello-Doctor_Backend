import { Supplier } from "../../models/inventory/supplier.model.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { checkNullArr, getJsonValue } from "../../utils/WebUtils.js";
import { Op } from "sequelize";

const SupplierController = {
    // Create a new supplier
    create: async (req, res) => {
        try {
            const name = req.body.name;
            const contactNumber = req.body.contactNumber;
            const contactNumberCountryCode = req.body.contactNumberCountryCode;
            const email = req.body.email;
            const address = req.body.address;
            const tenant = req.tenant;
            const tenantId = tenant?.id;
            const storeData = req.store;
            const storeId = storeData?.id;

            if (!tenantId) {
                return sendResponse(res, {
                    message: MESSAGES.AUTH.UNAUTHORIZED,
                    success: false,
                });
            }

            const existingSupplier = await Supplier.findOne({ where: { name, tenantId } });
            if (existingSupplier) {
                return sendResponse(res, {
                    message: "Supplier with this name already exists",
                    success: false,
                });
            }

            const newSupplier = await Supplier.create({
                tenantId,
                storeId,
                name,
                contactNumber,
                contactNumberCountryCode,
                email,
                address,
                status: 'active'
            });

            return sendResponse(res, {
                message: "Supplier created successfully",
                data: newSupplier,
            });

        } catch (error) {
            console.error("Create Supplier Error:", error);
            return sendResponse(res, {
                status: STATUS_CODES.INTERNAL_SERVER_ERROR,
                success: false,
                message: MESSAGES.CREATE_ERROR
            });
        }
    },

    // Get all suppliers for a tenant
    getAll: async (req, res) => {
        try {
            const tenant = req.tenant;
            const tenantId = getJsonValue(tenant, 'id');
            const storeData = req.store;

            if (!tenantId) {
                return sendResponse(res, {
                    message: MESSAGES.AUTH.UNAUTHORIZED,
                    success: false,
                });
            }

            let whereClause = { tenantId };

            // If logged in as a store, logic is different:
            // Tenant sees everything.
            // Store sees only what is allocated to them (or owned by them, or global).
            if (storeData) {
                whereClause = {
                    tenantId,
                    [Op.or]: [
                        { storeId: storeData.id },
                        { storeId: null }
                    ]
                };
            }

            const suppliers = await Supplier.findAll({ 
                where: whereClause,
                order: [['createdAt', 'DESC']] 
            });

            const response = checkNullArr(suppliers) ? suppliers.map((supplier) => {
                const supplierObj = supplier.toJSON();
                return {
                    ...supplierObj,
                    showAction_Edit: getJsonValue(storeData, 'id') ? (supplierObj.storeId?.toString() === getJsonValue(storeData, 'id')?.toString()) : true,
                    showAction_View: false,
                    showAction_Delete: getJsonValue(storeData, 'id') ? (supplierObj.storeId?.toString() === getJsonValue(storeData, 'id')?.toString()) : true,
                    showAction_Toggle: getJsonValue(storeData, 'id') ? (supplierObj.storeId?.toString() === getJsonValue(storeData, 'id')?.toString()) : true,
                };
            }) : [];

            return sendResponse(res, {
                message: "Suppliers fetched successfully",
                data: response,
            });

        } catch (error) {
            console.error("Get Suppliers Error:", error);
            return sendResponse(res, {
                status: STATUS_CODES.INTERNAL_SERVER_ERROR,
                success: false,
                message: MESSAGES.FETCH_ERROR
            });
        }
    },

    // Update a supplier
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const updates = req.body;

            const result = await Supplier.update(updates, { where: { id } });
            
            if (result[0] === 0) {
                return sendResponse(res, {
                    message: "Supplier not found",
                    success: false,
                });
            }

            const updatedSupplier = await Supplier.findByPk(id);

            return sendResponse(res, {
                message: "Supplier updated successfully",
                data: updatedSupplier,
            });
        } catch (error) {
            console.error("Update Supplier Error:", error);
            return sendResponse(res, {
                status: STATUS_CODES.INTERNAL_SERVER_ERROR,
                success: false,
                message: MESSAGES.UPDATE_ERROR
            });
        }
    },

    // Toggle supplier status or delete
    delete: async (req, res) => {
        try {
            const id = req.params.id;
            const deletedRows = await Supplier.destroy({ where: { id } });

            if (deletedRows === 0) {
                return sendResponse(res, {
                    message: "Supplier not found",
                    success: false,
                });
            }

            return sendResponse(res, {
                message: "Supplier deleted successfully",
                success: true,
            });
        } catch (error) {
            console.error("Delete Supplier Error:", error);
            return sendResponse(res, {
                status: STATUS_CODES.INTERNAL_SERVER_ERROR,
                success: false,
                message: MESSAGES.DELETE_ERROR
            });
        }
    }
};

export default SupplierController;
