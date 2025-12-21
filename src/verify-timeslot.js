import { TimeSlot, Tenant, sequelize } from './models/index.js';

async function verifyTimeSlot() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Sync the TimeSlot model
        await TimeSlot.sync({ alter: true });
        console.log('TimeSlot table synced.');

        // Find or create a dummy tenant for testing
        let tenant = await Tenant.findOne();
        if (!tenant) {
            console.log('No tenant found, skipping verification requiring tenant.');
            return;
        }
        console.log('Using tenant ID:', tenant.id);

        // Create a time slot
        const timeSlot = await TimeSlot.create({
            from: '09:00',
            to: '10:00',
            tenantId: tenant.id
        });
        console.log('TimeSlot created:', timeSlot.toJSON());

        // Fetch time slots
        const timeSlots = await TimeSlot.findAll({ where: { tenantId: tenant.id } });
        console.log('Fetched TimeSlots count:', timeSlots.length);

        // Delete the time slot
        await timeSlot.destroy();
        console.log('TimeSlot deleted.');

    } catch (error) {
        console.error('Verification Error:', error);
    } finally {
        await sequelize.close();
    }
}

verifyTimeSlot();
