import 'dotenv/config';
import { sequelize } from '../models/index.js';

async function run() {
    try {
        console.log('Connecting...');
        await sequelize.authenticate();
        console.log('Connected.');

        // 1. Create ENUM type if not exists (Postgres specific)
        try {
            await sequelize.query(`DO $$ BEGIN
                CREATE TYPE "enum_categories_type" AS ENUM('Product', 'Service');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;`);
            console.log("Enum type enum_categories_type checked/created");
        } catch (e) { console.log("Enum creation 1 warning:", e.message); }

        try {
            await sequelize.query(`DO $$ BEGIN
                CREATE TYPE "enum_products_type" AS ENUM('Product', 'Service');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;`);
            console.log("Enum type enum_products_type checked/created");
        } catch (e) { console.log("Enum creation 2 warning:", e.message); }


        // 2. Add Column to Categories
        try {
            await sequelize.query(`ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "type" "enum_categories_type" DEFAULT 'Product';`);
            console.log("Added 'type' to categories");
        } catch (e) {
            console.log("Category alter error:", e.message);
        }

        // 3. Add Column to Products
        try {
            await sequelize.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "type" "enum_products_type" DEFAULT 'Product';`);
            console.log("Added 'type' to products");
        } catch (e) {
            console.log("Product alter error:", e.message);
        }

    } catch (e) {
        console.error('Script failed:', e);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

run();
