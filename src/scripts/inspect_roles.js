import 'dotenv/config';
import { sequelize } from '../models/index.js';

async function run() {
    try {
        console.log('Connecting...');
        await sequelize.authenticate();
        console.log('Connected.');

        // Inspect roles table
        const [roles] = await sequelize.query('SELECT id, name, "roleType" FROM roles LIMIT 10;');
        console.log("\n--- Roles Table ---");
        console.table(roles);

        // Inspect tenant_users table roles
        const [users] = await sequelize.query('SELECT id, name, role FROM tenant_users LIMIT 10;');
        console.log("\n--- Tenant Users (Role Column) ---");
        console.table(users);

        // Check if role column is string or integer
        const [roleColInfo] = await sequelize.query(`
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'tenant_users' AND column_name = 'role';
        `);
        console.log("\nCurrent 'role' column type:", roleColInfo[0]?.data_type);

    } catch (e) {
        console.error('Inspection failed:', e);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

run();
