import { NotificationRepository } from "../repositories/notification.repository.js";
import { TenantUser } from "../models/index.js";
import { Op } from "sequelize";

export class NotificationService {
    constructor() {
        this.notificationRepository = new NotificationRepository();
    }

    async getNotifications(tenantId, userId, userRole, isDoctor) {
        const orConditions = this.notificationRepository.buildOrConditions(userId, userRole, isDoctor);

        const notifications = await this.notificationRepository.findAll(
            { tenantId, [Op.or]: orConditions },
            [['createdAt', 'DESC']],
            50
        );

        const unreadCount = await this.notificationRepository.count({
            tenantId,
            [Op.or]: orConditions,
            isRead: false
        });

        return { list: notifications, unreadCount };
    }

    async getUserRole(userId) {
        const tenantUser = await TenantUser.findByPk(userId);
        const userRole = tenantUser ? tenantUser.role : null;
        const isDoctor = tenantUser ? (tenantUser.isDoctor || String(userRole).toLowerCase() === 'doctor') : false;
        return { userRole, isDoctor };
    }

    async markAsRead(id, tenantId) {
        await this.notificationRepository.update(id, { isRead: true }, tenantId);
    }

    async markAllAsRead(tenantId, userId) {
        await this.notificationRepository.bulkUpdate(
            { isRead: true },
            { tenantId, userId, isRead: false }
        );
    }

    async createNotification(data) {
        try {
            return await this.notificationRepository.create(data);
        } catch (error) {
            console.error("Failed to create notification", error);
            return null;
        }
    }
}
