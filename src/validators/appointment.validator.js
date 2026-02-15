export class AppointmentValidator {
    validateCreateAppointment(data, tenantId) {
        if (!tenantId) {
            throw { statusCode: 401, message: 'Tenant ID not found.' };
        }

        const { doctorId, appointmentDate, date, appointmentSlot, slot, manualTime } = data;
        const finalDate = appointmentDate || date;
        const finalSlot = appointmentSlot || slot;

        if (!doctorId || !finalDate || (!finalSlot && !manualTime)) {
            throw { statusCode: 400, message: 'Doctor ID, Date, and Slot are required.' };
        }
    }

    validateGetAvailableSlots(query) {
        const { doctorId, date } = query;
        if (!doctorId || !date) {
            throw { statusCode: 400, message: 'Doctor ID and Date are required.' };
        }
    }
}
