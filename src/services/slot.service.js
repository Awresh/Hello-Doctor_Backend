import { SlotRepository } from "../repositories/slot.repository.js";
import { AppointmentRepository } from "../repositories/appointment.repository.js";
import { Op } from "sequelize";

export class SlotService {
    constructor() {
        this.slotRepository = new SlotRepository();
        this.appointmentRepository = new AppointmentRepository();
    }

    async getAvailableSlots(tenantId, doctorId, appointmentDate, transaction) {
        const dayName = new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long' });
        let availableSlots = [];
        let defaultMaxPatients = 1;
        let defaultOnlineLimit = 0;

        const override = await this.slotRepository.findOverride(tenantId, doctorId, appointmentDate, transaction);

        if (override) {
            availableSlots = override.slots;
        } else {
            const doctorConfig = await this.slotRepository.findDoctorConfig(tenantId, doctorId, transaction);

            if (doctorConfig) {
                defaultMaxPatients = doctorConfig.numberOfPerSlot || 1;
                defaultOnlineLimit = doctorConfig.onlinePatients || 0;
            }

            if (doctorConfig && !doctorConfig.useClinicSlots) {
                availableSlots = doctorConfig.customWeeklySlots[dayName] || [];
            } else {
                const clinicConfig = await this.slotRepository.findClinicConfig(tenantId, transaction);
                if (clinicConfig) {
                    availableSlots = clinicConfig.weeklySlots[dayName] || [];
                }
            }
        }

        return { availableSlots, defaultMaxPatients, defaultOnlineLimit };
    }

    async validateSlot(tenantId, doctorId, appointmentDate, appointmentSlot, type, isEmergency, transaction) {
        const { availableSlots, defaultMaxPatients, defaultOnlineLimit } = await this.getAvailableSlots(
            tenantId, doctorId, appointmentDate, transaction
        );

        const slotMatch = isEmergency ? { startTime: appointmentSlot, maxPatients: 999 } : availableSlots.find(s => {
            if (typeof s === 'string') return s === appointmentSlot;
            return s.startTime === appointmentSlot;
        });

        if (!slotMatch && !isEmergency) {
            throw { statusCode: 400, message: 'Invalid slot selected or doctor not available at this time.' };
        }

        const appointmentCount = await this.appointmentRepository.count({
            tenantId,
            doctorId,
            appointmentDate,
            appointmentSlot,
            status: { [Op.notIn]: ['cancelled'] }
        }, transaction);

        let maxPatients = defaultMaxPatients;
        if (typeof slotMatch !== 'string') {
            maxPatients = slotMatch.maxPatients || defaultMaxPatients;
        }

        if (appointmentCount >= maxPatients && !isEmergency) {
            throw { statusCode: 400, message: 'This slot is already fully booked.' };
        }

        if (type === 'online') {
            const onlineCount = await this.appointmentRepository.count({
                tenantId,
                doctorId,
                appointmentDate,
                appointmentSlot,
                status: { [Op.notIn]: ['cancelled'] },
                type: 'online'
            }, transaction);

            if (onlineCount >= defaultOnlineLimit) {
                throw { statusCode: 400, message: 'Online booking limit reached for this slot.' };
            }
        }

        return { defaultMaxPatients, defaultOnlineLimit };
    }

    async getAvailableSlotsWithCounts(tenantId, doctorId, date, type) {
        const [y, m, d] = date.split('-').map(Number);
        const localDate = new Date(y, m - 1, d);
        const dayName = localDate.toLocaleDateString('en-US', { weekday: 'long' });

        let configuredSlots = [];
        let defaultMaxPatients = 1;
        let defaultOnlineLimit = 0;

        const override = await this.slotRepository.findOverride(tenantId, doctorId, date);

        if (override) {
            configuredSlots = override.slots;
        } else {
            const doctorConfig = await this.slotRepository.findDoctorConfig(tenantId, doctorId);

            if (doctorConfig) {
                if (!doctorConfig.useClinicSlots) {
                    const slots = doctorConfig.customWeeklySlots[dayName]
                        || doctorConfig.customWeeklySlots[dayName.toLowerCase()]
                        || doctorConfig.customWeeklySlots[dayName.toUpperCase()]
                        || [];
                    configuredSlots = slots;
                    defaultMaxPatients = doctorConfig.numberOfPerSlot || 1;
                    defaultOnlineLimit = doctorConfig.onlinePatients || 0;
                } else {
                    const clinicConfig = await this.slotRepository.findClinicConfig(tenantId);
                    if (clinicConfig) {
                        const slots = clinicConfig.weeklySlots[dayName]
                            || clinicConfig.weeklySlots[dayName.toLowerCase()]
                            || clinicConfig.weeklySlots[dayName.toUpperCase()]
                            || [];
                        configuredSlots = slots;
                    }
                }
            } else {
                const clinicConfig = await this.slotRepository.findClinicConfig(tenantId);
                if (clinicConfig) {
                    const slots = clinicConfig.weeklySlots[dayName]
                        || clinicConfig.weeklySlots[dayName.toLowerCase()]
                        || clinicConfig.weeklySlots[dayName.toUpperCase()]
                        || [];
                    configuredSlots = slots;
                }
            }
        }

        const appointments = await this.appointmentRepository.findAll({
            tenantId,
            doctorId,
            appointmentDate: date,
            status: { [Op.notIn]: ['cancelled'] }
        }, []);

        const slotCounts = {};
        const onlineSlotCounts = {};

        appointments.forEach(app => {
            slotCounts[app.appointmentSlot] = (slotCounts[app.appointmentSlot] || 0) + 1;
            if (app.type === 'online') {
                onlineSlotCounts[app.appointmentSlot] = (onlineSlotCounts[app.appointmentSlot] || 0) + 1;
            }
        });

        const isOnlineRequest = type === 'online';
        const availableSlots = [];

        configuredSlots.forEach(slot => {
            const startTime = typeof slot === 'string' ? slot : slot.startTime;
            const maxPatients = typeof slot === 'string' ? defaultMaxPatients : (slot.maxPatients || 1);

            let remaining = 0;
            const currentTotal = slotCounts[startTime] || 0;
            const currentOnline = onlineSlotCounts[startTime] || 0;

            if (isOnlineRequest) {
                const globalRemaining = maxPatients - currentTotal;
                const onlineRemaining = (defaultOnlineLimit || maxPatients) - currentOnline;
                remaining = Math.min(globalRemaining, onlineRemaining);
            } else {
                remaining = maxPatients - currentTotal;
            }

            availableSlots.push({
                startTime,
                maxPatients,
                available: Math.max(0, remaining)
            });
        });

        return availableSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
}
