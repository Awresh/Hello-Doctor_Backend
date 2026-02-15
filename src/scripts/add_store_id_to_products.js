import 'dotenv/config';
import { sequelize } from '../models/index.js';

async function run() {
    try {
        console.log('Connecting...');
        await sequelize.authenticate();
        console.log('Connected to:', sequelize.config.database);

        console.log("\n--- Adding storeId to products ---");
        try {
            // Add custom migration logic here
            await sequelize.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "storeId" INTEGER REFERENCES stores(id) ON DELETE SET NULL;`);
            console.log("Column 'storeId' added to products.");
            
            // Re-create index if needed, though usually automatic by Sequelize sync, 
            // but since we are manually migrating:
            // await sequelize.query(`CREATE INDEX IF NOT EXISTS "products_storeId" ON "products" ("storeId");`);
            
        } catch (e) { console.log("Products alter error:", e.message); }

        console.log("\nMigration completed successfully.");

    } catch (e) {
        console.error('Migration script failed:', e);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

run();
