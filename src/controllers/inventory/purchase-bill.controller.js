import { PurchaseBill } from "../../models/inventory/purchase-bill.model.js";
import { Product } from "../../models/inventory/product.model.js";
import { PriceHistory } from "../../models/inventory/price-history.model.js";
import { Tenant, Supplier, Store } from "../../models/index.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { Op } from "sequelize";
import { sendWhatsAppForService } from "../../utils/whatsapp.util.js";

const PurchaseBillController = {
    // Create new purchase bill
    createPurchaseBill: async (req, res) => {
        try {
            console.log('=== CREATE PURCHASE BILL START ===');

            const { supplier, supplierName, products, purchaseDate, notes, billImages, billNumber } = req.body;
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

            // Handle supplier - match by name or create new
            let supplierId = supplier;
            
            if (!supplierId && supplierName) {
                // Try to find supplier by name (case-insensitive)
                const existingSupplier = await Supplier.findOne({
                    where: {
                        tenantId,
                        name: { [Op.iLike]: supplierName.trim() }
                    }
                });

                if (existingSupplier) {
                    supplierId = existingSupplier.id;
                    console.log(`Found existing supplier: ${existingSupplier.name} (ID: ${supplierId})`);
                } else {
                    // Create new supplier
                    const newSupplier = await Supplier.create({
                        tenantId,
                        storeId,
                        name: supplierName.trim(),
                        status: 'active'
                    });
                    supplierId = newSupplier.id;
                    console.log(`Created new supplier: ${newSupplier.name} (ID: ${supplierId})`);
                }
            }

            if (!supplierId) {
                return sendResponse(res, {
                    message: "Supplier is required",
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

            // Process products - create if not exist, match by name
            const processedProducts = [];
            for (const item of products) {
                let productId = item.product;
                let productName = item.productName || 'Unknown Product';
                
                // If product ID not provided but productName exists (from OCR)
                if (!productId && productName) {
                    // Try to find product by name (case-insensitive)
                    const existingProduct = await Product.findOne({
                        where: {
                            tenantId,
                            name: { [Op.iLike]: productName.trim() }
                        }
                    });

                    if (existingProduct) {
                        productId = existingProduct.id;
                        console.log(`Found existing product: ${existingProduct.name} (ID: ${productId})`);
                    } else {
                        // Create new product
                        const newProduct = await Product.create({
                            tenantId,
                            storeId,
                            supplierId: supplierId,
                            name: productName.trim(),
                            buyPrice: item.buyPrice || 0,
                            sellingPrice: item.sellingPrice || item.buyPrice || 0,
                            globalStock: 0,
                            stockStatus: 'Out of Stock',
                            isActive: true,
                            status: 'Active',
                            type: 'Product',
                            categoryId: null,
                            brandId: null,
                            unitId: null
                        });
                        productId = newProduct.id;
                        console.log(`Created new product: ${newProduct.name} (ID: ${productId})`);
                    }
                }

                if (!productId) {
                    return sendResponse(res, {
                        message: `Product ID is required for: ${productName}`,
                        success: false,
                    });
                }

                processedProducts.push({
                    product: productId,
                    quantity: item.quantity || 1,
                    buyPrice: item.buyPrice || 0,
                    sellingPrice: item.sellingPrice || item.buyPrice || 0
                });
            }

            // Calculate total amount
            const totalAmount = processedProducts.reduce((sum, item) => {
                return sum + (Number(item.buyPrice) * Number(item.quantity));
            }, 0);

            // Create purchase bill
            const purchaseBill = await PurchaseBill.create({
                tenantId,
                storeId,
                supplierId: supplierId,
                products: processedProducts, // JSON field
                totalAmount,
                purchaseDate: purchaseDate || new Date(),
                notes,
                billNumber,
                billImages: billImages || [],
                status: 'completed'
            });

            // Update product stocks and prices
            const productIds = processedProducts.map(item => item.product);
            const dbProducts = await Product.findAll({
                where: {
                    id: productIds
                }
            });

            // Create a map for easy lookup
            const productMap = new Map(dbProducts.map(p => [p.id, p]));

            for (const item of processedProducts) {
                const product = productMap.get(parseInt(item.product));

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
            // Handle Sequelize validation errors
            if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    statusCode: 400,
                    message: error.errors.map(e => e.message).join(', '),
                    success: false,
                    data: error.errors
                });
            }
            return res.status(500).json({
                statusCode: 500,
                message: error.message || STATUS_CODES.INTERNAL_SERVER_ERROR,
                success: false,
                data: error.errors || null
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

            const { count, rows } = await PurchaseBill.findAndCountAll({
                where: whereClause,
                attributes: {
                    exclude: ['products', 'billImages']
                },
                include: [
                    { model: Supplier, as: 'supplier', attributes: ['name', 'contactNumber', 'email'] },
                    { model: Store, as: 'store', attributes: ['name', 'contactNumber', 'email'] },
                ],
                order: [['createdAt', 'DESC']],
                // limit: parseInt(limit), // Pagination removed
                // offset: offset,
                distinct: true
            });

            const response = await Promise.all(rows.map(async (bill) => {
                let billData = bill.toJSON();
                let paymentsChanged = false;
                
                if (billData.payments && Array.isArray(billData.payments)) {
                    billData.payments = billData.payments.map((p, idx) => {
                        let updated = { ...p };
                        let changed = false;

                        // Normalize ID
                        if (!updated.paymentId && updated._id) {
                            updated.paymentId = String(updated._id);
                            changed = true;
                        } else if (!updated.paymentId) {
                            updated.paymentId = `PAY-LEGACY-${Date.now()}-${idx}`;
                            changed = true;
                        }

                        // Normalize Method
                        if (!updated.method && updated.paymentMethod) {
                            updated.method = updated.paymentMethod;
                            changed = true;
                        }

                        // Normalize Date
                        if (!updated.date && updated.transactionDate) {
                            updated.date = updated.transactionDate;
                            changed = true;
                        }

                        if (changed) paymentsChanged = true;
                        return updated;
                    });
                }

                if (paymentsChanged) {
                    console.log(`Injected ${billData.payments.length} payment IDs for bill ${billData.id}`);
                    await PurchaseBill.update(
                        { payments: billData.payments },
                        { where: { id: billData.id } }
                    );
                }

                // Final verification log
                console.log(`Bill ${billData.id} payments:`, JSON.stringify(billData.payments.map(p => p.paymentId)));

                return {
                    ...billData,
                    showAction_Edit: true,
                    showAction_View: true,
                    showAction_Delete: true,
                };
            }));

            return sendResponse(res, {
                message: "Purchase bills fetched successfully",
                data: response,
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
            
            // Ensure all payments have paymentId (legacy fallback)
            let paymentsChanged = false;
            if (billData.payments && Array.isArray(billData.payments)) {
                billData.payments = billData.payments.map((p, idx) => {
                    let updated = { ...p };
                    let changed = false;

                    // Normalize ID
                    if (!updated.paymentId && updated._id) {
                        updated.paymentId = String(updated._id);
                        changed = true;
                    } else if (!updated.paymentId) {
                        updated.paymentId = `PAY-LEGACY-${Date.now()}-${idx}`;
                        changed = true;
                    }

                    // Normalize Method
                    if (!updated.method && updated.paymentMethod) {
                        updated.method = updated.paymentMethod;
                        changed = true;
                    }

                    // Normalize Date
                    if (!updated.date && updated.transactionDate) {
                        updated.date = updated.transactionDate;
                        changed = true;
                    }

                    if (changed) paymentsChanged = true;
                    return updated;
                });
            }

            if (paymentsChanged) {
                purchaseBill.payments = billData.payments;
                purchaseBill.changed('payments', true);
                await purchaseBill.save();
            }

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
            const { supplier, products, purchaseDate, notes, billImages, status, billNumber } = req.body;
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
            if (billNumber) purchaseBill.billNumber = billNumber;

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
            const currentPaid = Number(purchaseBill.paidAmount) || 0;

            const payments = purchaseBill.payments || [];
            payments.push({
                paymentId: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                amount: paymentAmount,
                date: date || new Date(),
                method: method || 'Cash',
                reference,
                notes,
                recordedBy: {
                    id: tenantId,
                    name: tenant?.name || 'System'
                }
            });

            purchaseBill.payments = payments;
            purchaseBill.changed('payments', true);
            purchaseBill.paidAmount = currentPaid + paymentAmount;

            await purchaseBill.save();

            // ── WhatsApp notification to supplier (fire-and-forget) ──
            try {
                const supplier = await Supplier.findOne({ where: { id: purchaseBill.supplierId } });
                if (supplier?.contactNumber) {
                    const total = Number(purchaseBill.totalAmount) || 0;
                    const paid  = Number(purchaseBill.paidAmount)  || 0;
                    const due   = Math.max(0, total - paid);
                    const fmt   = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` ;
                    const dateStr = new Date(date || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

                    const msg = [
                        `🧾 *Payment Received*`,
                        ``,
                        `Dear *${supplier.name}*,`,
                        `We have recorded a payment against your bill.`,
                        ``,
                        `📋 *Bill No:* ${purchaseBill.billNumber}`,
                        `📅 *Date:* ${dateStr}`,
                        `💳 *Method:* ${method || 'Cash'}`,
                        reference ? `🔖 *Reference:* ${reference}` : null,
                        ``,
                        `💰 *Amount Paid:* ${fmt(paymentAmount)}`,
                        `📊 *Total Bill:* ${fmt(total)}`,
                        `✅ *Total Paid:* ${fmt(paid)}`,
                        due > 0 ? `⏳ *Balance Due:* ${fmt(due)}` : `✅ *Status:* Fully Paid`,
                        ``,
                        `Thank you for your business! 🙏`,
                    ].filter(l => l !== null).join('\n');

                    sendWhatsAppForService('purchase', tenantId, supplier.contactNumber, msg, supplier.contactNumberCountryCode);
                }
            } catch (waErr) {
                console.warn('[WhatsApp] Payment notification failed:', waErr.message);
            }

            return sendResponse(res, {
                message: "Payment recorded successfully",
                data: purchaseBill,
            });

        } catch (error) {
            console.error("Add Payment Error:", error);
            return sendResponse(res, {
                message: STATUS_CODES.INTERNAL_SERVER_ERROR,
                success: false,
            });
        }
    },

    // Update payment
    updatePayment: async (req, res) => {
        try {
            const { id, paymentId } = req.params;
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

            let payments = purchaseBill.payments || [];
            const paymentIndex = payments.findIndex(p => p.paymentId === paymentId);

            if (paymentIndex === -1) {
                return sendResponse(res, {
                    message: "Payment record not found",
                    success: false,
                });
            }

            // Update payment details
            if (amount !== undefined) payments[paymentIndex].amount = Number(amount);
            if (date) payments[paymentIndex].date = date;
            if (method) payments[paymentIndex].method = method;
            if (reference !== undefined) payments[paymentIndex].reference = reference;
            if (notes !== undefined) payments[paymentIndex].notes = notes;

            purchaseBill.payments = payments;
            purchaseBill.changed('payments', true);

            // Recalculate total paid amount
            purchaseBill.paidAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

            await purchaseBill.save();

            return sendResponse(res, {
                message: "Payment updated successfully",
                data: purchaseBill,
            });

        } catch (error) {
            console.error("Update Payment Error:", error);
            return sendResponse(res, {
                message: STATUS_CODES.INTERNAL_SERVER_ERROR,
                success: false,
            });
        }
    },

    // Delete payment
    deletePayment: async (req, res) => {
        try {
            const { id, paymentId } = req.params;
            const tenant = req.tenant;
            const tenantId = tenant?.id;

            const purchaseBill = await PurchaseBill.findOne({ where: { id, tenantId } });

            if (!purchaseBill) {
                return sendResponse(res, {
                    message: "Purchase bill not found",
                    success: false,
                });
            }

            let payments = purchaseBill.payments || [];
            const initialLength = payments.length;
            payments = payments.filter(p => p.paymentId !== paymentId);

            if (payments.length === initialLength) {
                return sendResponse(res, {
                    message: "Payment record not found",
                    success: false,
                });
            }

            purchaseBill.payments = payments;
            purchaseBill.changed('payments', true);

            // Recalculate total paid amount
            purchaseBill.paidAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

            await purchaseBill.save();

            return sendResponse(res, {
                message: "Payment deleted successfully",
                data: purchaseBill,
            });

        } catch (error) {
            console.error("Delete Payment Error:", error);
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
