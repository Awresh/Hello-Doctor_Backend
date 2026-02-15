import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { BrandService } from "../../services/brand.service.js";

const brandService = new BrandService();

export const getAllBrands = async (req, res) => {
    try {
        const brands = await brandService.getAllBrands(req.tenant.id, req.store);
        return sendResponse(res, { message: "Brands fetched successfully", data: brands });
    } catch (error) {
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || MESSAGES.FETCH_ERROR;
        return sendResponse(res, { statusCode, success: false, message });
    }
};

export const getBrandById = async (req, res) => {
    try {
        const brand = await brandService.getById(req.params.id);
        return sendResponse(res, { message: "Brand fetched successfully", data: brand });
    } catch (error) {
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || MESSAGES.FETCH_ERROR;
        return sendResponse(res, { statusCode, success: false, message });
    }
};

export const createBrand = async (req, res) => {
    try {
        const brand = await brandService.createBrand(req.body, req.tenant.id, req.store);
        return sendResponse(res, { statusCode: STATUS_CODES.CREATED, message: "Brand created successfully", data: brand });
    } catch (error) {
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || MESSAGES.CREATE_ERROR;
        return sendResponse(res, { statusCode, success: false, message });
    }
};

export const updateBrand = async (req, res) => {
    try {
        const brand = await brandService.updateBrand(req.params.id, req.body, req.store);
        return sendResponse(res, { message: "Brand updated successfully", data: brand });
    } catch (error) {
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || MESSAGES.UPDATE_ERROR;
        return sendResponse(res, { statusCode, success: false, message });
    }
};

export const deleteBrand = async (req, res) => {
    try {
        await brandService.deleteBrand(req.params.id, req.store);
        return sendResponse(res, { message: "Brand deleted successfully" });
    } catch (error) {
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || MESSAGES.DELETE_ERROR;
        return sendResponse(res, { statusCode, success: false, message });
    }
};

export const disableBrand = async (req, res) => {
    try {
        const brand = await brandService.toggleBrandStatus(req.params.id, false);
        return sendResponse(res, { message: "Brand disabled successfully", data: brand });
    } catch (error) {
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || MESSAGES.DISABLE_ERROR;
        return sendResponse(res, { statusCode, success: false, message });
    }
};

export const enableBrand = async (req, res) => {
    try {
        const brand = await brandService.toggleBrandStatus(req.params.id, true);
        return sendResponse(res, { message: "Brand enabled successfully", data: brand });
    } catch (error) {
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || MESSAGES.ENABLE_ERROR;
        return sendResponse(res, { statusCode, success: false, message });
    }
};

export default { getAllBrands, getBrandById, createBrand, updateBrand, deleteBrand, disableBrand, enableBrand };
