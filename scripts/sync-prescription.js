import { sequelize, Prescription } from '../src/models/index.js';

async function syncPrescription() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected.');

        console.log('Syncing Prescription model...');
        await Prescription.sync({ alter: true });
        console.log('Prescription model synced successfully.');

        process.exit(0);
    } catch (error) {
        console.error('Sync failed:', error);
        process.exit(1);
    }
}

syncPrescription();
