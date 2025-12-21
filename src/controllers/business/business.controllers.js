import { BusinessType } from "../../models/index.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { literal } from "sequelize";

// Get all business types
export const getAllBusinessTypes = async (req, res) => {
  try {
    const businessTypes = await BusinessType.findAll({
      attributes: [
        ['name', 'label'],
        ['name', 'value'],
        'isActive',
        'id'
      ]
    });
    return sendResponse(res, {
      message: MESSAGES.BUSINESS_TYPES_FETCHED,
      data: businessTypes,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.FETCH_ERROR,
    });
  }
};

// Get business type by ID
export const getBusinessTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const businessType = await BusinessType.findByPk(id, {
      attributes: ['name', 'id']
    });

    if (!businessType) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: MESSAGES.BUSINESS_TYPE_NOT_FOUND,
      });
    }

    return sendResponse(res, {
      message: MESSAGES.BUSINESS_TYPE_FETCHED,
      data: businessType,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.FETCH_ERROR,
    });
  }
};

// Create new business type
export const createBusinessType = async (req, res) => {
  try {
    const { name } = req.body;

    const existingType = await BusinessType.findOne({ where: { name } });
    if (existingType) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.BAD_REQUEST,
        success: false,
        message: MESSAGES.BUSINESS_TYPE_EXISTS,
      });
    }

    const businessType = await BusinessType.create({ name });

    return sendResponse(res, {
      statusCode: STATUS_CODES.CREATED,
      message: MESSAGES.BUSINESS_TYPE_CREATED,
      data: businessType,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.CREATE_ERROR,
    });
  }
};

// Update business type
export const updateBusinessType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const [updatedRowsCount] = await BusinessType.update(
      { name },
      { where: { id } }
    );

    if (updatedRowsCount === 0) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: MESSAGES.BUSINESS_TYPE_NOT_FOUND,
      });
    }

    const businessType = await BusinessType.findByPk(id);

    return sendResponse(res, {
      message: MESSAGES.BUSINESS_TYPE_UPDATED,
      data: businessType,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.UPDATE_ERROR,
    });
  }
};

// Delete business type
export const deleteBusinessType = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRowsCount = await BusinessType.destroy({ where: { id } });

    if (deletedRowsCount === 0) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: MESSAGES.BUSINESS_TYPE_NOT_FOUND,
      });
    }

    return sendResponse(res, { message: MESSAGES.BUSINESS_TYPE_DELETED });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.DELETE_ERROR,
    });
  }
};

// Disable business type
export const disableBusinessType = async (req, res) => {
  try {
    const { id } = req.params;

    const [updatedRowsCount] = await BusinessType.update(
      { isActive: false },
      { where: { id } }
    );

    if (updatedRowsCount === 0) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: MESSAGES.BUSINESS_TYPE_NOT_FOUND,
      });
    }

    const businessType = await BusinessType.findByPk(id);

    return sendResponse(res, {
      message: MESSAGES.BUSINESS_TYPE_DISABLED,
      data: businessType,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.DISABLE_ERROR,
    });
  }
};

// Enable business type
export const enableBusinessType = async (req, res) => {
  try {
    const { id } = req.params;

    const [updatedRowsCount] = await BusinessType.update(
      { isActive: true },
      { where: { id } }
    );

    if (updatedRowsCount === 0) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: MESSAGES.BUSINESS_TYPE_NOT_FOUND,
      });
    }

    const businessType = await BusinessType.findByPk(id);

    return sendResponse(res, {
      message: MESSAGES.BUSINESS_TYPE_ENABLED,
      data: businessType,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.ENABLE_ERROR,
    });
  }
};

export default {
  getAllBusinessTypes,
  getBusinessTypeById,
  createBusinessType,
  updateBusinessType,
  deleteBusinessType,
  disableBusinessType,
  enableBusinessType,
};
