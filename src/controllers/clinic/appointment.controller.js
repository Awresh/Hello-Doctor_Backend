import { Appointment, Tenant, User, TenantUser, ClinicSlotConfig, DoctorSlotConfig, SlotOverride } from "../../models/index.js"
import { sendResponse } from "../../utils/response.util.js"
import { STATUS_CODES } from "../../config/statusCodes.js"
import { Op } from "sequelize"

/**
 * Create a new appointment
 */
export const createAppointment = async (req, res) => {
    const transaction = await Appointment.sequelize.transaction();
    try {
        const { doctorId, appointmentDate, appointmentSlot, notes } = req.body
        let { userId, name, mobile, address, email } = req.body
        const tenantId = req.tenant.id;

        if (!tenantId) {
            await transaction.rollback();
            return sendResponse(res, {
                statusCode: STATUS_CODES.UNAUTHORIZED,
                success: false,
                message: 'Tenant ID not found.'
            })
        }

        if (!doctorId || !appointmentDate || !appointmentSlot) {
            await transaction.rollback();
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: 'Doctor ID, Date, and Slot are required.'
            })
        }

        // 1. Handle User Creation if userId is not provided
        if (!userId) {
            if (!name || !mobile) {
                await transaction.rollback();
                return sendResponse(res, {
                    statusCode: STATUS_CODES.BAD_REQUEST,
                    success: false,
                    message: 'User ID or (Name and Mobile) are required to book an appointment.'
                })
            }

            // Check if any user exists with this mobile
            const existingMobileUser = await User.findOne({
                where: { mobile },
                transaction
            })

            // Check if a specific user exists with this name and mobile
            let user = await User.findOne({
                where: {
                    name,
                    mobile
                },
                transaction
            })

            if (!user) {
                // Create new user
                // If no one has this mobile, they are the 'parent'. Otherwise, they are a 'child'.
                const userType = existingMobileUser ? 'child' : 'parent'

                user = await User.create({
                    name,
                    mobile,
                    address,
                    email,
                    type: userType,
                    isActive: true
                }, { transaction })
            }
            userId = user.id
        }

        // 2. Get Available Slots for that doctor on that date
        const dayName = new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long' })
        let availableSlots = []

        // Check Override
        const override = await SlotOverride.findOne({
            where: { tenantId, doctorId, date: appointmentDate },
            transaction
        })

        if (override) {
            availableSlots = override.slots
        } else {
            // Check Doctor Config
            const doctorConfig = await DoctorSlotConfig.findOne({
                where: { tenantId, doctorId },
                transaction
            })

            if (doctorConfig && !doctorConfig.useClinicSlots) {
                availableSlots = doctorConfig.customWeeklySlots[dayName] || []
            } else {
                // Fallback to Clinic Config
                const clinicConfig = await ClinicSlotConfig.findOne({
                    where: { tenantId },
                    transaction
                })
                if (clinicConfig) {
                    availableSlots = clinicConfig.weeklySlots[dayName] || []
                }
            }
        }

        // 3. Find the specific slot
        const slot = availableSlots.find(s => s.startTime === appointmentSlot)
        if (!slot) {
            await transaction.rollback();
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: 'Invalid slot selected or doctor not available at this time.'
            })
        }

        // 4. Check if slot is already full
        const appointmentCount = await Appointment.count({
            where: {
                tenantId,
                doctorId,
                appointmentDate,
                appointmentSlot,
                status: { [Op.notIn]: ['cancelled'] }
            },
            transaction
        })

        if (appointmentCount >= (slot.maxPatients || 1)) {
            await transaction.rollback();
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: 'This slot is already fully booked.'
            })
        }

        // 5. Create the appointment
        const appointment = await Appointment.create({
            tenantId,
            userId,
            doctorId,
            appointmentDate,
            appointmentSlot,
            notes,
            status: 'scheduled'
        }, { transaction })

        await transaction.commit();

        return sendResponse(res, {
            statusCode: STATUS_CODES.CREATED,
            message: 'Appointment booked successfully',
            data: appointment
        })

    } catch (error) {
        await transaction.rollback();
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
        const { doctorId, userId, date, status } = req.query
        const tenantId = req.tenant.id;
        const where = { tenantId }

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
        const tenantId = req.tenant.id;
        const appointment = await Appointment.findOne({
            where: { id, tenantId },
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
        const tenantId = req.tenant.id;

        const appointment = await Appointment.findOne({ where: { id, tenantId } })
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
