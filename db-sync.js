import 'dotenv/config';
import { sequelize, setupAssociations } from './src/models/index.js';

async function syncDatabase() {
    try {
        console.log('Connecting to database...');
        setupAssociations();
        await sequelize.authenticate();
        console.log('Database connection established.');

        console.log('Synchronizing models...');
        // Sync Specifically for WhatsAppSession if you want, or just alter: true for everything
        await sequelize.sync({ alter: true });
        console.log('Database synchronization complete. whatsapp_sessions table should now exist.');
        
        process.exit(0);
    } catch (error) {
        console.error('Synchronization failed:', error);
        process.exit(1);
    }
}

syncDatabase();
