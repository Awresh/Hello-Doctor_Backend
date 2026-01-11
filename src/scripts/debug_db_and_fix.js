import 'dotenv/config';
import { sequelize } from '../models/index.js';

async function run() {
    try {
        console.log('Connecting...');
        await sequelize.authenticate();
        console.log('Connected.');
        console.log('Database Name:', sequelize.config.database);
        console.log('Host:', sequelize.config.host);

        // 1. Create Types
        try {
            await sequelize.query(`CREATE TYPE "enum_categories_type" AS ENUM('Product', 'Service');`);
            console.log("Created enum_categories_type");
        } catch (e) {
            console.log("Enum categories creation skipped (likely exists):", e.message);
        }

        try {
            await sequelize.query(`CREATE TYPE "enum_products_type" AS ENUM('Product', 'Service');`);
            console.log("Created enum_products_type");
        } catch (e) {
            console.log("Enum products creation skipped (likely exists):", e.message);
        }

        // 2. Alter Categories
        try {
            console.log("Attempting to add 'type' to categories...");
            await sequelize.query(`ALTER TABLE "categories" ADD COLUMN "type" "enum_categories_type" DEFAULT 'Product';`);
            console.log("SUCCESS: Added 'type' to categories");
        } catch (e) {
            console.log("Category alter error:", e.message);
        }

        // 3. Alter Products
        try {
            console.log("Attempting to add 'type' to products...");
            await sequelize.query(`ALTER TABLE "products" ADD COLUMN "type" "enum_products_type" DEFAULT 'Product';`);
            console.log("SUCCESS: Added 'type' to products");
        } catch (e) {
            console.log("Product alter error:", e.message);
        }

        // 4. Verify
        const [results] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'type';
        `);
        console.log("Verification - Products 'type' column:", results.length > 0 ? "FOUND" : "NOT FOUND");

    } catch (e) {
        console.error('Fatal Script Error:', e);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

run();
