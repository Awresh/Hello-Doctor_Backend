import { Appointment, Tenant, User, TenantUser, ClinicSlotConfig, DoctorSlotConfig, SlotOverride } from "../../models/index.js"
import { sendResponse } from "../../utils/response.util.js"
import { STATUS_CODES } from "../../config/statusCodes.js"
import { Op } from "sequelize"

/**
 * Create a new appointment
 */
export const createAppointment = async (req, res) => {
    try {
        const { tenantId, userId, doctorId, appointmentDate, appointmentSlot, notes } = req.body

        if (!tenantId || !userId || !doctorId || !appointmentDate || !appointmentSlot) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: 'Tenant ID, User ID, Doctor ID, Date, and Slot are required.'
            })
        }

        // 1. Get Available Slots for that doctor on that date
        const dayName = new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long' })
        let availableSlots = []

        // Check Override
        const override = await SlotOverride.findOne({
            where: { tenantId, doctorId, date: appointmentDate }
        })

        if (override) {
            availableSlots = override.slots
        } else {
            // Check Doctor Config
            const doctorConfig = await DoctorSlotConfig.findOne({
                where: { tenantId, doctorId }
            })

            if (doctorConfig && !doctorConfig.useClinicSlots) {
                availableSlots = doctorConfig.customWeeklySlots[dayName] || []
            } else {
                // Fallback to Clinic Config
                const clinicConfig = await ClinicSlotConfig.findOne({
                    where: { tenantId }
                })
                if (clinicConfig) {
                    availableSlots = clinicConfig.weeklySlots[dayName] || []
                }
            }
        }

        // 2. Find the specific slot
        const slot = availableSlots.find(s => s.startTime === appointmentSlot)
        if (!slot) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: 'Invalid slot selected or doctor not available at this time.'
            })
        }

        // 3. Check if slot is already full
        const appointmentCount = await Appointment.count({
            where: {
                tenantId,
                doctorId,
                appointmentDate,
                appointmentSlot,
                status: { [Op.notIn]: ['cancelled'] }
            }
        })

        if (appointmentCount >= (slot.maxPatients || 1)) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: 'This slot is already fully booked.'
            })
        }

        // 4. Create the appointment
        const appointment = await Appointment.create({
            tenantId,
            userId,
            doctorId,
            appointmentDate,
            appointmentSlot,
            notes,
            status: 'scheduled'
        })

        return sendResponse(res, {
            statusCode: STATUS_CODES.CREATED,
            message: 'Appointment booked successfully',
            data: appointment
        })

    } catch (error) {
        console.error('Create Appointment Error:', error)
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to book appointment'
        })
    }
}

/**
 * Get appointments with filters
 */
export const getAppointments = async (req, res) => {
    try {
        const { tenantId, doctorId, userId, date, status } = req.query
        const where = {}

        if (tenantId) where.tenantId = tenantId
        if (doctorId) where.doctorId = doctorId
        if (userId) where.userId = userId
        if (date) where.appointmentDate = date
        if (status) where.status = status

        const appointments = await Appointment.findAll({
            where,
            include: [
                { model: User, attributes: ['id', 'name', 'email'] },
                { model: TenantUser, as: 'doctor', attributes: ['id', 'name', 'speciality'] }
            ],
            order: [['appointmentDate', 'ASC'], ['appointmentSlot', 'ASC']]
        })

        return sendResponse(res, {
            message: 'Appointments fetched successfully',
            data: appointments
        })
    } catch (error) {
        console.error('Get Appointments Error:', error)
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to fetch appointments'
        })
    }
}

/**
 * Get appointment by ID
 */
export const getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params
        const appointment = await Appointment.findByPk(id, {
            include: [
                { model: User, attributes: ['id', 'name', 'email'] },
                { model: TenantUser, as: 'doctor', attributes: ['id', 'name', 'speciality'] }
            ]
        })

        if (!appointment) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: 'Appointment not found'
            })
        }

        return sendResponse(res, {
            message: 'Appointment fetched successfully',
            data: appointment
        })
    } catch (error) {
        console.error('Get Appointment By ID Error:', error)
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to fetch appointment'
        })
    }
}

/**
 * Update appointment status
 */
export const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params
        const { status } = req.body

        const appointment = await Appointment.findByPk(id)
        if (!appointment) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: 'Appointment not found'
            })
        }

        appointment.status = status
        await appointment.save()

        return sendResponse(res, {
            message: `Appointment status updated to ${status}`,
            data: appointment
        })
    } catch (error) {
        console.error('Update Appointment Status Error:', error)
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to update appointment status'
        })
    }
}

export default {
    createAppointment,
    getAppointments,
    getAppointmentById,
    updateAppointmentStatus
}
