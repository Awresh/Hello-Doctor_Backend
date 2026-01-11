import { ClinicSlotConfig, DoctorSlotConfig, SlotOverride, User } from "../../models/index.js"
import { sendResponse } from "../../utils/response.util.js"
import { STATUS_CODES } from "../../config/statusCodes.js"
import { Op } from "sequelize"

// --- Clinic Slot Configuration ---

// Update Clinic Slots (Admin only)
export const updateClinicSlots = async (req, res) => {
    try {
        let { weeklySlots } = req.body
        const tenantId = req.user?.tenantId || req.tenant?.id || req.body.tenantId

        // Admin check (assuming verifyToken adds req.admin)
        if (!req.admin && !req.user?.isAdmin && !req.user?.role?.includes('admin')) {
             if (!req.user && !req.tenant && !tenantId) {
                return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Unauthorized. No user found.' })
            }
        }

        if (!tenantId) {
            return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Tenant ID is required.' })
        }

        // --- VALIDATION: Remove Duplicates ---
        if (weeklySlots) {
             Object.keys(weeklySlots).forEach(day => {
                 const slots = weeklySlots[day];
                 if (Array.isArray(slots)) {
                     // Deduplicate by startTime or value
                     // Assuming slots can be objects {startTime: "09:00"} or strings "09:00"
                     const uniqueMap = new Map();
                     slots.forEach(s => {
                         const time = typeof s === 'string' ? s : s.startTime;
                         if (!uniqueMap.has(time)) {
                             uniqueMap.set(time, s);
                         }
                     });
                     // Sort by time
                     weeklySlots[day] = Array.from(uniqueMap.values()).sort((a, b) => {
                         const timeA = typeof a === 'string' ? a : a.startTime;
                         const timeB = typeof b === 'string' ? b : b.startTime;
                         return timeA.localeCompare(timeB);
                     });
                 }
             });
        }
        // -------------------------------------

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
        const tenantId = req.user?.tenantId || req.tenant?.id || req.query.tenantId

        // Admin check
        if (!req.admin && !req.user?.isAdmin && !req.user?.role?.includes('admin')) {
             if (!req.user && !req.tenant && !tenantId) {
                return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Unauthorized. No user found.' })
            }
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
        const { useClinicSlots, customWeeklySlots, numberOfPerSlot, onlinePatients, offlinePatients } = req.body
        const tenantId = req.user?.tenantId || req.tenant?.id || req.body.tenantId

        // Admin check
        if (!req.admin && !req.user?.isAdmin && !req.user?.role?.includes('admin')) {
             if (!req.user && !req.tenant && !tenantId) {
                return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Unauthorized. No user found.' })
            }
        }

        if (!tenantId) {
            return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Tenant ID is required.' })
        }

        // Verify doctor exists and belongs to tenant (optional but good practice)
        // const doctor = await User.findOne({ where: { id: doctorId, tenantId } })
        // if (!doctor) ...

        let config = await DoctorSlotConfig.findOne({ where: { doctorId, tenantId } })

        if (config) {
            // --- SMART SYNC LOGIC ---
            if (customWeeklySlots) {
                const oldSlots = config.customWeeklySlots || {};
                const newSlots = customWeeklySlots;
                const changedDays = [];

                Object.keys(newSlots).forEach(day => {
                    // Compare sorted arrays to detect changes
                    const oldArr = (oldSlots[day] || []).slice().sort();
                    const newArr = (newSlots[day] || []).slice().sort();
                    if (JSON.stringify(oldArr) !== JSON.stringify(newArr)) {
                        changedDays.push(day);
                    }
                });

                if (changedDays.length > 0) {
                     // Find future overrides to sync
                     const todayStr = new Date().toLocaleDateString('en-CA');
                     const futureOverrides = await SlotOverride.findAll({
                         where: {
                             tenantId,
                             doctorId,
                             date: { [Op.gte]: todayStr }
                         }
                     });
                     
                     for (const override of futureOverrides) {
                         const d = new Date(override.date);
                         const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
                         
                         if (changedDays.includes(dayName)) {
                             const oldBaseTimes = oldSlots[dayName] || [];
                             const newBaseTimes = newSlots[dayName] || [];
                             const currentOverrideSlots = override.slots || []; 
                             
                             // 1. Identify Manual Slots (in Override but NOT in Old Base)
                             // Preserves emergency slots added by user
                             const manualSlots = currentOverrideSlots.filter(s => {
                                 const t = s.startTime || s; 
                                 return !oldBaseTimes.includes(t);
                             });
                             
                             // 2. Create objects for New Base
                             // Use new patient limit or fallback to existing config
                             const patientsLimit = numberOfPerSlot !== undefined ? parseInt(numberOfPerSlot) : config.numberOfPerSlot;
                             
                             const newBaseObjects = newBaseTimes.map(time => ({
                                 startTime: time,
                                 maxPatients: patientsLimit || 1
                             }));
                             
                             // 3. Merge: Manual slots + New Base slots
                             // Deduplicate: If time exists in both, prefer Manual (it might have custom settings)
                             // actually if it's in NewBase, it's a standard slot now. 
                             // But if it was also manual, maybe we keep manual props?
                             // Let's just merge list and ensure unique startTime
                             
                             const combined = [...manualSlots];
                             newBaseObjects.forEach(nb => {
                                 if (!combined.find(c => c.startTime === nb.startTime)) {
                                     combined.push(nb);
                                 }
                             });
                             
                             combined.sort((a,b) => a.startTime.localeCompare(b.startTime));
                             
                             override.slots = combined;
                             // console.log(`Smart Sync Updating ${override.date}:`, combined);
                             await override.save();
                         }
                     }
                }
            }
            // ------------------------

            if (useClinicSlots !== undefined) config.useClinicSlots = useClinicSlots
            if (customWeeklySlots !== undefined) config.customWeeklySlots = customWeeklySlots
            if (numberOfPerSlot !== undefined) config.numberOfPerSlot = numberOfPerSlot
            if (onlinePatients !== undefined) config.onlinePatients = onlinePatients
            if (offlinePatients !== undefined) config.offlinePatients = offlinePatients
            await config.save()
        } else {
            console.log("Creating DoctorSlotConfig with:", { onlinePatients, offlinePatients, numberOfPerSlot });
            config = await DoctorSlotConfig.create({
                tenantId,
                doctorId,
                useClinicSlots: useClinicSlots !== undefined ? useClinicSlots : true,
                customWeeklySlots: customWeeklySlots || {},
                numberOfPerSlot: numberOfPerSlot || 1,
                onlinePatients: onlinePatients || 0,
                offlinePatients: offlinePatients || 0
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
        const tenantId = req.user?.tenantId || req.tenant?.id || req.query.tenantId

        // Admin check
        if (!req.admin && !req.user?.isAdmin && !req.user?.role?.includes('admin')) {
             if (!req.user && !req.tenant && !tenantId) {
                return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Unauthorized. No user found.' })
            }
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
        const tenantId = req.user?.tenantId || req.tenant?.id || req.body.tenantId

        // Admin check
        if (!req.admin && !req.user?.isAdmin && !req.user?.role?.includes('admin')) {
             if (!req.user && !req.tenant && !tenantId) {
                return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Unauthorized. No user found.' })
            }
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

// Delete Override (Admin only)
export const deleteOverride = async (req, res) => {
    try {
        const { doctorId, date, tenantId: queryTenantId } = req.query
        const tenantId = req.user?.tenantId || req.tenant?.id || queryTenantId

        // Admin check
        if (!req.admin && !req.user?.isAdmin && !req.user?.role?.includes('admin')) {
             if (!req.user && !req.tenant && !tenantId) {
                return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, success: false, message: 'Unauthorized. No user found.' })
            }
        }

        if (!tenantId) {
            return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Tenant ID is required.' })
        }

        if (!date) {
            return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: 'Date is required.' })
        }

        const deleted = await SlotOverride.destroy({
            where: {
                tenantId,
                doctorId: doctorId || null,
                date
            }
        })

        if (deleted) {
             return sendResponse(res, { message: 'Override deleted successfully', success: true })
        } else {
             return sendResponse(res, { statusCode: STATUS_CODES.NOT_FOUND, success: false, message: 'No override found to delete' })
        }

    } catch (error) {
        console.error('Delete Override Error:', error)
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: 'Failed to delete override' })
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
    updateDoctorSlots,
    getDoctorSlots,
    createOverride,
    deleteOverride,
    getAvailableSlots
}
