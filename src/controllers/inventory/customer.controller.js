import { Customer } from "../../models/inventory/customer.model.js";
import { MESSAGES } from "../../config/serverConfig.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { sendResponse } from "../../utils/response.util.js";
import { Op } from "sequelize";

// Create Customer
export const createCustomer = async (req, res) => {
    try {
        const tenant = req.tenant;
        const tenantId = tenant?.id;
        const storeData = req.store;
        const storeId = storeData?.id;

        if (!tenantId) {
            return sendResponse(res, { 
                statusCode: STATUS_CODES.UNAUTHORIZED, 
                success: false, 
                message: MESSAGES.AUTH.UNAUTHORIZED 
            });
        }

        const name = req.body.name;
        const phone = req.body.phone;
        const phoneCountryCode = req.body.phoneCountryCode;
        const email = req.body.email;
        const address = req.body.address;

        if (!name || !phone) {
            return sendResponse(res, { 
                statusCode: STATUS_CODES.BAD_REQUEST, 
                success: false,
                message: "Name and Phone are required" 
            });
        }

        // Check if exists and Update (Upsert) - Scoped to Tenant
        let customer = await Customer.findOne({ where: { phone, phoneCountryCode, tenantId } });

        if (customer) {
            // Update existing
            await customer.update({
                name,
                email: email || customer.email,
                address: address || customer.address,
                phoneCountryCode: phoneCountryCode || customer.phoneCountryCode
            });
            return sendResponse(res, { 
                statusCode: STATUS_CODES.OK, 
                success: true,
                message: "Customer updated successfully", 
                data: customer 
            });
        } else {
            // Create new
            customer = await Customer.create({
                name,
                phone,
                phoneCountryCode,
                email,
                address,
                tenantId,
                storeId // Optional: link to specific store if created by store
            });
            return sendResponse(res, { 
                statusCode: STATUS_CODES.CREATED, 
                success: true,
                message: "Customer created successfully", 
                data: customer 
            });
        }

    } catch (error) {
        console.error("Error creating customer:", error);
        return sendResponse(res, { 
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, 
            success: false,
            message: MESSAGES.INTERNAL_SERVER_ERROR, 
            error: error.message 
        });
    }
};

// Search Customers
export const searchCustomers = async (req, res) => {
    try {
        const tenant = req.tenant;
        const tenantId = tenant?.id;
        const query = req.query.query;

        if (!tenantId) {
             return sendResponse(res, { 
                statusCode: STATUS_CODES.UNAUTHORIZED, 
                success: false, 
                message: MESSAGES.AUTH.UNAUTHORIZED 
            });
        }

        let whereClause = { tenantId };

        if (query) {
            whereClause[Op.or] = [
                { name: { [Op.iLike]: `%${query}%` } },
                { phone: { [Op.iLike]: `%${query}%` } }
            ];
        }

        const customers = await Customer.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        return sendResponse(res, { 
            statusCode: STATUS_CODES.OK, 
            success: true,
            message: "Customers fetched successfully", 
            data: customers 
        });

    } catch (error) {
        console.error("Error searching customers:", error);
        return sendResponse(res, { 
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, 
            success: false,
            message: MESSAGES.INTERNAL_SERVER_ERROR, 
            error: error.message 
        });
    }
};
