import { Notification, TenantUser } from '../../models/index.js';
import { sendResponse } from '../../utils/response.util.js';
import { STATUS_CODES } from '../../config/statusCodes.js';

/**
 * Get notifications for the current user
 */
export const getNotifications = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const userId = req.user.id;
        const tenantUser = await TenantUser.findByPk(userId);
        const userRole = tenantUser ? tenantUser.role : null;
        const isDoctor = tenantUser ? (tenantUser.isDoctor || String(userRole).toLowerCase() === 'doctor') : false;
        
        let whereClause = {
            tenantId,
            [Symbol.for('or')]: [ // Using Sequelize OR
                { userId: userId } // Direct assignment
            ]
        };

        // If admin, show everything ? Or just admin notifications?
        // Usually admins see system wide or rolebased.
        // For now, let's keep it simple: Direct assignment OR Role based
        
        // Handling role-based notifications manually in query
        // Since Sequelize OR syntax needs Op, let's import it or construct
        const { Op } = await import('sequelize');
        
        const orConditions = [
            { userId: userId }
        ];

        if (req.user.role === 'admin') {
             orConditions.push({ role: 'admin' });
        }
        
        if (isDoctor) {
             orConditions.push({ role: 'doctor' });
        }

        const notifications = await Notification.findAll({
            where: {
                tenantId,
                [Op.or]: orConditions
            },
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        const unreadCount = await Notification.count({
            where: {
                tenantId,
                [Op.or]: orConditions,
                isRead: false
            }
        });

        return sendResponse(res, {
            message: 'Notifications fetched',
            data: {
                list: notifications,
                unreadCount
            }
        });

    } catch (error) {
        console.error("Get Notifications Error", error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenant.id;

        await Notification.update({ isRead: true }, {
            where: { id, tenantId }
        });

        return sendResponse(res, {
            message: 'Marked as read'
        });
    } catch (error) {
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to update notification'
        });
    }
};

/**
 * Mark all as read
 */
export const markAllAsRead = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const userId = req.user.id;
        // Same logic as get: define scope
         const { Op } = await import('sequelize');
         const notifications = await Notification.update({ isRead: true }, {
             where: {
                 tenantId,
                 userId: userId, // Only mark own notifications for safety, or expand scope
                 isRead: false
             }
         });
         
         return sendResponse(res, { message: 'All marked as read' });
    } catch(err) {
         return sendResponse(res, { statusCode: 500, success: false, message: 'Error' });
    }
}

/**
 * Internal Helper to create notification
 */
export const createNotificationHelper = async ({ tenantId, userId, role, title, message, type = 'info', relatedId, metadata }) => {
    try {
        return await Notification.create({
            tenantId,
            userId,
            role,
            title,
            message,
            type,
            relatedId,
            metadata
        });
    } catch (error) {
        console.error("Failed to create notification", error);
        return null; // Don't crash main flow
    }
};
