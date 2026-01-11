
import 'dotenv/config';
import { sequelize, Notification } from '../src/models/index.js';

const syncDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');
        console.log('Forcing sync for Notification table...');
        
        await Notification.sync({ alter: true });
        
        console.log('Notification table synced successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Sync failed:', error);
        process.exit(1);
    }
};

syncDB();
