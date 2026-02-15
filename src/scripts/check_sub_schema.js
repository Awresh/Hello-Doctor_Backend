import 'dotenv/config';
import { sequelize } from '../models/index.js';

async function run() {
    try {
        console.log('Connecting...');
        await sequelize.authenticate();
        console.log('Connected.');

        const [results] = await sequelize.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'subscriptions';
        `);

        console.log("Columns in 'subscriptions' table:", results.map(r => r.column_name));
        console.log("Full results:", JSON.stringify(results, null, 2));

    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

run();
