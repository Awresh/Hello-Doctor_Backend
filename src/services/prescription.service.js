import { CrudRepository } from "../repositories/crud.repository.js";
import { CrudService } from "./crud.service.js";
import { Prescription, Appointment, TenantUser } from "../models/index.js";

export class PrescriptionService extends CrudService {
    constructor() {
        super(new CrudRepository(Prescription));
    }

    async savePrescription(data, tenantId) {
        const { appointmentId, vitals, medications, notes, canvasData } = data;

        if (!appointmentId) {
            throw { statusCode: 400, message: 'Appointment ID is required.' };
        }

        const appointment = await Appointment.findOne({
            where: { id: appointmentId, tenantId }
        });

        if (!appointment) {
            throw { statusCode: 404, message: 'Appointment not found.' };
        }

        const [prescription, created] = await Prescription.upsert({
            tenantId,
            appointmentId,
            userId: appointment.userId,
            doctorId: appointment.doctorId,
            vitals,
            medications,
            notes,
            canvasData,
            date: appointment.appointmentDate
        }, { returning: true });

        if (['ongoing', 'visited', 'processing'].includes(appointment.status)) {
            appointment.status = 'completed';
            appointment.completedAt = new Date();
            await appointment.save();
        }

        return { prescription, created };
    }

    async getPrescriptionByAppointment(appointmentId, tenantId) {
        const prescription = await Prescription.findOne({
            where: { appointmentId, tenantId }
        });

        if (!prescription) {
            throw { statusCode: 404, message: 'Prescription not found.' };
        }

        return prescription;
    }

    async getPatientHistory(userId, tenantId) {
        return await Prescription.findAll({
            where: { userId, tenantId },
            include: [
                { model: Appointment, attributes: ['id', 'appointmentDate', 'status'] },
                { model: TenantUser, as: 'doctor', attributes: ['id', 'name'] }
            ],
            order: [['date', 'DESC'], ['createdAt', 'DESC']]
        });
    }
}
