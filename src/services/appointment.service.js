import { AppointmentRepository } from "../repositories/appointment.repository.js";
import { UserService } from "./user.service.js";
import { SlotService } from "./slot.service.js";
import { TenantUser } from "../models/index.js";
import { Op } from "sequelize";

export class AppointmentService {
    constructor() {
        this.appointmentRepository = new AppointmentRepository();
        this.userService = new UserService();
        this.slotService = new SlotService();
    }

    async createAppointment(data, tenantId) {
        const transaction = await this.appointmentRepository.getSequelize().transaction();
        
        try {
            const { doctorId, notes, type = 'offline', source = 'walkin', isEmergency = false } = data;
            const appointmentDate = data.appointmentDate || data.date;
            let appointmentSlot = data.appointmentSlot || data.slot;
            const manualTime = data.manualTime;

            if (!doctorId || !appointmentDate || (!appointmentSlot && !manualTime)) {
                throw { statusCode: 400, message: 'Doctor ID, Date, and Slot are required.' };
            }

            if (isEmergency && !appointmentSlot && manualTime) {
                appointmentSlot = manualTime;
            }

            const userId = await this.userService.findOrCreateUser(data.userId, data, transaction);

            await this.slotService.validateSlot(tenantId, doctorId, appointmentDate, appointmentSlot, type, isEmergency, transaction);

            const maxQueueOrder = await this.appointmentRepository.maxQueueOrder({
                tenantId,
                doctorId,
                appointmentDate,
                appointmentSlot
            }, transaction);

            const appointment = await this.appointmentRepository.create({
                tenantId,
                userId,
                doctorId,
                appointmentDate,
                appointmentSlot,
                notes,
                status: 'scheduled',
                type,
                source,
                isEmergency,
                queueOrder: maxQueueOrder + 1
            }, transaction);

            await transaction.commit();
            return appointment;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async getAppointments(filters, tenantId, currentUser) {
        const where = { tenantId };

        if (filters.doctorId) where.doctorId = filters.doctorId;
        if (filters.userId) where.userId = filters.userId;
        if (filters.date) where.appointmentDate = filters.date;
        if (filters.status) where.status = filters.status;

        return await this.appointmentRepository.findAll(where, [
            ['appointmentDate', 'ASC'],
            ['queueOrder', 'ASC'],
            ['appointmentSlot', 'ASC']
        ]);
    }

    async getAppointmentById(id, tenantId) {
        const appointment = await this.appointmentRepository.findById(id, tenantId);
        if (!appointment) {
            throw { statusCode: 404, message: 'Appointment not found' };
        }
        return appointment;
    }

    async updateAppointmentStatus(id, status, tenantId) {
        const appointment = await this.appointmentRepository.findById(id, tenantId);
        if (!appointment) {
            throw { statusCode: 404, message: 'Appointment not found' };
        }

        appointment.status = status;

        if (status === 'visited' || status === 'processing' || status === 'ongoing') {
            appointment.startedAt = new Date();
        }

        if (status === 'completed') {
            appointment.completedAt = new Date();
        }

        await appointment.save();
        return appointment;
    }

    async updateAppointment(id, updates, tenantId) {
        const appointment = await this.appointmentRepository.findById(id, tenantId);
        if (!appointment) {
            throw { statusCode: 404, message: 'Appointment not found' };
        }

        const { notes, appointmentDate, appointmentSlot, status, type, isEmergency } = updates;

        if (notes !== undefined) appointment.notes = notes;
        if (appointmentDate) appointment.appointmentDate = appointmentDate;
        if (appointmentSlot) appointment.appointmentSlot = appointmentSlot;
        if (status) appointment.status = status;
        if (type) appointment.type = type;
        if (isEmergency !== undefined) appointment.isEmergency = isEmergency;

        await appointment.save();

        await this.userService.updateUser(appointment.userId, updates);

        return appointment;
    }

    async reorderQueue(id, steps, tenantId) {
        const transaction = await this.appointmentRepository.getSequelize().transaction();
        
        try {
            const currentAppt = await this.appointmentRepository.findById(id, tenantId);
            if (!currentAppt) {
                throw { statusCode: 404, message: 'Appointment not found' };
            }

            const { appointmentDate, doctorId: currentDoctorId } = currentAppt;

            const whereClause = {
                tenantId,
                appointmentDate,
                status: { [Op.notIn]: ['cancelled', 'completed'] }
            };

            if (currentDoctorId) {
                whereClause.doctorId = currentDoctorId;
            }

            const appointments = await this.appointmentRepository.findAll(whereClause, [
                ['queueOrder', 'ASC'],
                ['appointmentSlot', 'ASC'],
                ['createdAt', 'ASC']
            ]);

            const currentIndex = appointments.findIndex(a => a.id == id);
            if (currentIndex === -1) {
                throw { statusCode: 400, message: 'Appointment not eligible for reordering' };
            }

            const item = appointments.splice(currentIndex, 1)[0];
            let newIndex = currentIndex + parseInt(steps);
            if (newIndex >= appointments.length) newIndex = appointments.length;

            appointments.splice(newIndex, 0, item);

            for (let i = 0; i < appointments.length; i++) {
                appointments[i].queueOrder = i + 1;
                await appointments[i].save({ transaction });
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async getDoctorName(doctorId) {
        const doctorUser = await TenantUser.findByPk(doctorId, { attributes: ['name'] });
        return doctorUser ? doctorUser.name : 'Unknown Doctor';
    }
}
