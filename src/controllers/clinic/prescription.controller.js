import { Prescription, Appointment, User, TenantUser } from "../../models/index.js";
import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";

/**
 * Save or Update a Prescription
 */
export const savePrescription = async (req, res) => {
    try {
        const { appointmentId, vitals, medications, notes, canvasData } = req.body;
        const tenantId = req.tenant.id;

        if (!appointmentId) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: 'Appointment ID is required.'
            });
        }

        // 1. Verify Appointment exists and belongs to tenant
        const appointment = await Appointment.findOne({
            where: { id: appointmentId, tenantId }
        });

        if (!appointment) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: 'Appointment not found.'
            });
        }

        // 2. Upsert Prescription
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
        }, {
            returning: true
        });

        // 3. Mark appointment as completed if it was 'ongoing' or 'visited'
        if (['ongoing', 'visited', 'processing'].includes(appointment.status)) {
            appointment.status = 'completed';
            appointment.completedAt = new Date();
            await appointment.save();
        }

        return sendResponse(res, {
            statusCode: created ? STATUS_CODES.CREATED : STATUS_CODES.OK,
            message: created ? 'Prescription created successfully' : 'Prescription updated successfully',
            data: prescription
        });

    } catch (error) {
        console.error('Detailed Save Prescription Error:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: `Failed to save prescription: ${error.message || 'Unknown error'}`
        });
    }
};

/**
 * Get Prescription by Appointment ID
 */
export const getPrescriptionByAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const tenantId = req.tenant.id;

        const prescription = await Prescription.findOne({
            where: { appointmentId, tenantId }
        });

        if (!prescription) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: 'Prescription not found.'
            });
        }

        return sendResponse(res, {
            message: 'Prescription fetched successfully',
            data: prescription
        });

    } catch (error) {
        console.error('Get Prescription Error:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to fetch prescription'
        });
    }
};

/**
 * Get Patient History (all past prescriptions)
 */
export const getPatientHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const tenantId = req.tenant.id;

        const history = await Prescription.findAll({
            where: { userId, tenantId },
            include: [
                { model: Appointment, attributes: ['id', 'appointmentDate', 'status'] },
                { model: TenantUser, as: 'doctor', attributes: ['id', 'name'] }
            ],
            order: [['date', 'DESC'], ['createdAt', 'DESC']]
        });

        return sendResponse(res, {
            message: 'Patient history fetched successfully',
            data: history
        });

    } catch (error) {
        console.error('Get Patient History Error:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to fetch history'
        });
    }
};

export default {
    savePrescription,
    getPrescriptionByAppointment,
    getPatientHistory
};
