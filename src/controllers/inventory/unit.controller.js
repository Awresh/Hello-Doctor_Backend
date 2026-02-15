import { Unit } from "../../models/inventory/unit.model.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { checkNullArr, getJsonValue } from "../../utils/WebUtils.js";
import { Op } from "sequelize";

// Get all units
export const getAllUnits = async (req, res) => {
  try {
    const tenant = req.tenant;
    const tenantId = tenant.id;
    const storeData = req.store;

    let whereClause = { tenantId, isActive: true };
    if (storeData) {
      whereClause = {
        tenantId,
        isActive: true, // Also filter by isActive
        [Op.or]: [
          { storeId: storeData.id },
          { storeId: null }
        ]
      };
    }

    const units = await Unit.findAll({ where: whereClause });
    const response = checkNullArr(units) ? units.map((unit) => {
      const unitObj = unit.toJSON();
      return {
        ...unitObj,
        showAction_Edit: getJsonValue(storeData, 'id') ? (unitObj.storeId?.toString() === getJsonValue(storeData, 'id')?.toString()) : true,
        showAction_View: true,
        showAction_Delete: getJsonValue(storeData, 'id') ? (unitObj.storeId?.toString() === getJsonValue(storeData, 'id')?.toString()) : true,
        showAction_Toggle: getJsonValue(storeData, 'id') ? (unitObj.storeId?.toString() === getJsonValue(storeData, 'id')?.toString()) : true,
      };
    }) : [];
    return sendResponse(res, {
      message: "Units fetched successfully",
      data: response,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.FETCH_ERROR,
    });
  }
};

// Get unit by ID
export const getUnitById = async (req, res) => {
  try {
    const id = req.params.id;
    const tenant = req.tenant;
    const tenantId = tenant.id;
    const unit = await Unit.findOne({ where: { id, tenantId } });

    if (!unit) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Unit not found",
      });
    }

    return sendResponse(res, {
      message: "Unit fetched successfully",
      data: unit,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.FETCH_ERROR,
    });
  }
};

// Create new unit
export const createUnit = async (req, res) => {
  try {
    const name = req.body.name;
    const description = req.body.description;
    const tenant = req.tenant;
    const tenantId = tenant.id;
    
    // Case insensitive check
    const existingUnit = await Unit.findOne({ 
      where: { 
        tenantId,
        name: { [Op.iLike]: name }
      } 
    });

    if (existingUnit) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.BAD_REQUEST,
        success: false,
        message: "Unit already exists",
      });
    }

    const storeData = req.store;
    let unitData = { name, description, tenantId };

    if (storeData) {
      unitData.storeId = storeData.id;
    }

    const unit = await Unit.create(unitData);

    const getUnit = await Unit.findByPk(unit.id);

    if (!getUnit) {
      return {
        data: null,
        message: 'Unit not found'
      };
    }
    const unitObj = getUnit.toJSON();

    const response = {
      ...unitObj,
      showAction_Edit: true,
      showAction_View: true,
      showAction_Delete: true,
      showAction_Toggle: true
    };
    return sendResponse(res, {
      statusCode: STATUS_CODES.CREATED,
      message: "Unit created successfully",
      data: response,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.CREATE_ERROR,
    });
  }
};

// Update unit
export const updateUnit = async (req, res) => {
  try {
    const id = req.params.id;
    const name = req.body.name;
    const description = req.body.description;
    const tenant = req.tenant;
    const tenantId = tenant.id;
    
    // Check duplicates
    const existingUnit = await Unit.findOne({ 
      where: { 
        tenantId,
        name: { [Op.iLike]: name },
        id: { [Op.ne]: id } // Exclude current ID
      } 
    });

    if (existingUnit) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.BAD_REQUEST,
        success: false,
        message: "Unit already exists",
      });
    }

    const unit = await Unit.findByPk(id);

    if (!unit) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Unit not found",
      });
    }

    await unit.update({ name, description });

    const getUnit = unit.toJSON();

    const response = {
      ...getUnit,
      showAction_Edit: true,
      showAction_View: true,
      showAction_Delete: true,
      showAction_Toggle: true
    };
    return sendResponse(res, {
      message: "Unit updated successfully",
      data: response,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.UPDATE_ERROR,
    });
  }
};

// Delete unit
export const deleteUnit = async (req, res) => {
  try {
    const id = req.params.id;

    const unit = await Unit.findByPk(id);

    if (!unit) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Unit not found",
      });
    }

    await unit.update({ isActive: false });

    return sendResponse(res, { message: "Unit deleted successfully" });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.DELETE_ERROR,
    });
  }
};

// Disable unit
export const disableUnit = async (req, res) => {
  try {
    const id = req.params.id;

    const unit = await Unit.findByPk(id);

    if (!unit) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Unit not found",
      });
    }

    await unit.update({ isActive: false });

    const getUnit = unit.toJSON();

    const response = {
      ...getUnit,
      showAction_Edit: true,
      showAction_View: true,
      showAction_Delete: true,
      showAction_Toggle: true
    };
    return sendResponse(res, {
      message: "Unit disabled successfully",
      data: response,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.DISABLE_ERROR,
    });
  }
};

// Enable unit
export const enableUnit = async (req, res) => {
  try {
    const id = req.params.id;

    const unit = await Unit.findByPk(id);

    if (!unit) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Unit not found",
      });
    }

    await unit.update({ isActive: true });

    const getUnit = unit.toJSON();

    const response = {
      ...getUnit,
      showAction_Edit: true,
      showAction_View: true,
      showAction_Delete: true,
      showAction_Toggle: true
    };
    return sendResponse(res, {
      message: "Unit enabled successfully",
      data: response,
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
  getAllUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
  disableUnit,
  enableUnit,
};
