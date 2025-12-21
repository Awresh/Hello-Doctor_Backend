
import sequelize from './src/config/db.config.js';

const fixSchema = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Add permissions column if it doesn't exist
        try {
            await sequelize.query(`
                ALTER TABLE "tenant_users" 
                ADD COLUMN IF NOT EXISTS "permissions" jsonb[] DEFAULT ARRAY[]::jsonb[];
            `);
            console.log('Successfully added permissions column');
        } catch (error) {
            console.error('Error adding permissions column:', error.message);
        }

        // Add email column if it doesn't exist
        try {
            await sequelize.query(`
                ALTER TABLE "tenant_users" 
                ADD COLUMN IF NOT EXISTS "email" VARCHAR(255) UNIQUE;
            `);
            console.log('Successfully added email column');
        } catch (error) {
            console.error('Error adding email column:', error.message);
        }

        // Add password column if it doesn't exist
        try {
            await sequelize.query(`
                ALTER TABLE "tenant_users" 
                ADD COLUMN IF NOT EXISTS "password" VARCHAR(255);
            `);
            console.log('Successfully added password column');
        } catch (error) {
            console.error('Error adding password column:', error.message);
        }

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
};

fixSchema();
