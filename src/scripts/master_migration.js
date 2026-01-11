import 'dotenv/config';
import { sequelize } from '../models/index.js';

async function run() {
    try {
        console.log('Connecting...');
        await sequelize.authenticate();
        console.log('Connected to:', sequelize.config.database);

        // 1. ADD TYPE COLUMNS
        console.log("\n--- Fixing Type Columns ---");

        // Ensure ENUM types exist
        try {
            await sequelize.query(`DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_categories_type') THEN
                    CREATE TYPE "enum_categories_type" AS ENUM('Product', 'Service');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_type') THEN
                    CREATE TYPE "enum_products_type" AS ENUM('Product', 'Service');
                END IF;
            END $$;`);
            console.log("Enums checked/created.");
        } catch (e) { console.log("Enum warning:", e.message); }

        // Add column to categories
        try {
            await sequelize.query(`ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "type" "enum_categories_type" DEFAULT 'Product';`);
            console.log("Column 'type' added to categories.");
        } catch (e) { console.log("Categories alter error:", e.message); }

        // Add column to products
        try {
            await sequelize.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "type" "enum_products_type" DEFAULT 'Product';`);
            console.log("Column 'type' added to products.");
        } catch (e) { console.log("Products alter error:", e.message); }


        // 2. FIX TENANT_USERS ROLE
        console.log("\n--- Fixing Tenant Users Roles ---");

        // Clean up data before conversion
        // Map 'doctor' -> 3, 'nurse' -> 2 (Staff)
        await sequelize.query(`UPDATE tenant_users SET role = '3' WHERE lower(role) = 'doctor';`);
        await sequelize.query(`UPDATE tenant_users SET role = '2' WHERE lower(role) = 'nurse';`);
        await sequelize.query(`UPDATE tenant_users SET role = '1' WHERE lower(role) = 'admin';`);
        await sequelize.query(`UPDATE tenant_users SET role = '2' WHERE lower(role) = 'staff' OR lower(role) = 'receptionist';`);

        // Final fallback for anything not numeric: set to 2 (Staff)
        await sequelize.query(`UPDATE tenant_users SET role = '2' WHERE role !~ '^[0-9]+$';`);
        console.log("Role data cleaned up.");

        // Alter column type
        try {
            // Drop existing constraint if it exists (it might be half-created or named differently)
            await sequelize.query(`ALTER TABLE tenant_users DROP CONSTRAINT IF EXISTS "tenant_users_role_fkey";`);

            // Alter column to integer
            await sequelize.query(`ALTER TABLE tenant_users ALTER COLUMN role TYPE integer USING role::integer;`);
            console.log("Column 'role' converted to integer.");
        } catch (e) {
            console.log("Role conversion error:", e.message);
        }

        // Add foreign key constraint
        try {
            await sequelize.query(`ALTER TABLE tenant_users 
                ADD CONSTRAINT "tenant_users_role_fkey" 
                FOREIGN KEY (role) REFERENCES roles(id) 
                ON DELETE SET NULL;`);
            console.log("Foreign key constraint added.");
        } catch (e) {
            console.log("FK constraint error:", e.message);
        }

        console.log("\nMigration completed successfully.");

    } catch (e) {
        console.error('Migration script failed:', e);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

run();
