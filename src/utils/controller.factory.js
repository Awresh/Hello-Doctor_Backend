import { sendResponse } from "../utils/response.util.js";
import { STATUS_CODES } from "../config/statusCodes.js";
import { MESSAGES } from "../config/serverConfig.js";

export const createCrudController = (service, entityName) => ({
    getAll: async (req, res) => {
        try {
            const tenantId = req.tenant?.id;
            const items = await service.getAll({ tenantId });
            return sendResponse(res, { message: `${entityName}s fetched successfully`, data: items });
        } catch (error) {
            const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
            const message = error.message || MESSAGES.FETCH_ERROR;
            return sendResponse(res, { statusCode, success: false, message });
        }
    },

    getById: async (req, res) => {
        try {
            const item = await service.getById(req.params.id);
            return sendResponse(res, { message: `${entityName} fetched successfully`, data: item });
        } catch (error) {
            const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
            const message = error.message || MESSAGES.FETCH_ERROR;
            return sendResponse(res, { statusCode, success: false, message });
        }
    },

    create: async (req, res) => {
        try {
            const tenantId = req.tenant?.id;
            const item = await service.create({ ...req.body, tenantId });
            return sendResponse(res, { statusCode: STATUS_CODES.CREATED, message: `${entityName} created successfully`, data: item });
        } catch (error) {
            const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
            const message = error.message || MESSAGES.CREATE_ERROR;
            return sendResponse(res, { statusCode, success: false, message });
        }
    },

    update: async (req, res) => {
        try {
            const item = await service.update(req.params.id, req.body);
            return sendResponse(res, { message: `${entityName} updated successfully`, data: item });
        } catch (error) {
            const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
            const message = error.message || MESSAGES.UPDATE_ERROR;
            return sendResponse(res, { statusCode, success: false, message });
        }
    },

    delete: async (req, res) => {
        try {
            await service.delete(req.params.id);
            return sendResponse(res, { message: `${entityName} deleted successfully` });
        } catch (error) {
            const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
            const message = error.message || MESSAGES.DELETE_ERROR;
            return sendResponse(res, { statusCode, success: false, message });
        }
    }
});
