import { Category, Store } from "../../models/index.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { Op } from "sequelize";
import { getJsonValue } from "../../utils/WebUtils.js";

// Get all categories
export const getAllCategories = async (req, res) => {
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

    const categories = await Category.findAll({
      where: whereClause,
      include: [{
        model:Category,
        as: 'parentCategory',
        attributes: ['name']
      }]
    });
    
    const response = categories ? categories.map((category) => {
      const categoryObj = category.toJSON();
      return {
        ...categoryObj,
        showAction_Edit: storeData ? (categoryObj.storeId === storeData.id) : true,
        showAction_View: false,
        showAction_Delete: storeData ? (categoryObj.storeId === storeData.id) : true,
        showAction_Toggle: storeData ? (categoryObj.storeId === storeData.id) : true,
      };
    }) : [];
    
    return sendResponse(res, {
      message: "Categories fetched successfully",
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

// Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);

    if (!category) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Category not found",
      });
    }

    return sendResponse(res, {
      message: "Category fetched successfully",
      data: category,
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.FETCH_ERROR,
    });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    const { name, description, parentCategory } = req.body;
    const tenant = req.tenant;
    const tenantId = getJsonValue(tenant, 'id');
    const storeData = req.store
    const existingCategory = await Category.findOne({ where: { name } });
    // console.log(existingCategory);
    if (existingCategory) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.BAD_REQUEST,
        success: false,
        message: "Category already exists",
      });
    }

    if (parentCategory) {
      const parent = await Category.findByPk(parentCategory);
      if (!parent) {
        return sendResponse(res, {
          statusCode: STATUS_CODES.BAD_REQUEST,
          success: false,
          message: "Parent category not found",
        });
      }
    }
    let category;
    if (getJsonValue(storeData, 'id')) {
      const store = await Store.findByPk(getJsonValue(storeData, 'id'));
      if (!store) {
        return sendResponse(res, {
          statusCode: STATUS_CODES.BAD_REQUEST,
          success: false,
          message: "Store not found",
        });
      }
      category = new Category({ name, description, parentCategoryId: parentCategory || null, tenantId, storeId: store.id });
    }
    else {
      category = new Category({ name, description, parentCategoryId: parentCategory || null, tenantId });
    }
    await category.save();
    
    // Fetch newly created category with parent included
    const fetchedCategory = await Category.findByPk(category.id, {
      include: [{
        model: Category,
        as: 'parentCategory',
        attributes: ['name']
      }]
    });

    if (!fetchedCategory) {
      return {
        data: null,
        message: 'Category not found'
      };
    }
    
    const getCat = fetchedCategory.toJSON();

    const response = {
      ...getCat,
      parentCategory: getCat.parentCategory ?? null,
      showAction_Edit: true,
      showAction_View: false,
      showAction_Delete: true,
      showAction_Toggle: true
    };
    return sendResponse(res, {
      statusCode: STATUS_CODES.CREATED,
      message: "Category created successfully",
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

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parentCategory } = req.body;

    if (parentCategory) {
      const parent = await Category.findByPk(parentCategory);
      if (!parent) {
        return sendResponse(res, {
          statusCode: STATUS_CODES.BAD_REQUEST,
          success: false,
          message: "Parent category not found",
        });
      }
      // Prevent circular dependency (basic check: parent cannot be self)
      if (parentCategory === id) {
        return sendResponse(res, {
          statusCode: STATUS_CODES.BAD_REQUEST,
          success: false,
          message: "Category cannot be its own parent",
        });
      }
    }

    const category = await Category.findByPk(id);
    if (!category) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Category not found",
      });
    }

    await category.update({ 
      name, 
      description, 
      parentCategoryId: parentCategory || null 
    });

    const fetchedCategory = await Category.findByPk(id, {
      include: [{
        model: Category,
        as: 'parentCategory',
        attributes: ['name']
      }]
    });

    if (!fetchedCategory) {
      return {
        data: null,
        message: 'Category not found'
      };
    }
    const getCat = fetchedCategory.toJSON();

    const response = {
      ...getCat,
      parentCategory: getCat.parentCategory ?? null,
      showAction_Edit: true,
      showAction_View: false,
      showAction_Delete: true,
      showAction_Toggle: true
    };
    return sendResponse(res, {
      message: "Category updated successfully",
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

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Category not found",
      });
    }

    await category.update({ isActive: false });

    return sendResponse(res, { message: "Category deleted successfully" });
  } catch (error) {
    return sendResponse(res, {
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      success: false,
      message: MESSAGES.DELETE_ERROR,
    });
  }
};

// Disable category
export const disableCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Category not found",
      });
    }

    await category.update({ isActive: false });

    const fetchedCategory = await Category.findByPk(id, {
      include: [{
        model: Category,
        as: 'parentCategory',
        attributes: ['name']
      }]
    });

    if (!fetchedCategory) {
      return {
        data: null,
        message: 'Category not found'
      };
    }
    const getCat = fetchedCategory.toJSON();

    const response = {
      ...getCat,
      parentCategory: getCat.parentCategory ?? null,
      showAction_Edit: true,
      showAction_View: false,
      showAction_Delete: true,
      showAction_Toggle: true
    };
    return sendResponse(res, {
      message: "Category disabled successfully",
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

// Enable category
export const enableCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      return sendResponse(res, {
        statusCode: STATUS_CODES.NOT_FOUND,
        success: false,
        message: "Category not found",
      });
    }

    await category.update({ isActive: true });

    const fetchedCategory = await Category.findByPk(id, {
      include: [{
        model: Category,
        as: 'parentCategory',
        attributes: ['name']
      }]
    });

    if (!fetchedCategory) {
      return {
        data: null,
        message: 'Category not found'
      };
    }
    const getCat = fetchedCategory.toJSON();

    const response = {
      ...getCat,
      parentCategory: getCat.parentCategory ?? null,
      showAction_Edit: true,
      showAction_View: false,
      showAction_Delete: true,
      showAction_Toggle: true
    };
    return sendResponse(res, {
      message: "Category enabled successfully",
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
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  disableCategory,
  enableCategory,
};
