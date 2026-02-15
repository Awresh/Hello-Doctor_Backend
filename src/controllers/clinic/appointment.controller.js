import { getIO } from '../../socket.js';
import { sendResponse } from "../../utils/response.util.js"
import { createNotificationHelper } from '../notification/notification.controller.js';
import { STATUS_CODES } from "../../config/statusCodes.js"
import { AppointmentService } from "../../services/appointment.service.js"
import { UserService } from "../../services/user.service.js"
import { SlotService } from "../../services/slot.service.js"
import { NotificationService } from "../../services/notification.service.js"
import { SocketService } from "../../services/socket.service.js"
import { AppointmentValidator } from "../../validators/appointment.validator.js"

const appointmentService = new AppointmentService();
const userService = new UserService();
const slotService = new SlotService();
const notificationService = new NotificationService();
const appointmentValidator = new AppointmentValidator();

/**
 * Create a new appointment
 */
export const createAppointment = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        appointmentValidator.validateCreateAppointment(req.body, tenantId);
        
        const appointment = await appointmentService.createAppointment(req.body, tenantId);
        
        const socketService = new SocketService(getIO());
        const doctorName = await appointmentService.getDoctorName(req.body.doctorId);
        
        socketService.emitAppointmentUpdate('create', {
            appointment,
            doctorName,
            patientName: req.body.name
        });

        await notificationService.createAppointmentNotifications(
            tenantId,
            req.body.doctorId,
            doctorName,
            req.body.name,
            req.body.appointmentDate || req.body.date,
            req.body.appointmentSlot || req.body.slot,
            appointment.id,
            createNotificationHelper
        );

        return sendResponse(res, {
            statusCode: STATUS_CODES.CREATED,
            message: 'Appointment booked successfully',
            data: appointment
        });
    } catch (error) {
        console.error('Create Appointment Error:', error);
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || 'Failed to book appointment';
        return sendResponse(res, { statusCode, success: false, message });
    }
}

/**
 * Get appointments with filters
 */
export const getAppointments = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const currentUser = req.user;
        const appointments = await appointmentService.getAppointments(req.query, tenantId, currentUser);
        return sendResponse(res, { message: 'Appointments fetched successfully', data: appointments });
    } catch (error) {
        console.error('Get Appointments Error:', error);
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || 'Failed to fetch appointments';
        return sendResponse(res, { statusCode, success: false, message });
    }
}

/**
 * Get appointment by ID
 */
export const getAppointmentById = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const appointment = await appointmentService.getAppointmentById(req.params.id, tenantId);
        return sendResponse(res, { message: 'Appointment fetched successfully', data: appointment });
    } catch (error) {
        console.error('Get Appointment By ID Error:', error);
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || 'Failed to fetch appointment';
        return sendResponse(res, { statusCode, success: false, message });
    }
}

/**
 * Update appointment status
 */
export const updateAppointmentStatus = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const appointment = await appointmentService.updateAppointmentStatus(req.params.id, req.body.status, tenantId);
        
        const socketService = new SocketService(getIO());
        socketService.emitAppointmentUpdate('update', {
            appointment: {
                ...appointment.toJSON(),
                tenantId: appointment.tenantId,
                doctorId: appointment.doctorId
            }
        });

        return sendResponse(res, { message: `Appointment status updated to ${req.body.status}`, data: appointment });
    } catch (error) {
        console.error('Update Appointment Status Error:', error);
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || 'Failed to update appointment status';
        return sendResponse(res, { statusCode, success: false, message });
    }
}

/**
 * Generic Update Appointment (Edit Details)
 */
export const updateAppointment = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const appointment = await appointmentService.updateAppointment(req.params.id, req.body, tenantId);
        
        const socketService = new SocketService(getIO());
        socketService.emitAppointmentUpdate('update', {
            appointment: {
                ...appointment.toJSON(),
                tenantId: appointment.tenantId,
                doctorId: appointment.doctorId
            }
        });

        return sendResponse(res, { message: 'Appointment updated successfully', data: appointment });
    } catch (error) {
        console.error('Update Appointment Error:', error);
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || 'Failed to update appointment';
        return sendResponse(res, { statusCode, success: false, message });
    }
}

/**
 * Get available slots for a doctor on a specific date
 */
export const getAvailableSlots = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        appointmentValidator.validateGetAvailableSlots(req.query);
        
        const availableSlots = await slotService.getAvailableSlotsWithCounts(
            tenantId,
            req.query.doctorId,
            req.query.date,
            req.query.type
        );

        return sendResponse(res, { message: 'Available slots fetched successfully', data: availableSlots });
    } catch (error) {
        console.error('Get Available Slots Error:', error);
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || 'Failed to fetch available slots';
        return sendResponse(res, { statusCode, success: false, message });
    }
};

/**
 * Reorder appointment queue
 */
export const reorderQueue = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        await appointmentService.reorderQueue(req.params.id, req.body.steps || 1, tenantId);
        
        const socketService = new SocketService(getIO());
        socketService.emitAppointmentUpdate('reorder', {});

        return sendResponse(res, { message: 'Queue reordered successfully', success: true });
    } catch (error) {
        console.error('Reorder Queue Error:', error);
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || 'Failed to reorder queue';
        return sendResponse(res, { statusCode, success: false, message });
    }
}

/**
 * Search patients (Users) by name or mobile
 */
export const searchPatients = async (req, res) => {
    try {
        const users = await userService.searchPatients(req.query.search);
        return sendResponse(res, { message: 'Patients fetched successfully', data: users });
    } catch (error) {
        console.error('Search Patients Error:', error);
        const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
        const message = error.message || 'Failed to search patients';
        return sendResponse(res, { statusCode, success: false, message });
    }
}

export default {
    createAppointment,
    getAppointments,
    getAppointmentById,
    updateAppointmentStatus,
    updateAppointment,
    getAvailableSlots,
    reorderQueue,
    searchPatients
}
