import { ClinicSlotConfig, DoctorSlotConfig, SlotOverride, User } from "../../models/index.js"
import { sendResponse } from "../../utils/response.util.js"
import { STATUS_CODES } from "../../config/statusCodes.js"
import { Op } from "sequelize"

// --- Clinic Slot Configuration ---

// Update Clinic Slots (Admin only)
export const updateClinicSlots = async (req, res) => {
    try {
        const { weeklySlots } = req.body
        const tenantId = req.user.tenantId || req.body.tenantId // Admin might provide tenantId

        // Admin check (assuming verifyToken adds req.admin)
        if (!req.admin) {
            return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Unauthorized. Admin access required.' })
        }

        if (!tenantId) {
            return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Tenant ID is required.' })
        }

        let config = await ClinicSlotConfig.findOne({ where: { tenantId } })

        if (config) {
            config.weeklySlots = weeklySlots
            await config.save()
        } else {
            config = await ClinicSlotConfig.create({
                tenantId,
                weeklySlots
            })
        }

        return sendResponse(res, { message: 'Clinic slots updated successfully', data: config })
    } catch (error) {
        console.error('Update Clinic Slots Error:', error)
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: 'Failed to update clinic slots' })
    }
}

// Get Clinic Slots (Admin only)
export const getClinicSlots = async (req, res) => {
    try {
        const tenantId = req.user.tenantId || req.query.tenantId

        // Admin check
        if (!req.admin) {
            return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Unauthorized. Admin access required.' })
        }

        if (!tenantId) {
            return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Tenant ID is required.' })
        }

        const config = await ClinicSlotConfig.findOne({ where: { tenantId } })

        if (!config) {
            return sendResponse(res, { statusCode: STATUS_CODES.NOT_FOUND, success: false, message: 'Clinic configuration not found' })
        }

        return sendResponse(res, { message: 'Clinic slots fetched successfully', data: config })
    } catch (error) {
        console.error('Get Clinic Slots Error:', error)
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: 'Failed to fetch clinic slots' })
    }
}

// --- Doctor Slot Configuration ---

// Update Doctor Slots (Admin only)
export const updateDoctorSlots = async (req, res) => {
    try {
        const { doctorId } = req.params
        const { useClinicSlots, customWeeklySlots } = req.body
        const tenantId = req.user.tenantId || req.body.tenantId

        // Admin check
        if (!req.admin) {
            return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Unauthorized. Admin access required.' })
        }

        if (!tenantId) {
            return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Tenant ID is required.' })
        }

        // Verify doctor exists and belongs to tenant (optional but good practice)
        // const doctor = await User.findOne({ where: { id: doctorId, tenantId } })
        // if (!doctor) ...

        let config = await DoctorSlotConfig.findOne({ where: { doctorId, tenantId } })

        if (config) {
            if (useClinicSlots !== undefined) config.useClinicSlots = useClinicSlots
            if (customWeeklySlots !== undefined) config.customWeeklySlots = customWeeklySlots
            await config.save()
        } else {
            config = await DoctorSlotConfig.create({
                tenantId,
                doctorId,
                useClinicSlots: useClinicSlots !== undefined ? useClinicSlots : true,
                customWeeklySlots: customWeeklySlots || {}
            })
        }

        return sendResponse(res, { message: 'Doctor slots updated successfully', data: config })
    } catch (error) {
        console.error('Update Doctor Slots Error:', error)
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: 'Failed to update doctor slots' })
    }
}

// Get Doctor Slots (Admin only)
export const getDoctorSlots = async (req, res) => {
    try {
        const { doctorId } = req.params
        const tenantId = req.user.tenantId || req.query.tenantId

        // Admin check
        if (!req.admin) {
            return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Unauthorized. Admin access required.' })
        }

        if (!tenantId) {
            return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Tenant ID is required.' })
        }

        const config = await DoctorSlotConfig.findOne({ where: { doctorId, tenantId } })

        if (!config) {
            // Return default if not found
            return sendResponse(res, { message: 'Doctor slots fetched successfully', data: { useClinicSlots: true, customWeeklySlots: {} } })
        }

        return sendResponse(res, { message: 'Doctor slots fetched successfully', data: config })
    } catch (error) {
        console.error('Get Doctor Slots Error:', error)
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: 'Failed to fetch doctor slots' })
    }
}

// --- Slot Overrides ---

// Create/Update Override (Admin only)
export const createOverride = async (req, res) => {
    try {
        const { doctorId, date, slots } = req.body
        const tenantId = req.user.tenantId || req.body.tenantId

        // Admin check
        if (!req.admin) {
            return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Unauthorized. Admin access required.' })
        }

        if (!tenantId) {
            return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Tenant ID is required.' })
        }

        if (!date) {
            return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Date is required.' })
        }

        // Check for existing override
        let override = await SlotOverride.findOne({
            where: {
                tenantId,
                doctorId: doctorId || null, // Handle clinic-wide overrides if doctorId is null
                date
            }
        })

        if (override) {
            override.slots = slots
            await override.save()
        } else {
            override = await SlotOverride.create({
                tenantId,
                doctorId: doctorId || null,
                date,
                slots
            })
        }

        return sendResponse(res, { message: 'Override created successfully', data: override })
    } catch (error) {
        console.error('Create Override Error:', error)
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: 'Failed to create override' })
    }
}

// --- Public / Booking Logic ---

// Get Available Slots for a Date
export const getAvailableSlots = async (req, res) => {
    try {
        const { doctorId, date, tenantId } = req.query

        if (!doctorId || !date || !tenantId) {
            return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Doctor ID, Date, and Tenant ID are required.' })
        }

        // 1. Check for Override (Specific Date)
        const override = await SlotOverride.findOne({
            where: {
                tenantId,
                doctorId,
                date
            }
        })

        if (override) {
            return sendResponse(res, { message: 'Available slots fetched (Override)', data: override.slots })
        }

        // 2. Check Doctor Configuration
        const doctorConfig = await DoctorSlotConfig.findOne({
            where: { tenantId, doctorId }
        })

        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' })

        if (doctorConfig && !doctorConfig.useClinicSlots) {
            const slots = doctorConfig.customWeeklySlots[dayName] || []
            return sendResponse(res, { message: 'Available slots fetched (Doctor Custom)', data: slots })
        }

        // 3. Fallback to Clinic Configuration
        const clinicConfig = await ClinicSlotConfig.findOne({
            where: { tenantId }
        })

        if (clinicConfig) {
            const slots = clinicConfig.weeklySlots[dayName] || []
            return sendResponse(res, { message: 'Available slots fetched (Clinic Default)', data: slots })
        }

        // 4. No configuration found
        return sendResponse(res, { message: 'No slots configured', data: [] })

    } catch (error) {
        console.error('Get Available Slots Error:', error)
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: 'Failed to fetch available slots' })
    }
}

export default {
    updateClinicSlots,
    getClinicSlots,
    updateDoctorSlots,
    getDoctorSlots,
    createOverride,
    getAvailableSlots
}
