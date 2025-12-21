import { Product, Category, Brand, Unit, Supplier, Store } from "../../models/index.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { Op } from "sequelize";

// Get all products
export const getAllProducts = async (req, res) => {
    try {
        const tenant = req.tenant;
        const tenantId = tenant.id;
        const storeData = req.store;

        let whereClause = { tenantId};
        let storeFilter = null;

        // If logged in as a store, filter by store allocations
        if (storeData) {
            storeFilter = {
                storeAllocations: {
                    [Op.contains]: [{ storeId: storeData.id, isActive: true }]
                }
            };
            whereClause = { ...whereClause, ...storeFilter };
        }

        const products = await Product.findAll({
            where: whereClause,
            include: [
                { model: Category,as: 'category', attributes: ['name','id'] },
                { model: Brand,as: 'brand', attributes: ['name','id'] },
                { model: Unit,as: 'unit', attributes: ['name','id'] },
                { model: Supplier,as: 'supplier', attributes: ['name','id'] }
            ]
        });

        let response = [];
        if (products && products.length > 0) {
            response = products.map((product) => {
                const productObj = product.toJSON();

                // Calculate total stock
                const distributedStock = Array.isArray(productObj.storeAllocations) 
                    ? productObj.storeAllocations.reduce((acc, curr) => acc + (curr.stock || 0), 0)
                    : 0;
                productObj.totalStock = (productObj.globalStock || 0) + distributedStock;

                // Customize view for Store
                if (storeData) {
                    const allocation = productObj.storeAllocations?.find(
                        sa => sa.storeId === storeData.id && sa.isActive
                    );

                    if (allocation) {
                        productObj.stock = allocation.stock;
                        if (allocation.sellingPrice) {
                            productObj.sellingPrice = allocation.sellingPrice;
                        }
                        
                        const storeMinStock = allocation.minStock || productObj.minStock || 10;
                        if (allocation.stock <= 0) {
                            productObj.stockStatus = 'Out of Stock';
                        } else if (allocation.stock <= storeMinStock) {
                            productObj.stockStatus = 'Low Stock';
                        } else {
                            productObj.stockStatus = 'In Stock';
                        }

                        delete productObj.storeAllocations;
                        delete productObj.globalStock;
                    }
                }

                return {
                    ...productObj,
                    showAction_Edit: true,
                    showAction_View: true,
                    showAction_Delete: true,
                    showAction_Toggle: true,
                };
            });
        }

        return sendResponse(res, {
            message: "Products fetched successfully",
            data: response,
        });
    } catch (error) {
        console.error(error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.FETCH_ERROR,
        });
    }
};

// Get product by ID
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id, {
            include: [
                { model: Category, attributes: ['name'] },
                { model: Brand, attributes: ['name'] },
                { model: Unit, attributes: ['name'] },
                { model: Supplier, attributes: ['name'] }
            ]
        });

        if (!product) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: "Product not found",
            });
        }

        return sendResponse(res, {
            message: "Product fetched successfully",
            data: product,
        });
    } catch (error) {
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.FETCH_ERROR,
        });
    }
};

// Create new product
export const createProduct = async (req, res) => {
    try {
        let { name, categoryId, brandId, unitId, supplierId,isActive, buyPrice, sellingPrice, sku, status, globalStock, storeAllocations, stock=0, minStock } = req.body;
        const tenant = req.tenant;
        const tenantId = tenant.id;
        const storeData = req.store;
        const storeId = storeData?.id;

        if(storeData){
            storeAllocations = [{
                storeId,
                stock: stock == 0 ? globalStock : stock,
                sellingPrice,
                buyPrice,
                minStock: minStock || 5,
                isActive: true
            }]
        }

        let stockStatus = 'In Stock';
        const currentStock = storeData ? (stock || 0) : (globalStock || 0);
        const currentMinStock = minStock || 10;
        
        if (currentStock <= 0) {
            stockStatus = 'Out of Stock';
        } else if (currentStock <= currentMinStock) {
            stockStatus = 'Low Stock';
        }

        const newProduct = await Product.create({
            tenantId,
            name,
            categoryId,
            brandId,
            unitId,
            supplierId,
            isActive,
            buyPrice,
            sellingPrice,
            minStock,
            sku,
            status,
            stockStatus,
            globalStock: globalStock || 0,
            storeAllocations: storeAllocations || []
        });

        return sendResponse(res, {
            statusCode: STATUS_CODES.CREATED,
            message: "Product created successfully",
            data: newProduct,
        });
    } catch (error) {
        console.error(error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.CREATE_ERROR,
        });
    }
};

// Update product
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const [updatedRowsCount] = await Product.update(updates, {
            where: { id }
        });

        if (updatedRowsCount === 0) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: "Product not found",
            });
        }

        const product = await Product.findByPk(id);

        return sendResponse(res, {
            message: "Product updated successfully",
            data: product,
        });
    } catch (error) {
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.UPDATE_ERROR,
        });
    }
};

// Delete product
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedRowCount = await Product.destroy({
            where: { id }
        });

        if (deletedRowCount === 0) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: "Product not found",
            });
        }

        return sendResponse(res, { message: "Product deleted successfully" });
    } catch (error) {
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.DELETE_ERROR,
        });
    }
};

// Disable product
export const disableProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const [updatedRowsCount] = await Product.update(
            { status: 'Inactive' },
            { where: { id } }
        );

        if (updatedRowsCount === 0) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: "Product not found",
            });
        }

        const product = await Product.findByPk(id);

        return sendResponse(res, {
            message: "Product disabled successfully",
            data: product,
        });
    } catch (error) {
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: MESSAGES.DISABLE_ERROR,
        });
    }
};

// Enable product
export const enableProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const [updatedRowsCount] = await Product.update(
            { status: 'Active' },
            { where: { id } }
        );

        if (updatedRowsCount === 0) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: "Product not found",
            });
        }

        const product = await Product.findByPk(id);

        return sendResponse(res, {
            message: "Product enabled successfully",
            data: product,
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
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    disableProduct,
    enableProduct
};
