import { Brand } from "../../models/inventory/brand.model.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { checkNullArr, getJsonValue } from "../../utils/WebUtils.js";
import { Op } from "sequelize";

// Get all brands
export const getAllBrands = async (req, res) => {
  try {
    const tenant = req.tenant;
    const tenantId = tenant.id;
    const storeData = req.store;

    let whereClause = { tenantId, isActive: true };
    if (storeData) {
      whereClause = {
        tenantId,
        isActive: true,
        [Op.or]: [
          { storeId: storeData.id },
          { storeId: null }
        ]
      };
    }

    const brands = await Brand.findAll({ where: whereClause });
    const response = checkNullArr(brands) ? brands.map((brand) => {
      const brandObj = brand.toJSON();
      return {
        ...brandObj,
        showAction_Edit: getJsonValue(storeData, 'id') ? (brandObj.storeId?.toString() === getJsonValue(storeData, 'id')?.toString()) : true,
        showAction_View: getJsonValue(storeData, 'id') ? (brandObj.storeId?.toString() === getJsonValue(storeData, 'id')?.toString()) : true,
        showAction_Delete: getJsonValue(storeData, 'id') ? (brandObj.storeId?.toString() === getJsonValue(storeData, 'id')?.toString()) : true,
        showAction_Toggle: getJsonValue(storeData, 'id') ? (brandObj.storeId?.toString() === getJsonValue(storeData, 'id')?.toString()) : true,
      };
    }) : [];
    return sendResponse(res, {
      message: "Brands fetched successfully",
      data: response,
    });
  } catch (error) {
    console.log(error);
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.FETCH_ERROR,
    });
  }
};

// Get brand by ID
export const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findByPk(id);

    if (!brand) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Brand not found",
      });
    }

    return sendResponse(res, {
      message: "Brand fetched successfully",
      data: brand,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.FETCH_ERROR,
    });
  }
};

// Create new brand
export const createBrand = async (req, res) => {
  try {
    const { name, description } = req.body;
    const tenant = req.tenant;
    const tenantId = tenant.id;
    
    // Check existing brand with case insensitive name search for same tenant
    const existingBrand = await Brand.findOne({ 
      where: { 
        tenantId,
        name: { [Op.iLike]: name } // Case insensitive check if supported by DB (PG supports iLike)
      } 
    });

    if (existingBrand) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.BAD_REQUEST,
        success: false,
        message: "Brand already exists",
      });
    }

    const storeData = req.store;
    let brandData = { name, description, tenantId };

    if (storeData) {
      brandData.storeId = storeData.id;
    }

    const brand = await Brand.create(brandData);
    
    // Fetch newly created brand
    const fetchedBrand = await Brand.findByPk(brand.id);

    if (!fetchedBrand) {
      return {
        data: null,
        message: 'Brand not found'
      };
    }
    const getBrand = fetchedBrand.toJSON();

    const response = {
      ...getBrand,
      showAction_Edit: true,
      showAction_View: true,
      showAction_Delete: true,
      showAction_Toggle: true
    };
    return sendResponse(res, {
      statusCode: STATUS_CODES.CREATED,
      message: "Brand created successfully",
      data: response,
    });
  } catch (error) {
    console.log(error);
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.CREATE_ERROR,
    });
  }
};

// Update brand
export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, logo } = req.body;

    const brand = await Brand.findByPk(id);
    if (!brand) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Brand not found",
      });
    }

    // Permission Check
    const storeData = req.store;
    if (storeData) {
        if (!brand.storeId || brand.storeId != storeData.id) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.FORBIDDEN,
                success: false,
                message: "You do not have permission to edit this brand",
            });
        }
    }

    await brand.update({ name, logo });

    const getBrand = brand.toJSON();

    const response = {
      ...getBrand,
      showAction_Edit: true,
      showAction_View: true,
      showAction_Delete: true,
      showAction_Toggle: true
    };
    return sendResponse(res, {
      message: "Brand updated successfully",
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

// Delete brand
export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findByPk(id);

    if (!brand) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Brand not found",
      });
    }

    // Permission Check
    const storeData = req.store;
    if (storeData) {
        if (!brand.storeId || brand.storeId != storeData.id) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.FORBIDDEN,
                success: false,
                message: "You do not have permission to delete this brand",
            });
        }
    }

    await brand.update({ isActive: false });

    return sendResponse(res, { message: "Brand deleted successfully" });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.DELETE_ERROR,
    });
  }
};

// Disable brand
export const disableBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findByPk(id);

    if (!brand) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Brand not found",
      });
    }

    await brand.update({ isActive: false });
    
    const getBrand = brand.toJSON();

    const response = {
      ...getBrand,
      showAction_Edit: true,
      showAction_View: true,
      showAction_Delete: true,
      showAction_Toggle: true
    };
    return sendResponse(res, {
      message: "Brand disabled successfully",
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

// Enable brand
export const enableBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findByPk(id);

    if (!brand) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Brand not found",
      });
    }

    await brand.update({ isActive: true });
    
    const getBrand = brand.toJSON();

    const response = {
      ...getBrand,
      showAction_Edit: true,
      showAction_View: true,
      showAction_Delete: true,
      showAction_Toggle: true
    };
    return sendResponse(res, {
      message: "Brand enabled successfully",
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
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  disableBrand,
  enableBrand,
};
