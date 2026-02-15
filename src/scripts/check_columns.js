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
            WHERE table_name = 'products';
        `);

        console.log("Columns in 'products' table:", results.map(r => r.column_name));

        const [catResults] = await sequelize.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'categories';
        `);
        console.log("Columns in 'categories' table:", catResults.map(r => r.column_name));

    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

run();
