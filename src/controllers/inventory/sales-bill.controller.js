import { SalesBill } from "../../models/inventory/sales-bill.model.js";
import { Product } from "../../models/inventory/product.model.js";
import { Store } from "../../models/inventory/store.model.js";
import { Tenant } from "../../models/tenant/tenant.model.js";
import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { checkNullArr, getJsonValue } from "../../utils/WebUtils.js";
import { sendWhatsAppForService, sendWhatsAppMediaForService } from "../../utils/whatsapp.util.js";
import { generateSalesBillPDF } from "../../utils/pdf.util.js";

// Create Sales Bill
export const createSalesBill = async (req, res) => {
    try {
        const tenant = req.tenant;
        const tenantId = getJsonValue(tenant, 'id');
        const storeData = req.store; // Populated by auth middleware if user is a store
        const { billNumber, customer, doctor, items, pricing, payments, billingType, remarks, store: payloadStore } = req.body;

        // Determine effective store context
        const effectiveStoreId = storeData ? storeData.id : (payloadStore?.id || 'warehouse');
        const isWarehouseSale = effectiveStoreId === 'warehouse';

        // 1. Validation & Stock Check
        for (const item of items) {
            const product = await Product.findByPk(item.productId);
            if (!product) {
                return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, message: `Product not found: ${item.productName}` });
            }

            if (!isWarehouseSale) {
                // Specific Store Sale: Check Store Allocation
                const allocations = product.storeAllocations || [];
                const allocation = allocations.find(
                    sa => sa.storeId.toString() === effectiveStoreId.toString()
                );

                if (!allocation || allocation.stock < item.quantity) {
                    return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, message: `Insufficient stock for ${item.productName} in selected store. Available: ${allocation ? allocation.stock : 0}` });
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

            if (!isWarehouseSale) {
                // Deduct from Store Allocation
                const allocations = product.storeAllocations || [];
                const allocationIndex = allocations.findIndex(
                    sa => sa.storeId.toString() === effectiveStoreId.toString()
                );

                if (allocationIndex >= 0) {
                    allocations[allocationIndex].stock -= item.quantity;
                    product.storeAllocations = allocations; 
                    product.changed('storeAllocations', true); // Force update for JSONB field
                }

                // Deduct from Global stock as well? 
                // Usually, warehouse stock is separate from store stock. 
                // If it's a store sale, we only deduct from that store's allocation.
            } else {
                // Deduct from Global Stock
                product.globalStock -= item.quantity;
            }

            // Note: If you want globalStock to represent total across all stores, 
            // you'd also deduct from global stock here. Standard practice varies.
            // Assuming globalStock is "Warehouse Stock" only.
            
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

        // --- WhatsApp Notification ---
        try {
            if (customer?.phone) {
                // Fetch Store or Tenant info for PDF header
                let storeName = 'Clinic/Store';
                let storeAddress = '';
                
                if (storeData) {
                    storeName = storeData.name;
                    storeAddress = storeData.address || '';
                } else {
                    const tenantInfo = await Tenant.findByPk(tenantId);
                    if (tenantInfo) {
                        storeName = tenantInfo.businessName || tenantInfo.name;
                        storeAddress = tenantInfo.address || '';
                    }
                }

                const itemDetails = items.map(item => `• ${item.productName}: Rs. ${Number(item.total).toFixed(2)}`).join('\n');
                const grandTotal = pricing?.grandTotal || 0;
                const formattedTotal = `Rs. ${Number(grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                
                const msg = [
                    `*Order Confirmation*`,
                    ``,
                    `Hello *${customer.name || 'Customer'}*,`,
                    `Your invoice *${billNumber}* has been generated successfully.`,
                    ``,
                    `Items:`,
                    itemDetails,
                    ``,
                    `Total Amount: *${formattedTotal}*`,
                    ``,
                    `Please find your detailed invoice attached.`,
                    ``,
                    `Thank you for choosing us.`,
                ].join('\n');

                // Generate PDF
                const pdfBuffer = await generateSalesBillPDF({
                    billNumber,
                    customer,
                    items,
                    pricing,
                    storeName,
                    storeAddress
                });

                // Send PDF Media with Caption (Single message)
                await sendWhatsAppMediaForService(
                    'store', 
                    tenantId, 
                    customer.phone, 
                    pdfBuffer, 
                    `Invoice-${billNumber}.pdf`, 
                    'application/pdf', 
                    msg,
                    customer.phoneCountryCode
                );
            }
        } catch (waErr) {
            console.warn('[WhatsApp] Sales bill notification failed:', waErr.message);
        }
        // ---------------------------

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
            include: [{ model: Store }] // Populates store details
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
