import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { ProductService } from "../../services/product.service.js";

const productService = new ProductService();

export const getAllProducts = async (req, res) => {
    try {
        const products = await productService.getAllProducts(req.tenant.id, req.store);
        return sendResponse(res, { message: "Products fetched successfully", data: products });
    } catch (error) {
        console.error(error);
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || MESSAGES.FETCH_ERROR;
        return sendResponse(res, { statusCode, success: false, message });
    }
};

export const getProductById = async (req, res) => {
    try {
        const product = await productService.getProductById(req.params.id);
        return sendResponse(res, { message: "Product fetched successfully", data: product });
    } catch (error) {
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || MESSAGES.FETCH_ERROR;
        return sendResponse(res, { statusCode, success: false, message });
    }
};

export const createProduct = async (req, res) => {
    try {
        const product = await productService.createProduct(req.body, req.tenant.id, req.store);
        return sendResponse(res, { statusCode: STATUS_CODES.CREATED, message: "Product created successfully", data: product });
    } catch (error) {
        console.error(error);
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || MESSAGES.CREATE_ERROR;
        return sendResponse(res, { statusCode, success: false, message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const product = await productService.updateProduct(req.params.id, req.body);
        return sendResponse(res, { message: "Product updated successfully", data: product });
    } catch (error) {
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || MESSAGES.UPDATE_ERROR;
        return sendResponse(res, { statusCode, success: false, message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        await productService.deleteProduct(req.params.id);
        return sendResponse(res, { message: "Product deleted successfully" });
    } catch (error) {
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || MESSAGES.DELETE_ERROR;
        return sendResponse(res, { statusCode, success: false, message });
    }
};

export const disableProduct = async (req, res) => {
    try {
        const product = await productService.toggleProductStatus(req.params.id, 'Inactive');
        return sendResponse(res, { message: "Product disabled successfully", data: product });
    } catch (error) {
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || MESSAGES.DISABLE_ERROR;
        return sendResponse(res, { statusCode, success: false, message });
    }
};

export const enableProduct = async (req, res) => {
    try {
        const product = await productService.toggleProductStatus(req.params.id, 'Active');
        return sendResponse(res, { message: "Product enabled successfully", data: product });
    } catch (error) {
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || MESSAGES.ENABLE_ERROR;
        return sendResponse(res, { statusCode, success: false, message });
    }
};

export default {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    disableProduct,
    enableProduct
};
