import 'dotenv/config';
import { sequelize } from '../models/index.js';

async function run() {
    try {
        console.log('Connecting...');
        await sequelize.authenticate();
        console.log('Connected to:', sequelize.config.database);

        // Check products table
        const [prodCols] = await sequelize.query(`
            SELECT column_name, data_type, udt_name 
            FROM information_schema.columns 
            WHERE table_name = 'products';
        `);
        console.log("\n--- Products Columns ---");
        prodCols.forEach(c => console.log(`${c.column_name}: ${c.data_type} (${c.udt_name})`));

        // Check categories table
        const [catCols] = await sequelize.query(`
            SELECT column_name, data_type, udt_name 
            FROM information_schema.columns 
            WHERE table_name = 'categories';
        `);
        console.log("\n--- Categories Columns ---");
        catCols.forEach(c => console.log(`${c.column_name}: ${c.data_type} (${c.udt_name})`));

        // Check tenant_users table
        const [userCols] = await sequelize.query(`
            SELECT column_name, data_type, udt_name 
            FROM information_schema.columns 
            WHERE table_name = 'tenant_users';
        `);
        console.log("\n--- Tenant Users Columns ---");
        userCols.forEach(c => console.log(`${c.column_name}: ${c.data_type} (${c.udt_name})`));

        // Check constraints
        const [constraints] = await sequelize.query(`
            SELECT conname, contype 
            FROM pg_constraint 
            WHERE conrelid = 'tenant_users'::regclass;
        `);
        console.log("\n--- Tenant Users Constraints ---");
        constraints.forEach(c => console.log(`${c.conname}: ${c.contype}`));

    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

run();
