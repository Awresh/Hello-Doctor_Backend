import 'dotenv/config';
import { sequelize, setupAssociations, WhatsAppSession } from './src/models/index.js';

async function targetedSync() {
    try {
        console.log('Connecting to database...');
        setupAssociations();
        await sequelize.authenticate();
        console.log('Database connection established.');

        console.log('Synchronizing WhatsAppSession model specifically...');
        // This will only create the whatsapp_sessions table if it doesn't exist
        await WhatsAppSession.sync({ alter: true });
        console.log('Table whatsapp_sessions should now exist.');
        
        process.exit(0);
    } catch (error) {
        console.error('Targeted synchronization failed:', error);
        process.exit(1);
    }
}

targetedSync();
