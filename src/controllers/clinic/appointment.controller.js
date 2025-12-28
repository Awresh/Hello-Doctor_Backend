import { Appointment, Tenant, User, TenantUser, ClinicSlotConfig, DoctorSlotConfig, SlotOverride } from "../../models/index.js"
import { getIO } from '../../socket.js';
import { sendResponse } from "../../utils/response.util.js"
import { STATUS_CODES } from "../../config/statusCodes.js"
import { Op } from "sequelize"

/**
 * Create a new appointment
 */
export const createAppointment = async (req, res) => {
    const transaction = await Appointment.sequelize.transaction();
    try {
        const { doctorId, notes, type = 'offline', source = 'walkin', isEmergency = false } = req.body
        const appointmentDate = req.body.appointmentDate || req.body.date
        const appointmentSlot = req.body.appointmentSlot || req.body.slot
        let { userId, name, mobile, address, email, age, gender } = req.body
        const tenantId = req.tenant.id;

        // Normalize gender
        if (gender) gender = gender.toLowerCase();

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
                    age,
                    gender,
                    type: userType,
                    isActive: true
                }, { transaction })
            } else {
                // Update existing user details if provided
                let hasUpdates = false;
                if (age) { user.age = age; hasUpdates = true; }
                if (gender) { user.gender = gender; hasUpdates = true; }
                if (address) { user.address = address; hasUpdates = true; }
                if (email) { user.email = email; hasUpdates = true; }

                if (hasUpdates) {
                    await user.save({ transaction });
                }
            }
            userId = user.id
        }

        // 2. Get Available Slots for that doctor on that date
        const dayName = new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long' })
        let availableSlots = []

        // Check Override
        // Check Override
        let defaultMaxPatients = 1;
        let defaultOnlineLimit = 0;

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

            if (doctorConfig) {
                defaultMaxPatients = doctorConfig.numberOfPerSlot || 1;
                defaultOnlineLimit = doctorConfig.onlinePatients || 0;
            }

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
        const slotMatch = availableSlots.find(s => {
            if (typeof s === 'string') return s === appointmentSlot;
            return s.startTime === appointmentSlot;
        });

        if (!slotMatch) {
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

        let maxPatients = defaultMaxPatients;
        if (typeof slotMatch !== 'string') {
            maxPatients = slotMatch.maxPatients || defaultMaxPatients;
        }

        if (appointmentCount >= maxPatients) {
            await transaction.rollback();
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: 'This slot is already fully booked.'
            })
        }

        if (type === 'online') {
            const onlineCount = await Appointment.count({
                where: {
                    tenantId,
                    doctorId,
                    appointmentDate,
                    appointmentSlot,
                    status: { [Op.notIn]: ['cancelled'] },
                    type: 'online'
                },
                transaction
            });
            // If onlineLimit is 0 (not configured), treat as 0 allowed? Or assume uncapped? 
            // Better to assume if configured, it's valid. If 0, effectively closes online booking.
            const onlineLimit = defaultOnlineLimit;

            if (onlineCount >= onlineLimit) {
                await transaction.rollback();
                return sendResponse(res, {
                    statusCode: STATUS_CODES.BAD_REQUEST,
                    success: false,
                    message: 'Online booking limit reached for this slot.'
                })
            }
        }

        // 5. Determine Queue Order
        // Find max queueOrder for this doctor/date/slot
        const maxQueueOrder = await Appointment.max('queueOrder', {
            where: {
                tenantId,
                doctorId,
                appointmentDate,
                appointmentSlot
            },
            transaction
        }) || 0;

        // 6. Create the appointment
        const appointment = await Appointment.create({
            tenantId,
            userId,
            doctorId,
            appointmentDate,
            appointmentSlot,
            notes,
            notes,
            notes,
            status: 'scheduled',
            type,
            source,
            isEmergency,
            queueOrder: maxQueueOrder + 1
        }, { transaction })

        await transaction.commit();

        // Emit Socket Event
        try {
            getIO().emit('appointment:update', { action: 'create', appointment });
        } catch (err) {
            console.error("Socket emit failed", err);
        }

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
        const currentUser = req.user; // From verifyToken

        const where = { tenantId }

        // Doctor View Restriction
        // FIXME: Disabled for debugging "Ongoing" visibility
        // if (currentUser && (currentUser.isDoctor || (currentUser.role && String(currentUser.role).toLowerCase() === 'doctor'))) {
        //      where.doctorId = currentUser.id;
        // } else if (doctorId) {
        //      where.doctorId = doctorId;
        // }
        // Default behavior: Trust the query param (frontend sets it)
        if (doctorId) where.doctorId = doctorId;

        if (userId) where.userId = userId
        if (date) where.appointmentDate = date
        if (status) where.status = status

        const appointments = await Appointment.findAll({
            where,
            include: [
                { model: User, attributes: ['id', 'name', 'email', 'mobile', 'age', 'gender', 'address'] },
                { model: TenantUser, as: 'doctor', attributes: ['id', 'name', 'speciality'] }
            ],
            order: [
                ['appointmentDate', 'ASC'],
                ['queueOrder', 'ASC'],
                ['appointmentSlot', 'ASC']
            ]
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

        if (status === 'visited' || status === 'processing' || status === 'ongoing') { // 'ongoing' typically used in frontend
            appointment.startedAt = new Date();
        }

        if (status === 'completed') {
            appointment.completedAt = new Date();
        }

        await appointment.save()

        // Emit Socket Event
        try {
            getIO().emit('appointment:update', {
                action: 'update',
                appointment: {
                    ...appointment.toJSON(),
                    tenantId: appointment.tenantId,
                    doctorId: appointment.doctorId
                }
            });
        } catch (err) {
            console.error("Socket emit failed", err);
        }

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

/**
 * Generic Update Appointment (Edit Details)
 */
export const updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenant.id;
        // Fields allowed to update
        const { notes, appointmentDate, appointmentSlot, status, type, isEmergency } = req.body;

        const appointment = await Appointment.findOne({ where: { id, tenantId } });
        if (!appointment) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: 'Appointment not found'
            });
        }

        // Update Appointment fields if provided
        if (notes !== undefined) appointment.notes = notes;
        if (appointmentDate) appointment.appointmentDate = appointmentDate;
        if (appointmentSlot) appointment.appointmentSlot = appointmentSlot;
        if (status) appointment.status = status;
        if (type) appointment.type = type;
        if (isEmergency !== undefined) appointment.isEmergency = isEmergency;

        await appointment.save();

        // Update User Details if provided
        // We need to fetch the user to update them
        const { name, mobile, email, age, gender, address } = req.body;
        if (name || mobile || email || age || gender || address) {
            const user = await User.findByPk(appointment.userId);
            if (user) {
                let hasUpdates = false;
                if (name) { user.name = name; hasUpdates = true; }
                if (mobile) { user.mobile = mobile; hasUpdates = true; }
                if (email !== undefined) { user.email = email; hasUpdates = true; } // Allow clearing email?
                if (age) { user.age = age; hasUpdates = true; }
                if (gender) { user.gender = gender.toLowerCase(); hasUpdates = true; }
                if (address !== undefined) { user.address = address; hasUpdates = true; }

                if (hasUpdates) {
                    await user.save();
                }
            }
        }

        // Emit Socket Event
        try {
            getIO().emit('appointment:update', {
                action: 'update',
                appointment: {
                    ...appointment.toJSON(),
                    tenantId: appointment.tenantId,
                    doctorId: appointment.doctorId
                }
            });
        } catch (err) {
            console.error("Socket emit failed", err);
        }

        return sendResponse(res, {
            message: 'Appointment updated successfully',
            data: appointment
        });

    } catch (error) {
        console.error('Update Appointment Error:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to update appointment'
        });
    }
}

/**
 * Get available slots for a doctor on a specific date
 */
export const getAvailableSlots = async (req, res) => {
    try {
        const { doctorId, date } = req.query;
        const tenantId = req.tenant.id;

        if (!doctorId || !date) {
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: 'Doctor ID and Date are required.'
            });
        }

        // Create date object in a way that respects the input date as "local" date part
        // Splitting YYYY-MM-DD ensures we don't get timezone shifts
        const [y, m, d] = date.split('-').map(Number);
        const localDate = new Date(y, m - 1, d);
        const dayName = localDate.toLocaleDateString('en-US', { weekday: 'long' });

        console.log(`Fetching slots for Doctor: ${doctorId}, Date: ${date}, Day: ${dayName}`);
        let configuredSlots = [];

        // 1. Check Override
        const override = await SlotOverride.findOne({
            where: { tenantId, doctorId, date },
        });

        let defaultMaxPatients = 1;
        let defaultOnlineLimit = 0;

        if (override) {
            configuredSlots = override.slots;
        } else {
            // 2. Check Doctor Config
            const doctorConfig = await DoctorSlotConfig.findOne({
                where: { tenantId, doctorId },
            });

            console.log('DoctorConfig found:', !!doctorConfig);
            if (doctorConfig) {
                console.log('DoctorConfig useClinicSlots:', doctorConfig.useClinicSlots);
                console.log('DoctorConfig customWeeklySlots keys:', Object.keys(doctorConfig.customWeeklySlots || {}));
            }

            if (doctorConfig && !doctorConfig.useClinicSlots) {
                // Try case-insensitive lookup
                const slots = doctorConfig.customWeeklySlots[dayName]
                    || doctorConfig.customWeeklySlots[dayName.toLowerCase()]
                    || doctorConfig.customWeeklySlots[dayName.toUpperCase()]
                    || [];
                console.log(`Slots found for ${dayName} (Doctor):`, slots.length);
                configuredSlots = slots;
                defaultMaxPatients = doctorConfig.numberOfPerSlot || 1;
                defaultOnlineLimit = doctorConfig.onlinePatients || 0;
            } else {
                // 3. Fallback to Clinic Config
                const clinicConfig = await ClinicSlotConfig.findOne({
                    where: { tenantId },
                });

                console.log('ClinicConfig found:', !!clinicConfig);
                if (clinicConfig) {
                    console.log('ClinicConfig weeklySlots keys:', Object.keys(clinicConfig.weeklySlots || {}));
                    const slots = clinicConfig.weeklySlots[dayName]
                        || clinicConfig.weeklySlots[dayName.toLowerCase()]
                        || clinicConfig.weeklySlots[dayName.toUpperCase()]
                        || [];
                    console.log(`Slots found for ${dayName} (Clinic):`, slots.length);
                    configuredSlots = slots;
                }
            }
        }

        // 4. Check availability for each slot
        const availableSlots = [];

        // Fetch all appointments for this day
        const appointments = await Appointment.findAll({
            where: {
                tenantId,
                doctorId,
                appointmentDate: date,
                status: { [Op.notIn]: ['cancelled'] }
            }
        });

        // Map appointment counts per slot
        const slotCounts = {};
        const onlineSlotCounts = {};

        appointments.forEach(app => {
            slotCounts[app.appointmentSlot] = (slotCounts[app.appointmentSlot] || 0) + 1;
            if (app.type === 'online') {
                onlineSlotCounts[app.appointmentSlot] = (onlineSlotCounts[app.appointmentSlot] || 0) + 1;
            }
        });

        const isOnlineRequest = req.query.type === 'online';

        configuredSlots.forEach(slot => {
            // Handle both object and string format (Doctor config typically saves as strings)
            const startTime = typeof slot === 'string' ? slot : slot.startTime;
            const maxPatients = typeof slot === 'string' ? defaultMaxPatients : (slot.maxPatients || 1);

            // Determine effective limit for this request
            let remaining = 0;
            const currentTotal = slotCounts[startTime] || 0;
            const currentOnline = onlineSlotCounts[startTime] || 0;

            if (isOnlineRequest) {
                // Online booking check
                // 1. Must have space in global total
                // 2. Must have space in online limit
                const globalRemaining = maxPatients - currentTotal;
                const onlineRemaining = (defaultOnlineLimit || maxPatients) - currentOnline;

                remaining = Math.min(globalRemaining, onlineRemaining);
            } else {
                // Admin/Offline booking check - only cares about total capacity
                remaining = maxPatients - currentTotal;
            }

            // Push all configured slots, allowing frontend to disable full ones
            availableSlots.push({
                startTime,
                maxPatients,
                available: Math.max(0, remaining)
            });
        });

        return sendResponse(res, {
            message: 'Available slots fetched successfully',
            data: availableSlots.sort((a, b) => a.startTime.localeCompare(b.startTime))
        });

    } catch (error) {
        console.error('Get Available Slots Error:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to fetch available slots'
        });
    }
};

/**
 * Reorder appointment queue
 */
export const reorderQueue = async (req, res) => {
    const transaction = await Appointment.sequelize.transaction();
    try {
        const { id } = req.params;
        const { steps = 1 } = req.body; // Number of positions to move down
        console.log(`Reorder Request: ID=${id}, Steps=${steps}, Body=`, req.body);
        const tenantId = req.tenant.id;

        const currentAppt = await Appointment.findOne({
            where: { id, tenantId },
            transaction
        });

        if (!currentAppt) {
            await transaction.rollback();
            return sendResponse(res, {
                statusCode: STATUS_CODES.NOT_FOUND,
                success: false,
                message: 'Appointment not found'
            });
        }

        const { appointmentDate, queueOrder, doctorId: currentDoctorId } = currentAppt;

        // Find all active scheduled/pending appointments for this DATE and DOCTOR (Doctor Queue)
        // If doctorId is null (rare?), it falls back to global, but we should enforce doctor scope if present.
        const whereClause = {
            tenantId,
            appointmentDate,
            status: { [Op.notIn]: ['cancelled', 'completed'] }
        };

        if (currentDoctorId) {
            whereClause.doctorId = currentDoctorId;
        }

        const appointments = await Appointment.findAll({
            where: whereClause,
            order: [['queueOrder', 'ASC'], ['appointmentSlot', 'ASC'], ['createdAt', 'ASC']],
            transaction
        });

        const currentIndex = appointments.findIndex(a => a.id == id);
        if (currentIndex === -1) {
            await transaction.rollback();
            return sendResponse(res, {
                statusCode: STATUS_CODES.BAD_REQUEST,
                success: false,
                message: 'Appointment not eligible for reordering'
            });
        }

        // If explicitly moving down by N
        // Swap logic:
        // A (1), B (2), C (3). Move A down by 1 -> B (1), A (2), C (3)
        // We need to swap queueOrder with the next item.

        if (currentIndex !== -1) {
            // Move current item in array
            const item = appointments.splice(currentIndex, 1)[0];

            // Calculate new index
            // ensure we don't go out of bounds
            let newIndex = currentIndex + parseInt(steps);
            if (newIndex >= appointments.length) newIndex = appointments.length; // Insert at end if overflow

            appointments.splice(newIndex, 0, item);

            // Update all in DB with new indices
            for (let i = 0; i < appointments.length; i++) {
                appointments[i].queueOrder = i + 1;
                await appointments[i].save({ transaction });
            }
        }

        await transaction.commit();

        // Emit Socket Event
        try {
            getIO().emit('appointment:update', { action: 'reorder' });
        } catch (err) {
            console.error("Socket emit failed", err);
        }

        return sendResponse(res, {
            message: 'Queue reordered successfully',
            success: true
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Reorder Queue Error:', error);
        return sendResponse(res, {
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to reorder queue'
        });
    }
}

export default {
    createAppointment,
    getAppointments,
    getAppointmentById,
    getAppointmentById,
    updateAppointmentStatus,
    updateAppointment,
    getAvailableSlots,
    reorderQueue
}
