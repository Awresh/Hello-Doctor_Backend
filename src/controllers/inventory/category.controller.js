import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { CategoryService } from "../../services/inventory-crud.service.js";

const categoryService = new CategoryService();

export const getAllCategories = async (req, res) => {
  try {
    const data = await categoryService.getAllWithPermissions(req.tenant.id, req.store);
    return sendResponse(res, { message: "Categories fetched successfully", data });
  } catch (error) {
    return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: MESSAGES.FETCH_ERROR });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await categoryService.findById(req.params.id);
    if (!category) {
      return sendResponse(res, { statusCode: STATUS_CODES.NOT_FOUND, success: false, message: "Category not found" });
    }
    return sendResponse(res, { message: "Category fetched successfully", data: category });
  } catch (error) {
    return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: MESSAGES.FETCH_ERROR });
  }
};

export const createCategory = async (req, res) => {
  try {
    const data = await categoryService.createWithStore(req.body, req.tenant.id, req.store);
    return sendResponse(res, { statusCode: STATUS_CODES.CREATED, message: "Category created successfully", data });
  } catch (error) {
    const statusCode = error.message.includes("exists") || error.message.includes("not found") ? STATUS_CODES.BAD_REQUEST : STATUS_CODES.INTERNAL_SERVER_ERROR;
    return sendResponse(res, { statusCode, success: false, message: error.message || MESSAGES.CREATE_ERROR });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const data = await categoryService.updateWithPermissions(req.params.id, req.body, req.store);
    return sendResponse(res, { message: "Category updated successfully", data });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? STATUS_CODES.NOT_FOUND : error.message.includes("permission") ? STATUS_CODES.FORBIDDEN : STATUS_CODES.INTERNAL_SERVER_ERROR;
    return sendResponse(res, { statusCode, success: false, message: error.message || MESSAGES.UPDATE_ERROR });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    await categoryService.deleteWithPermissions(req.params.id, req.store);
    return sendResponse(res, { message: "Category deleted successfully" });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? STATUS_CODES.NOT_FOUND : error.message.includes("permission") ? STATUS_CODES.FORBIDDEN : STATUS_CODES.INTERNAL_SERVER_ERROR;
    return sendResponse(res, { statusCode, success: false, message: error.message || MESSAGES.DELETE_ERROR });
  }
};

export const disableCategory = async (req, res) => {
  try {
    const data = await categoryService.toggleStatus(req.params.id, false);
    return sendResponse(res, { message: "Category disabled successfully", data });
  } catch (error) {
    return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: MESSAGES.DISABLE_ERROR });
  }
};

export const enableCategory = async (req, res) => {
  try {
    const data = await categoryService.toggleStatus(req.params.id, true);
    return sendResponse(res, { message: "Category enabled successfully", data });
  } catch (error) {
    return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: MESSAGES.ENABLE_ERROR });
  }
};

export default { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory, disableCategory, enableCategory };
