import { Make } from "../../models/inventory/make.model.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { Op } from "sequelize";

// Get all makes
export const getAllMakes = async (req, res) => {
  try {
    const makes = await Make.findAll({ where: { isActive: true } });
    return sendResponse(res, {
      message: "Makes fetched successfully",
      data: makes,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.FETCH_ERROR,
    });
  }
};

// Get make by ID
export const getMakeById = async (req, res) => {
  try {
    const { id } = req.params;
    const make = await Make.findByPk(id);

    if (!make) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Make not found",
      });
    }

    return sendResponse(res, {
      message: "Make fetched successfully",
      data: make,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.FETCH_ERROR,
    });
  }
};

// Create new make
export const createMake = async (req, res) => {
  try {
    const { name, countryOfOrigin } = req.body;

    const existingMake = await Make.findOne({ 
        where: { name: { [Op.iLike]: name } } 
    });
    
    if (existingMake) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.BAD_REQUEST,
        success: false,
        message: "Make already exists",
      });
    }

    const make = await Make.create({ name, countryOfOrigin });

    return sendResponse(res, {
      statusCode: STATUS_CODES.CREATED,
      message: "Make created successfully",
      data: make,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.CREATE_ERROR,
    });
  }
};

// Update make
export const updateMake = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, countryOfOrigin } = req.body;

    const make = await Make.findByPk(id);

    if (!make) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Make not found",
      });
    }

    await make.update({ name, countryOfOrigin });

    return sendResponse(res, {
      message: "Make updated successfully",
      data: make,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.UPDATE_ERROR,
    });
  }
};

// Delete make
export const deleteMake = async (req, res) => {
  try {
    const { id } = req.params;

    const make = await Make.findByPk(id);

    if (!make) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Make not found",
      });
    }

    await make.update({ isActive: false });

    return sendResponse(res, { message: "Make deleted successfully" });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.DELETE_ERROR,
    });
  }
};

// Disable make
export const disableMake = async (req, res) => {
  try {
    const { id } = req.params;

    const make = await Make.findByPk(id);

    if (!make) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Make not found",
      });
    }

    await make.update({ isActive: false });

    return sendResponse(res, {
      message: "Make disabled successfully",
      data: make,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.DISABLE_ERROR,
    });
  }
};

// Enable make
export const enableMake = async (req, res) => {
  try {
    const { id } = req.params;

    const make = await Make.findByPk(id);

    if (!make) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Make not found",
      });
    }

    await make.update({ isActive: true });

    return sendResponse(res, {
      message: "Make enabled successfully",
      data: make,
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
  getAllMakes,
  getMakeById,
  createMake,
  updateMake,
  deleteMake,
  disableMake,
  enableMake,
  };
