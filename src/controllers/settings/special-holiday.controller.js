import { SpecialHoliday } from '../../models/index.js';
import { sendResponse } from '../../utils/response.util.js';
import { STATUS_CODES } from '../../config/statusCodes.js';

import { Op } from 'sequelize';

export const getSpecialHolidays = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { storeId, userId } = req.query;

        const whereClause = { tenantId };

        let queryStoreId = storeId;
        // Enforce Store Context if logged in as Store User
        if (req.store && req.store.id) {
            queryStoreId = req.store.id;
        }

        if (queryStoreId) {
            // Specific Store + Global
            whereClause[Op.or] = [
                { storeId: queryStoreId },
                { storeId: null, userId: null }
            ];
        } else if (userId) {
            // Specific User + Global
            whereClause[Op.or] = [
                { userId: userId },
                { storeId: null, userId: null }
            ];
        } else {
            // No filter: Default to returning ALL for the tenant (Admin view, or relying on frontend filter)
            // But let's at least favor global if strictly nothing passed? 
            // Existing logic returned ALL. Let's keep returning ALL but rely on frontend to filter if it wants everything.
            // CAUTION: If we return ALL, the frontend "merge" logic might duplicate if it fetches specific too.
        }

        const holidays = await SpecialHoliday.findAll({ 
            where: whereClause,
            order: [['date', 'ASC']]
        });
        return sendResponse(res, {
            statusCode: STATUS_CODES.OK,
            success: true,
            data: holidays
        });
    } catch (error) {
        console.error('Error fetching special holidays:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to fetch holidays'
        });
    }
};

export const createSpecialHoliday = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { name, date, description, isClosed, target } = req.body;

        if (!name || !date) {
            return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Name and Date are required' });
        }

        const holiday = await SpecialHoliday.create({
            tenantId,
            name,
            date,
            description,
            isClosed: isClosed !== undefined ? isClosed : true,
            target: target || 'BOTH',
            storeId: req.body.storeId || null,
            userId: req.body.userId || null
        });

        return sendResponse(res, {
            statusCode: STATUS_CODES.CREATED,
            success: true,
            data: holiday,
            message: 'Holiday created successfully'
        });

    } catch (error) {
        console.error('Error creating special holiday:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to create holiday'
        });
    }
};

export const deleteSpecialHoliday = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;

        const holiday = await SpecialHoliday.findOne({ where: { id, tenantId } });

        if (!holiday) {
            return sendResponse(res, { statusCode: STATUS_CODES.NOT_FOUND, success: false, message: 'Holiday not found' });
        }

        await holiday.destroy();

        return sendResponse(res, {
            statusCode: STATUS_CODES.OK,
            success: true,
            message: 'Holiday deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting special holiday:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to delete holiday'
        });
    }
};
