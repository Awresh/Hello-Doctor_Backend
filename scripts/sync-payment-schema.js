import sequelize from '../src/config/db.config.js';
import { PaymentMethod } from '../src/models/index.js';

console.log('Syncing database...');

const sync = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection established.');
        
        // Sync PaymentMethod specifically to add new columns
        await PaymentMethod.sync({ alter: true });
        
        console.log('PaymentMethod table synced successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Unable to sync:', error);
        process.exit(1);
    }
};

sync();
