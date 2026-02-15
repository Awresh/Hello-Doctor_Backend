import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { PrescriptionService } from "../../services/prescription.service.js";

const prescriptionService = new PrescriptionService();

export const savePrescription = async (req, res) => {
    try {
        const { prescription, created } = await prescriptionService.savePrescription(req.body, req.tenant.id);
        return sendResponse(res, {
            statusCode: created ? STATUS_CODES.CREATED : STATUS_CODES.OK,
            message: created ? 'Prescription created successfully' : 'Prescription updated successfully',
            data: prescription
        });
    } catch (error) {
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || 'Failed to save prescription';
        return sendResponse(res, { statusCode, success: false, message });
    }
};

export const getPrescriptionByAppointment = async (req, res) => {
    try {
        const prescription = await prescriptionService.getPrescriptionByAppointment(req.params.appointmentId, req.tenant.id);
        return sendResponse(res, { message: 'Prescription fetched successfully', data: prescription });
    } catch (error) {
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || 'Failed to fetch prescription';
        return sendResponse(res, { statusCode, success: false, message });
    }
};

export const getPatientHistory = async (req, res) => {
    try {
        const history = await prescriptionService.getPatientHistory(req.params.userId, req.tenant.id);
        return sendResponse(res, { message: 'Patient history fetched successfully', data: history });
    } catch (error) {
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || 'Failed to fetch history';
        return sendResponse(res, { statusCode, success: false, message });
    }
};

export default { savePrescription, getPrescriptionByAppointment, getPatientHistory };
