// REFACTORED CONTROLLERS - SOLID COMPLIANT
// Copy these to replace old controllers

import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { 
    CategoryService, UnitService, SupplierService, StoreService, CustomerService, MakeService,
    TimeSettingsService, SpecialHolidayService, RoleService, TenantUserService, PaymentModeService, PlanService
} from "../../services/index.js";

// CATEGORY CONTROLLER
const categoryService = new CategoryService();
export const categoryController = {
    getAll: async (req, res) => {
        try {
            const items = await categoryService.getAll({ tenantId: req.tenant.id });
            return sendResponse(res, { message: "Categories fetched successfully", data: items });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.FETCH_ERROR });
        }
    },
    getById: async (req, res) => {
        try {
            const item = await categoryService.getById(req.params.id);
            return sendResponse(res, { message: "Category fetched successfully", data: item });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.FETCH_ERROR });
        }
    },
    create: async (req, res) => {
        try {
            const item = await categoryService.create({ ...req.body, tenantId: req.tenant.id });
            return sendResponse(res, { statusCode: 201, message: "Category created successfully", data: item });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.CREATE_ERROR });
        }
    },
    update: async (req, res) => {
        try {
            const item = await categoryService.update(req.params.id, req.body);
            return sendResponse(res, { message: "Category updated successfully", data: item });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.UPDATE_ERROR });
        }
    },
    delete: async (req, res) => {
        try {
            await categoryService.delete(req.params.id);
            return sendResponse(res, { message: "Category deleted successfully" });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.DELETE_ERROR });
        }
    }
};

// UNIT CONTROLLER
const unitService = new UnitService();
export const unitController = {
    getAll: async (req, res) => {
        try {
            const items = await unitService.getAll({ tenantId: req.tenant.id });
            return sendResponse(res, { message: "Units fetched successfully", data: items });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.FETCH_ERROR });
        }
    },
    getById: async (req, res) => {
        try {
            const item = await unitService.getById(req.params.id);
            return sendResponse(res, { message: "Unit fetched successfully", data: item });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.FETCH_ERROR });
        }
    },
    create: async (req, res) => {
        try {
            const item = await unitService.create({ ...req.body, tenantId: req.tenant.id });
            return sendResponse(res, { statusCode: 201, message: "Unit created successfully", data: item });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.CREATE_ERROR });
        }
    },
    update: async (req, res) => {
        try {
            const item = await unitService.update(req.params.id, req.body);
            return sendResponse(res, { message: "Unit updated successfully", data: item });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.UPDATE_ERROR });
        }
    },
    delete: async (req, res) => {
        try {
            await unitService.delete(req.params.id);
            return sendResponse(res, { message: "Unit deleted successfully" });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.DELETE_ERROR });
        }
    }
};

// SUPPLIER CONTROLLER
const supplierService = new SupplierService();
export const supplierController = {
    getAll: async (req, res) => {
        try {
            const items = await supplierService.getAll({ tenantId: req.tenant.id });
            return sendResponse(res, { message: "Suppliers fetched successfully", data: items });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.FETCH_ERROR });
        }
    },
    getById: async (req, res) => {
        try {
            const item = await supplierService.getById(req.params.id);
            return sendResponse(res, { message: "Supplier fetched successfully", data: item });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.FETCH_ERROR });
        }
    },
    create: async (req, res) => {
        try {
            const item = await supplierService.create({ ...req.body, tenantId: req.tenant.id });
            return sendResponse(res, { statusCode: 201, message: "Supplier created successfully", data: item });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.CREATE_ERROR });
        }
    },
    update: async (req, res) => {
        try {
            const item = await supplierService.update(req.params.id, req.body);
            return sendResponse(res, { message: "Supplier updated successfully", data: item });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.UPDATE_ERROR });
        }
    },
    delete: async (req, res) => {
        try {
            await supplierService.delete(req.params.id);
            return sendResponse(res, { message: "Supplier deleted successfully" });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.DELETE_ERROR });
        }
    }
};

// CUSTOMER CONTROLLER
const customerService = new CustomerService();
export const customerController = {
    getAll: async (req, res) => {
        try {
            const items = await customerService.getAll({ tenantId: req.tenant.id });
            return sendResponse(res, { message: "Customers fetched successfully", data: items });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.FETCH_ERROR });
        }
    },
    getById: async (req, res) => {
        try {
            const item = await customerService.getById(req.params.id);
            return sendResponse(res, { message: "Customer fetched successfully", data: item });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.FETCH_ERROR });
        }
    },
    create: async (req, res) => {
        try {
            const item = await customerService.create({ ...req.body, tenantId: req.tenant.id });
            return sendResponse(res, { statusCode: 201, message: "Customer created successfully", data: item });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.CREATE_ERROR });
        }
    },
    update: async (req, res) => {
        try {
            const item = await customerService.update(req.params.id, req.body);
            return sendResponse(res, { message: "Customer updated successfully", data: item });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.UPDATE_ERROR });
        }
    },
    delete: async (req, res) => {
        try {
            await customerService.delete(req.params.id);
            return sendResponse(res, { message: "Customer deleted successfully" });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.DELETE_ERROR });
        }
    }
};

// ROLE CONTROLLER
const roleService = new RoleService();
export const roleController = {
    getAll: async (req, res) => {
        try {
            const items = await roleService.getAll({ tenantId: req.tenant.id });
            return sendResponse(res, { message: "Roles fetched successfully", data: items });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.FETCH_ERROR });
        }
    },
    getById: async (req, res) => {
        try {
            const item = await roleService.getById(req.params.id);
            return sendResponse(res, { message: "Role fetched successfully", data: item });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.FETCH_ERROR });
        }
    },
    create: async (req, res) => {
        try {
            const item = await roleService.create({ ...req.body, tenantId: req.tenant.id });
            return sendResponse(res, { statusCode: 201, message: "Role created successfully", data: item });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.CREATE_ERROR });
        }
    },
    update: async (req, res) => {
        try {
            const item = await roleService.update(req.params.id, req.body);
            return sendResponse(res, { message: "Role updated successfully", data: item });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.UPDATE_ERROR });
        }
    },
    delete: async (req, res) => {
        try {
            await roleService.delete(req.params.id);
            return sendResponse(res, { message: "Role deleted successfully" });
        } catch (error) {
            return sendResponse(res, { statusCode: error.statusCode || 500, success: false, message: error.message || MESSAGES.DELETE_ERROR });
        }
    }
};
