import { TimeSlot } from "../../models/index.js"
import { sendResponse } from "../../utils/response.util.js"
import { STATUS_CODES } from "../../config/statusCodes.js"

// Create a new time slot
// Create a new time slot
export const createTimeSlot = async (req, res) => {
    try {
        const { from, to } = req.body

        // Ensure only admin can create (middleware should handle this, but double check if needed)
        // Assuming verifyToken adds req.admin if admin token is used
        if (!req.admin) {
            return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Unauthorized. Admin access required.' })
        }

        if (!from || !to) {
            return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'From and To times are required' })
        }

        const timeSlot = await TimeSlot.create({
            from,
            to
        })

        return sendResponse(res, { statusCode: STATUS_CODES.CREATED, message: 'Time slot created successfully', data: timeSlot })
    } catch (error) {
        console.error('Create TimeSlot Error:', error)
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: 'Failed to create time slot' })
    }
}

// Get all time slots
export const getTimeSlots = async (req, res) => {
    try {
        // Admin access check
        if (!req.admin) {
            return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Unauthorized. Admin access required.' })
        }

        const timeSlots = await TimeSlot.findAll({
            where: { isActive: true }
        })

        return sendResponse(res, { message: 'Time slots fetched successfully', data: timeSlots })
    } catch (error) {
        console.error('Get TimeSlots Error:', error)
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: 'Failed to fetch time slots' })
    }
}

// Update a time slot
export const updateTimeSlot = async (req, res) => {
    try {
        const { id } = req.params
        const { from, to, isActive } = req.body

        // Admin access check
        if (!req.admin) {
            return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Unauthorized. Admin access required.' })
        }

        const timeSlot = await TimeSlot.findByPk(id)

        if (!timeSlot) {
            return sendResponse(res, { statusCode: STATUS_CODES.NOT_FOUND, success: false, message: 'Time slot not found' })
        }

        if (from) timeSlot.from = from
        if (to) timeSlot.to = to
        if (isActive !== undefined) timeSlot.isActive = isActive

        await timeSlot.save()

        return sendResponse(res, { message: 'Time slot updated successfully', data: timeSlot })
    } catch (error) {
        console.error('Update TimeSlot Error:', error)
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: 'Failed to update time slot' })
    }
}

// Delete a time slot
export const deleteTimeSlot = async (req, res) => {
    try {
        const { id } = req.params

        // Admin access check
        if (!req.admin) {
            return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Unauthorized. Admin access required.' })
        }

        const timeSlot = await TimeSlot.findByPk(id)

        if (!timeSlot) {
            return sendResponse(res, { statusCode: STATUS_CODES.NOT_FOUND, success: false, message: 'Time slot not found' })
        }

        await timeSlot.destroy()

        return sendResponse(res, { message: 'Time slot deleted successfully' })
    } catch (error) {
        console.error('Delete TimeSlot Error:', error)
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: 'Failed to delete time slot' })
    }
}

export default {
    createTimeSlot,
    getTimeSlots,
    updateTimeSlot,
    deleteTimeSlot
}
