import { SalesBill } from "../../models/inventory/sales-bill.model.js";
import { Product } from "../../models/inventory/product.model.js";
import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { checkNullArr, getJsonValue } from "../../utils/WebUtils.js";

// Create Sales Bill
export const createSalesBill = async (req, res) => {
    try {
        const tenant = req.tenant;
        const tenantId = getJsonValue(tenant, 'id');
        const storeData = req.store; // Populated by auth middleware if user is a store
        const { billNumber, customer, doctor, items, pricing, payments, billingType, remarks } = req.body;

        // 1. Validation & Stock Check
        for (const item of items) {
            const product = await Product.findByPk(item.productId);
            if (!product) {
                return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, message: `Product not found: ${item.productName}` });
            }

            if (storeData) {
                // Store Sale: Check Store Allocation
                // Assuming storeAllocations is a JSON field array
                const allocations = product.storeAllocations || [];
                const allocation = allocations.find(
                    sa => sa.storeId.toString() === storeData.id.toString()
                );

                if (!allocation || allocation.stock < item.quantity) {
                    return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, message: `Insufficient stock for ${item.productName} in store. Available: ${allocation ? allocation.stock : 0}` });
                }
            } else {
                // Admin/Warehouse Sale: Check Global Stock
                if (product.globalStock < item.quantity) {
                    return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, message: `Insufficient stock for ${item.productName} in warehouse. Available: ${product.globalStock}` });
                }
            }
        }

        // 2. Deduct Stock
        for (const item of items) {
            const product = await Product.findByPk(item.productId);

            if (storeData) {
                // Deduct from Store Allocation
                const allocations = product.storeAllocations || [];
                const allocationIndex = allocations.findIndex(
                    sa => sa.storeId.toString() === storeData.id.toString()
                );

                if (allocationIndex >= 0) {
                    allocations[allocationIndex].stock -= item.quantity;
                    product.storeAllocations = allocations; // Reassign to trigger update if needed
                    product.changed('storeAllocations', true); // Force update for JSON field
                }
            } else {
                // Deduct from Global Stock
                product.globalStock -= item.quantity;
            }

            // Update stock status based on global stock (simplified)
            const minStock = product.minStock || 10;
            // Note: Ideally we check the relevant stock (store vs global) but keeping simple as per original logic
            
            await product.save();
        }

        // 3. Create Bill
        const newBill = await SalesBill.create({
            billNumber,
            storeId: storeData ? storeData.id : null,
            tenantId: tenantId, // Added tenantId
            customer,
            doctor,
            items,
            pricing,
            payments,
            billingType,
            remarks,
            createdBy: tenantId, // Refers to Tenant ID now
            status: payments.reduce((sum, p) => sum + p.amount, 0) >= pricing.grandTotal ? 'Paid' : 'Partial'
        });

        return sendResponse(res, { statusCode: STATUS_CODES.CREATED, message: "Bill created successfully", data: newBill });

    } catch (error) {
        console.error("Error creating sales bill:", error);
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, message: MESSAGES.INTERNAL_SERVER_ERROR, data: error.message });
    }
};

// Get All Sales Bills
export const getAllSalesBills = async (req, res) => {
    try {
        const tenant = req.tenant;
        const tenantId = tenant.id;
        const storeData = req.store;

        let query = { tenantId };
        if (storeData) {
            query.storeId = storeData.id;
        }

        const bills = await SalesBill.findAll({
            where: query,
            order: [['createdAt', 'DESC']],
            // include: [{ model: Product, as: 'items.product' }] // Sequelize doesn't support deep include on JSON items easily without proper associations.
            // Items are likely stored as JSON in SalesBill, so no need to include Product unless we strictly need it.
            // Original code: populate('items.productId').
            // If items is a JSON column, we can't 'include'. We assume the frontend gets product details from the JSON "items" array.
        });

        return sendResponse(res, { statusCode: STATUS_CODES.OK, message: "Bills fetched successfully", data: bills });
    } catch (error) {
        console.error("Error fetching bills:", error);
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, message: MESSAGES.INTERNAL_SERVER_ERROR });
    }
}
