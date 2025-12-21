import { Store } from "../../models/inventory/store.model.js";
import { Tenant, BusinessType } from "../../models/index.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import jwt from "jsonwebtoken";
import { checkNullArr, getJsonValue } from "../../utils/WebUtils.js";
import { Op } from "sequelize";

// Get all stores
export const getAllStores = async (req, res) => {
  try {
    const tenant = req.tenant;
    const tenantId = tenant.id; // Sequelize uses id, not _id
    const stores = await Store.findAll({ where: { tenantId, isActive: true } });
    
    const response = checkNullArr(stores) ? stores.map((store) => {
      const storeObj = store.toJSON();
      return {
        ...storeObj,
        showAction_Edit: true,
        showAction_View: true,
        showAction_Delete: true,
        showAction_Toggle: true,
      };
    }) : [];
    
    return sendResponse(res, {
      message: "Stores fetched successfully",
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

// Get store by ID
export const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await Store.findByPk(id);

    if (!store) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Store not found",
      });
    }

    return sendResponse(res, {
      message: "Store fetched successfully",
      data: store,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.FETCH_ERROR,
    });
  }
};

// Create new store
export const createStore = async (req, res) => {
  try {
    const { name, location, contactNumber, email, password, permissions, manager } = req.body;
    const tenant = req.tenant;
    const tenantId = tenant.id;
    
    const existingStore = await Store.findOne({ 
      where: { 
        [Op.or]: [{ name }, { email }] 
      } 
    });
    
    if (existingStore) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.BAD_REQUEST,
        success: false,
        message: "Store with this name or email already exists",
      });
    }

    const store = await Store.create({
      name,
      location,
      contactNumber,
      email,
      password,
      permissions,
      tenantId,
      manager
    });

    return sendResponse(res, {
      statusCode: STATUS_CODES.CREATED,
      message: "Store created successfully",
      data: store,
    });
  } catch (error) {
    console.error("Create Store Error:", error);
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.CREATE_ERROR,
    });
  }
};

// Login Store
export const loginStore = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Use scope 'withPassword' if defined in model, or explicitly include attribute
    // Assuming defaultScope excludes password
    const store = await Store.scope('withPassword').findOne({ 
      where: { email },
      include: [{
        model: Tenant,
        include: [{ 
          model: BusinessType, 
          attributes: ['name'] 
        }]
      }]
    });

    if (!store) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.UNAUTHORIZED,
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await store.comparePassword(password);
    if (!isPasswordValid) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.UNAUTHORIZED,
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign({ storeId: store.id, tenantId: store.tenantId }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });

    // Extract business type and tenant ID for frontend
    const businessType = getJsonValue(store, ['Tenant', 'BusinessType']);
    const tenantId = getJsonValue(store, ['Tenant', 'id']);

    return sendResponse(res, {
      message: 'Login successful',
      data: {
        store,
        token,
        businessType,
        tenantId
      }
    });
  } catch (error) {
    console.error("Login Store Error:", error);
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Login failed'
    });
  }
};

// Update store
export const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, contactNumber, email, permissions } = req.body;

    // TODO: Handle password update separately if needed

    const store = await Store.findByPk(id);

    if (!store) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Store not found",
      });
    }

    // Sequelize update
    await store.update({ name, location, contactNumber, email, permissions });

    return sendResponse(res, {
      message: "Store updated successfully",
      data: store,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.UPDATE_ERROR,
    });
  }
};

// Delete store
export const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findByPk(id);

    if (!store) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Store not found",
      });
    }

    await store.update({ isActive: false });

    return sendResponse(res, { message: "Store deleted successfully" });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.DELETE_ERROR,
    });
  }
};

// Disable store
export const disableStore = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findByPk(id);

    if (!store) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Store not found",
      });
    }

    await store.update({ isActive: false });

    return sendResponse(res, {
      message: "Store disabled successfully",
      data: store,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.DISABLE_ERROR,
    });
  }
};

// Enable store
export const enableStore = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findByPk(id);

    if (!store) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Store not found",
      });
    }

    await store.update({ isActive: true });

    return sendResponse(res, {
      message: "Store enabled successfully",
      data: store,
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
  getAllStores,
  getStoreById,
  createStore,
  loginStore,
  updateStore,
  deleteStore,
  disableStore,
  enableStore,
};
