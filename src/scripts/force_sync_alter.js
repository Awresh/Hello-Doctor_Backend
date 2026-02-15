import 'dotenv/config';
import { sequelize, setupAssociations } from '../models/index.js';

async function run() {
    try {
        console.log('Connecting...');
        setupAssociations();
        await sequelize.authenticate();
        console.log('Connected.');

        console.log('Syncing database with alter: true...');
        await sequelize.sync({ alter: true });
        console.log('Sync complete.');

    } catch (e) {
        console.error('Sync failed:', e);
    } finally {
        process.exit();
    }
}

run();
