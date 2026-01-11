import { TimeSettings } from '../../models/index.js';
import { sendResponse } from '../../utils/response.util.js';
import { STATUS_CODES } from '../../config/statusCodes.js';

export const getTimeSettings = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { storeId, userId } = req.query;

        // 1. Define Defaults (Hardcoded fallback)
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const defaultSettings = days.map(day => ({
            day,
            type: 'store', // Default type, presumably overwritten or ignored if consuming by day
            startTime: '09:00',
            endTime: '18:00',
            isClosed: false,
            // Virtual fields to indicate source
            source: 'default'
        }));

        // 2. Fetch Global Settings (storeId: null, userId: null)
        const globalSettings = await TimeSettings.findAll({
            where: {
                tenantId,
                storeId: null,
                userId: null
            }
        });

        // 3. Fetch Specific Settings (if requested)
        let specificSettings = [];
        if (storeId || userId) {
            const specificWhere = { tenantId };
            if (storeId) specificWhere.storeId = storeId;
            if (userId) specificWhere.userId = userId;

            specificSettings = await TimeSettings.findAll({
                where: specificWhere
            });
        }

        // 4. Merge: Default -> Global -> Specific
        // We need to merge per Day AND Type (store vs appointment).
        // Since the request might be for specific type filter? The frontend usually requests '?type=...' or implied context.
        // The previous controller returned ALL. Let's return a unified list.
        // Note: The specific fetch handles type implicitly if the DB has type column.
        
        // Helper to map DB array to Map
        const toMap = (arr) => {
            const map = new Map();
            arr.forEach(item => {
                // Key by day + type. If type is missing in default, assume it applies to both?
                // Actually defaults we created above are generic.
                // Let's iterate the REQUESTED Type or both?
                // If the user asks for store settings, we care about 'store' type rows.
                // The 'type' column ('store', 'appointment') is critical.
                
                // Let's create a map: "Monday-store", "Monday-appointment"
                const key = `${item.day}-${item.type}`;
                map.set(key, item.toJSON());
            });
            return map;
        };

        const globalMap = toMap(globalSettings);
        const specificMap = toMap(specificSettings);

        // We want to return a list that covers all days for the RELEVANT types.
        // If query has storeId, we probably care about 'store' type.
        // If userId, 'appointment' type.
        // If neither, maybe both?
        // Let's generate defaults for BOTH types for all days.
        
        const fullList = [];
        const types = ['store', 'appointment'];

        types.forEach(type => {
            days.forEach(day => {
                const key = `${day}-${type}`;
                
                // 1. Start with Default
                let final = {
                    day,
                    type,
                    startTime: '09:00',
                    endTime: '18:00',
                    isClosed: false,
                    source: 'default',
                    tenantId
                };

                // 2. Override with Global
                if (globalMap.has(key)) {
                    final = { ...final, ...globalMap.get(key), source: 'global' };
                }

                // 3. Override with Specific
                if (specificMap.has(key)) {
                    final = { ...final, ...specificMap.get(key), source: 'specific' };
                }
                
                fullList.push(final);
            });
        });

        return sendResponse(res, {
            statusCode: STATUS_CODES.OK,
            success: true,
            data: fullList
        });

    } catch (error) {
        console.error('Error fetching time settings:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to fetch settings'
        });
    }
};

export const updateTimeSettings = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { settings } = req.body;

        if (!settings || !Array.isArray(settings)) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: "Settings array is required"
            });
        }
        
        console.log(`[TimeSettings] Updating for tenantId: ${tenantId}`);
        const transaction = await TimeSettings.sequelize.transaction();
        console.log(`[TimeSettings] Transaction started`);

        try {
            for (const [index, setting] of settings.entries()) {
                // Enforce Store Context if logged in as Store User
                let targetStoreId = setting.storeId || null;
                if (req.store && req.store.id) {
                    targetStoreId = req.store.id;
                }

                const whereClause = {
                    tenantId,
                    day: setting.day,
                    type: setting.type,
                    storeId: targetStoreId,
                    userId: setting.userId || null
                };
                
                const existing = await TimeSettings.findOne({ where: whereClause, transaction });
                
                if (existing) {
                    await existing.update({
                        startTime: setting.startTime,
                        endTime: setting.endTime,
                        isClosed: setting.isClosed
                    }, { transaction });
                } else {
                    // Remove ID if present to avoid duplicate key errors when cloning/creating new granular settings
                    const { id, ...createPayload } = setting;
                    await TimeSettings.create({
                        ...createPayload,
                        tenantId,
                        storeId: targetStoreId,
                        userId: setting.userId || null
                    }, { transaction });
                }
            }
            
            await transaction.commit();
            console.log(`[TimeSettings] Transaction committed`);
            
            return sendResponse(res, {
                statusCode: STATUS_CODES.OK,
                success: true,
                message: 'Settings updated successfully'
            });

        } catch (tError) {
            console.error('[TimeSettings] Transaction Error:', tError);
            await transaction.rollback();
            throw tError;
        }

    } catch (error) {
        console.error('Error updating time settings:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Failed to update time settings"
        });
    }
};
