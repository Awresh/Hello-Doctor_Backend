
import sequelize from '../src/config/db.config.js';
import { PaymentMode } from '../src/models/index.js';

const updateSchema = async () => {
    try {
        console.log('Authenticating...');
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        console.log('Syncing PaymentMode model...');
        // Using alter true to add missing columns
        await PaymentMode.sync({ alter: true });
        
        console.log('PaymentMode table synced successfully.');
    } catch (error) {
        console.error('Unable to sync database:', error);
    } finally {
        await sequelize.close();
    }
};

updateSchema();
