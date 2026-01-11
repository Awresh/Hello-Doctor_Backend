
import 'dotenv/config';
import { sequelize, PaymentMode } from '../src/models/index.js';

const syncDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');
        console.log('Forcing sync for PaymentMode table...');
        
        await PaymentMode.sync({ alter: true });
        
        console.log('PaymentMode table synced successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Sync failed:', error);
        process.exit(1);
    }
};

syncDB();
