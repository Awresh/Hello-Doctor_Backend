import 'dotenv/config';
import { sequelize } from '../models/index.js';

async function run() {
    try {
        const [results] = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `);
        console.log(results.map(t => t.table_name));
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

run();
