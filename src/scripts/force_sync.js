import 'dotenv/config';
import { sequelize } from '../models/index.js';

async function run() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connection established.');

        console.log('Syncing database with alter: true...');
        await sequelize.sync({ alter: true });
        console.log('Database sync completed successfully.');

    } catch (e) {
        console.error('Sync failed:', e);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

run();
