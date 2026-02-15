import { Notification } from "../models/index.js";
import { Op } from "sequelize";

export class NotificationRepository {
    async findAll(where, order, limit) {
        return await Notification.findAll({ where, order, limit });
    }

    async count(where) {
        return await Notification.count({ where });
    }

    async update(id, data, tenantId) {
        return await Notification.update(data, { where: { id, tenantId } });
    }

    async bulkUpdate(data, where) {
        return await Notification.update(data, { where });
    }

    async create(data) {
        return await Notification.create(data);
    }

    buildOrConditions(userId, role, isDoctor) {
        const orConditions = [{ userId }];
        if (role === 'admin') orConditions.push({ role: 'admin' });
        if (isDoctor) orConditions.push({ role: 'doctor' });
        return orConditions;
    }
}
