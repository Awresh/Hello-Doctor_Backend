import { Appointment, User, TenantUser, ClinicSlotConfig, DoctorSlotConfig, SlotOverride } from "../models/index.js";
import { Op } from "sequelize";

export class AppointmentRepository {
    async create(data, transaction) {
        return await Appointment.create(data, { transaction });
    }

    async findById(id, tenantId) {
        return await Appointment.findOne({
            where: { id, tenantId },
            include: [
                { model: User, attributes: ['id', 'name', 'email'] },
                { model: TenantUser, as: 'doctor', attributes: ['id', 'name', 'speciality'] }
            ]
        });
    }

    async findAll(where, order) {
        return await Appointment.findAll({
            where,
            include: [
                { model: User, attributes: ['id', 'name', 'email', 'mobile', 'age', 'gender', 'address'] },
                { model: TenantUser, as: 'doctor', attributes: ['id', 'name', 'speciality'] }
            ],
            order
        });
    }

    async count(where, transaction) {
        return await Appointment.count({ where, transaction });
    }

    async maxQueueOrder(where, transaction) {
        return await Appointment.max('queueOrder', { where, transaction }) || 0;
    }

    async update(appointment, transaction) {
        return await appointment.save({ transaction });
    }

    getSequelize() {
        return Appointment.sequelize;
    }
}
