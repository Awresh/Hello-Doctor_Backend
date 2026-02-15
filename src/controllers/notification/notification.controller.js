import { sendResponse } from '../../utils/response.util.js';
import { STATUS_CODES } from '../../config/statusCodes.js';
import { NotificationService } from '../../services/notification.service.js';

const notificationService = new NotificationService();

export const getNotifications = async (req, res) => {
    try {
        const { userRole, isDoctor } = await notificationService.getUserRole(req.user.id);
        const data = await notificationService.getNotifications(req.tenant.id, req.user.id, userRole, isDoctor);
        return sendResponse(res, { message: 'Notifications fetched', data });
    } catch (error) {
        console.error("Get Notifications Error", error);
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || 'Failed to fetch notifications';
        return sendResponse(res, { statusCode, success: false, message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        await notificationService.markAsRead(req.params.id, req.tenant.id);
        return sendResponse(res, { message: 'Marked as read' });
    } catch (error) {
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || 'Failed to update notification';
        return sendResponse(res, { statusCode, success: false, message });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        await notificationService.markAllAsRead(req.tenant.id, req.user.id);
        return sendResponse(res, { message: 'All marked as read' });
    } catch (error) {
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || 'Error';
        return sendResponse(res, { statusCode, success: false, message });
    }
}

export const createNotificationHelper = async (data) => {
    return await notificationService.createNotification(data);
};
