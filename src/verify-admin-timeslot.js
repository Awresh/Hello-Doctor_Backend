import { Admin, TimeSlot, sequelize } from './models/index.js';
import jwt from 'jsonwebtoken';

async function verifyAdminTimeSlot() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Sync models
        await TimeSlot.sync({ alter: true });
        console.log('TimeSlot table synced.');

        // 1. Get Admin (created previously)
        const admin = await Admin.findOne({ where: { email: 'admin@hellodoctor.com' } });
        if (!admin) {
            console.error('Admin not found. Please run create-admin-temp.js first.');
            return;
        }
        console.log('Admin found:', admin.email);

        // 2. Create TimeSlot (Directly via model to verify schema, simulating controller action)
        // Note: In a real integration test we would hit the API, but here we verify the model and logic.
        // We can simulate the controller logic by ensuring we don't need tenantId.

        const timeSlot = await TimeSlot.create({
            from: '09:00',
            to: '10:00'
            // No tenantId
        });
        console.log('TimeSlot created without tenantId:', timeSlot.toJSON());

        // 3. Update TimeSlot
        timeSlot.to = '11:00';
        await timeSlot.save();
        console.log('TimeSlot updated:', timeSlot.toJSON());

        // 4. Fetch TimeSlots (Admin view - all active)
        const timeSlots = await TimeSlot.findAll({ where: { isActive: true } });
        console.log('Fetched TimeSlots count:', timeSlots.length);

        // 5. Delete TimeSlot
        await timeSlot.destroy();
        console.log('TimeSlot deleted.');

    } catch (error) {
        console.error('Verification Error:', error);
    } finally {
        await sequelize.close();
    }
}

verifyAdminTimeSlot();
