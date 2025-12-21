import { PurchaseBill } from "../../models/inventory/purchase-bill.model.js";
import { Product } from "../../models/inventory/product.model.js";
import { PriceHistory } from "../../models/inventory/price-history.model.js";
import { Tenant, Supplier } from "../../models/index.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { Op } from "sequelize";

const PurchaseBillController = {
    // Create new purchase bill
    createPurchaseBill: async (req, res) => {
        try {
            console.log('=== CREATE PURCHASE BILL START ===');
            
            const { supplier, products, purchaseDate, notes, billImages } = req.body;
            const tenant = req.tenant;
            const tenantId = tenant?.id;
            const storeData = req.store;
            const storeId = storeData?.id;

            if (!tenantId) {
                return sendResponse(res, {
                    message: MESSAGES.AUTH.UNAUTHORIZED,
                    success: false,
                });
            }

            // Validate products array
            if (!Array.isArray(products) || products.length === 0) {
                return sendResponse(res, {
                    message: "At least one product is required",
                    success: false,
                });
            }

            // Calculate total amount
            const totalAmount = products.reduce((sum, item) => {
                return sum + (Number(item.buyPrice) * Number(item.quantity));
            }, 0);

            // Create purchase bill
            const purchaseBill = await PurchaseBill.create({
                tenantId,
                storeId,
                supplierId: supplier, 
                products, // JSON field
                totalAmount,
                purchaseDate: purchaseDate || new Date(),
                notes,
                billImages: billImages || [],
                status: 'completed'
            });

            // Update product stocks and prices
            // Update product stocks and prices
            // Fetch all products involved in one query to avoid N+1
            const productIds = products.map(item => item.product); // Assuming item.product is the ID
            const dbProducts = await Product.findAll({
                where: {
                    id: productIds
                }
            });

            // Create a map for easy lookup
            const productMap = new Map(dbProducts.map(p => [p.id, p]));

            for (const item of products) {
                const product = productMap.get(parseInt(item.product)); // Ensure ID comparison works

                if (product) {
                    // Track price changes
                    const priceChanged =
                        Number(product.buyPrice) !== Number(item.buyPrice) ||
                        Number(product.sellingPrice) !== Number(item.sellingPrice);

                    if (priceChanged) {
                        await PriceHistory.create({
                            tenantId,
                            productId: product.id,
                            purchaseBillId: purchaseBill.id,
                            oldBuyPrice: product.buyPrice || 0,
                            newBuyPrice: item.buyPrice,
                            oldSellingPrice: product.sellingPrice || 0,
                            newSellingPrice: item.sellingPrice,
                            changeReason: 'purchase_bill_create',
                            changedBy: tenantId // Keeping track of who changed it
                        });
                    }

                    // Update product stock and prices
                    // Check if store context
                    if (storeId) {
                        let allocations = product.storeAllocations || [];
                        // Ensure allocations is array
                        if (!Array.isArray(allocations)) allocations = [];
                        
                        const allocationIndex = allocations.findIndex(sa => sa.storeId.toString() === storeId.toString());
                        
                        if (allocationIndex >= 0) {
                            allocations[allocationIndex].stock = (allocations[allocationIndex].stock || 0) + Number(item.quantity);
                        } else {
                            allocations.push({
                                storeId: storeId,
                                stock: Number(item.quantity),
                                isActive: true
                            });
                        }
                        product.storeAllocations = allocations;
                        product.changed('storeAllocations', true);
                    } else {
                        // Admin/Owner context -> Update Global Stock
                        product.globalStock = (product.globalStock || 0) + Number(item.quantity);
                    }

                    product.buyPrice = item.buyPrice;
                    product.sellingPrice = item.sellingPrice;
                    product.isActive = true;

                    // Update stock status
                    const currentStock = storeId
                        ? (product.storeAllocations?.find(sa => sa.storeId.toString() === storeId.toString())?.stock || 0)
                        : product.globalStock;

                    const currentMinStock = storeId
                         ? (product.storeAllocations?.find(sa => sa.storeId.toString() === storeId.toString())?.minStock || 5)
                         : (product.minStock || 10);

                    if (currentStock > 0) {
                        product.stockStatus = currentStock > currentMinStock ? 'In Stock' : 'Low Stock';
                    } else {
                        product.stockStatus = 'Out of Stock';
                    }

                    await product.save();
                }
            }

            // Populate currently not supported easily on create return without reload
            // But we can reload
            const populatedBill = await PurchaseBill.findByPk(purchaseBill.id, {
                include: [{ model: Supplier, as: 'supplier', attributes: ['name', 'contactNumber', 'email'] }]
            });

            return sendResponse(res, {
                message: "Purchase bill created successfully",
                data: populatedBill,
            });

        } catch (error) {
            console.error("Create Purchase Bill Error:", error);
            return sendResponse(res, {
                message: error.message || STATUS_CODES.INTERNAL_SERVER_ERROR,
                success: false,
            });
        }
    },

    // Get all purchase bills
    getAllPurchaseBills: async (req, res) => {
        try {
            const tenant = req.tenant;
            const tenantId = tenant?.id;
            const storeData = req.store;

            if (!tenantId) {
                return sendResponse(res, {
                    message: MESSAGES.AUTH.UNAUTHORIZED,
                    success: false,
                });
            }

            const { page = 1, limit = 10, status, supplier, startDate, endDate } = req.query;

            let whereClause = { tenantId };

            if (storeData) {
                whereClause.storeId = storeData.id;
            }

            if (status) {
                whereClause.status = status;
            }

            if (supplier) {
                whereClause.supplierId = supplier;
            }

            if (startDate || endDate) {
                whereClause.purchaseDate = {};
                if (startDate) whereClause.purchaseDate[Op.gte] = new Date(startDate);
                if (endDate) whereClause.purchaseDate[Op.lte] = new Date(endDate);
            }

            const offset = (parseInt(page) - 1) * parseInt(limit);

            const { count, rows } = await PurchaseBill.findAndCountAll({
                where: whereClause,
                attributes: { 
                    exclude: ['products', 'billImages'] 
                },
                include: [
                    { model: Supplier, as: 'supplier', attributes: ['name', 'contactNumber', 'email'] }
                ],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: offset,
                distinct: true
            });

            const response = rows.map((bill) => ({
                ...bill.toJSON(),
                showAction_Edit: true,
                showAction_View: true,
                showAction_Delete: true,
            }));

            return sendResponse(res, {
                message: "Purchase bills fetched successfully",
                data: {
                    purchaseBills: response,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(count / parseInt(limit))
                    }
                },
            });

        } catch (error) {
            console.error("Get Purchase Bills Error:", error);
            return sendResponse(res, {
                message: MESSAGES.FETCH_ERROR || "Error fetching purchase bills",
                success: false,
            });
        }
    },

    // Get purchase bill by ID
    getPurchaseBillById: async (req, res) => {
        try {
            const { id } = req.params;
            const tenant = req.tenant;
            const tenantId = tenant?.id;

            if (!tenantId) {
                return sendResponse(res, {
                    message: MESSAGES.AUTH.UNAUTHORIZED,
                    success: false,
                });
            }

            const purchaseBill = await PurchaseBill.findOne({ 
                where: { id, tenantId },
                include: [
                    { model: Supplier, as: 'supplier', attributes: ['name', 'contactNumber', 'email', 'address'] }
                ]
            });

            if (!purchaseBill) {
                return sendResponse(res, {
                    message: "Purchase bill not found",
                    success: false,
                });
            }

            // Manually populate products because it's a JSONB field
            const billData = purchaseBill.toJSON();
            if (billData.products && billData.products.length > 0) {
                const productIds = billData.products.map(p => p.product);
                const products = await Product.findAll({
                    where: { id: productIds },
                    attributes: ['id', 'name', 'sku']
                });

                const productMap = new Map(products.map(p => [p.id, p]));

                billData.products = billData.products.map(p => {
                    const productDetails = productMap.get(p.product);
                    return {
                        ...p,
                        product: productDetails ? { name: productDetails.name, sku: productDetails.sku } : null
                    };
                });
            }

            return sendResponse(res, {
                message: "Purchase bill fetched successfully",
                data: billData,
            });

        } catch (error) {
            console.error("Get Purchase Bill Error:", error);
            return sendResponse(res, {
                message: STATUS_CODES.INTERNAL_SERVER_ERROR,
                success: false,
            });
        }
    },

    // Update purchase bill
    updatePurchaseBill: async (req, res) => {
        try {
            const { id } = req.params;
            const { supplier, products, purchaseDate, notes, billImages, status } = req.body;
            const tenant = req.tenant;
            const tenantId = tenant?.id;
            const storeData = req.store;
            const storeId = storeData?.id;

            const purchaseBill = await PurchaseBill.findOne({ where: { id, tenantId } });

            if (!purchaseBill) {
                return sendResponse(res, {
                    message: "Purchase bill not found",
                    success: false,
                });
            }

            // Reverse old stock
            const oldProducts = purchaseBill.products || [];
            for (const item of oldProducts) {
                const product = await Product.findByPk(item.product);
                if (product) {
                    if (storeId) {
                        const allocations = product.storeAllocations || [];
                        const idx = allocations.findIndex(sa => sa.storeId.toString() === storeId.toString());
                        if (idx >= 0) {
                            allocations[idx].stock = Math.max(0, (allocations[idx].stock || 0) - item.quantity);
                            product.storeAllocations = allocations;
                            product.changed('storeAllocations', true);
                        }
                    } else {
                        product.globalStock = Math.max(0, (product.globalStock || 0) - item.quantity);
                    }
                    await product.save();
                }
            }

            // Update fields
            if (supplier) purchaseBill.supplierId = supplier;
            if (products) {
                purchaseBill.products = products;
                // Recalculate total amount
                const totalAmount = products.reduce((sum, item) => {
                    return sum + (Number(item.buyPrice) * Number(item.quantity));
                }, 0);
                purchaseBill.totalAmount = totalAmount;
            }
            if (purchaseDate) purchaseBill.purchaseDate = purchaseDate;
            if (notes !== undefined) purchaseBill.notes = notes;
            if (billImages) purchaseBill.billImages = billImages;
            if (status) purchaseBill.status = status;

            await purchaseBill.save();

            // Apply new stock
            for (const item of purchaseBill.products) {
                const product = await Product.findByPk(item.product);
                if (product) {
                    // Logic to apply stock similar to create...
                    // For brevity, using simplified update:
                     if (storeId) {
                        let allocations = product.storeAllocations || [];
                        const allocationIndex = allocations.findIndex(sa => sa.storeId.toString() === storeId.toString());
                        if (allocationIndex >= 0) {
                            allocations[allocationIndex].stock = (allocations[allocationIndex].stock || 0) + item.quantity;
                        } else {
                            allocations.push({ storeId, stock: item.quantity, isActive: true });
                        }
                        product.storeAllocations = allocations;
                        product.changed('storeAllocations', true);
                    } else {
                         product.globalStock = (product.globalStock || 0) + item.quantity;
                    }
                    
                    product.buyPrice = item.buyPrice;
                    product.sellingPrice = item.sellingPrice;
                    await product.save();
                }
            }

            return sendResponse(res, {
                message: "Purchase bill updated successfully",
                data: purchaseBill,
            });

        } catch (error) {
            console.error("Update Purchase Bill Error:", error);
            return sendResponse(res, {
                message: STATUS_CODES.INTERNAL_SERVER_ERROR,
                success: false,
            });
        }
    },

    // Delete purchase bill
    deletePurchaseBill: async (req, res) => {
        try {
            const { id } = req.params;
            const tenant = req.tenant;
            const tenantId = tenant?.id;
            const storeData = req.store; // Assuming middleware populates this if logged in as store
            const storeId = storeData?.id;

            const purchaseBill = await PurchaseBill.findOne({ where: { id, tenantId } });

            if (!purchaseBill) {
                return sendResponse(res, {
                    message: "Purchase bill not found",
                    success: false,
                });
            }

            const productsToDelete = purchaseBill.products || [];

            // Reverse stock additions
            for (const item of productsToDelete) {
                const product = await Product.findByPk(item.product);
                if (product) {
                    if (storeId) {
                         // Reverse store allocation
                         let allocations = product.storeAllocations || [];
                         if (Array.isArray(allocations)) {
                             const allocationIndex = allocations.findIndex(sa => sa.storeId.toString() === storeId.toString());
                             if (allocationIndex >= 0) {
                                 allocations[allocationIndex].stock = Math.max(0, (allocations[allocationIndex].stock || 0) - Number(item.quantity));
                                 product.storeAllocations = allocations;
                                 product.changed('storeAllocations', true);
                             }
                         }
                    } else {
                         // Reverse global stock
                         product.globalStock = Math.max(0, (product.globalStock || 0) - Number(item.quantity));
                    }

                    // Update stock status
                    const currentStock = storeId
                        ? (product.storeAllocations?.find(sa => sa.storeId.toString() === storeId.toString())?.stock || 0)
                        : product.globalStock;

                    const currentMinStock = storeId
                         ? (product.storeAllocations?.find(sa => sa.storeId.toString() === storeId.toString())?.minStock || 5)
                         : (product.minStock || 10);

                    if (currentStock > 0) {
                        product.stockStatus = currentStock > currentMinStock ? 'In Stock' : 'Low Stock';
                    } else {
                        product.stockStatus = 'Out of Stock';
                    }

                    await product.save();
                }
            }
            
            await purchaseBill.destroy();

            return sendResponse(res, {
                message: "Purchase bill deleted successfully",
                success: true,
            });

        } catch (error) {
            console.error("Delete Purchase Bill Error:", error);
            return sendResponse(res, {
                message: STATUS_CODES.INTERNAL_SERVER_ERROR,
                success: false,
            });
        }
    },

    // Get products by supplier
    getProductsBySupplier: async (req, res) => {
        try {
            const { id } = req.params; // Supplier ID
            const tenant = req.tenant;
            const tenantId = tenant?.id;

            if (!tenantId) {
                return sendResponse(res, {
                    message: MESSAGES.AUTH.UNAUTHORIZED,
                    success: false,
                });
            }

            const products = await Product.findAll({
                where: { 
                    supplierId: id,
                    tenantId
                }
            });

            return sendResponse(res, {
                message: "Products fetched successfully",
                data: products,
            });

        } catch (error) {
            console.error("Get Supplier Products Error:", error);
            return sendResponse(res, {
                message: STATUS_CODES.INTERNAL_SERVER_ERROR,
                success: false,
            });
        }
    },

    // Add payment
    addPayment: async (req, res) => {
         try {
            const { id } = req.params;
            const { amount, date, method, reference, notes } = req.body;
            const tenant = req.tenant;
            const tenantId = tenant?.id;

            const purchaseBill = await PurchaseBill.findOne({ where: { id, tenantId } });

            if (!purchaseBill) {
                return sendResponse(res, {
                    message: "Purchase bill not found",
                    success: false,
                });
            }
            
            const paymentAmount = Number(amount);
            const currentPaid = purchaseBill.paidAmount || 0;
            // totalAmount calculation depends on products, assuming it's available or we calc it.
            // Simplified here. 

            const payments = purchaseBill.payments || [];
            payments.push({
                amount: paymentAmount,
                date: date || new Date(),
                method: method || 'Cash',
                reference,
                notes,
                recordedBy: tenantId
            });
            
            purchaseBill.payments = payments;
            purchaseBill.changed('payments', true);
            purchaseBill.paidAmount = currentPaid + paymentAmount;
            
            await purchaseBill.save();
            
            return sendResponse(res, {
                message: "Payment recorded successfully",
                data: purchaseBill,
            });

        } catch (error) {
             return sendResponse(res, {
                message: STATUS_CODES.INTERNAL_SERVER_ERROR,
                success: false,
            });
        }
    },

    // Get price history
    getPriceHistory: async (req, res) => {
        try {
            const { productId } = req.query; // Assuming query param for filtering
            const tenant = req.tenant;
            const tenantId = tenant?.id;

            if (!tenantId) {
                return sendResponse(res, {
                    message: MESSAGES.AUTH.UNAUTHORIZED,
                    success: false,
                });
            }

            const whereClause = { tenantId };
            if (productId) {
                whereClause.productId = productId;
            }

            const history = await PriceHistory.findAll({
                where: whereClause,
                include: [
                    { model: Product, attributes: ['name', 'sku'] },
                    // { model: PurchaseBill, attributes: ['billNumber'] } // Optional
                ],
                order: [['createdAt', 'DESC']]
            });

            return sendResponse(res, {
                message: "Price history fetched successfully",
                data: history,
            });

        } catch (error) {
            console.error("Get Price History Error:", error);
            return sendResponse(res, {
                message: STATUS_CODES.INTERNAL_SERVER_ERROR,
                success: false,
            });
        }
    }
};

export default PurchaseBillController;
