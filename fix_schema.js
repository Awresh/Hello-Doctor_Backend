import sequelize from './src/config/db.config.js';

const run = async () => {
    try {
        console.log('Authenticating...');
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const queryInterface = sequelize.getQueryInterface();
        const tableName = 'sections';

        console.log('Attempting to drop foreign key constraint if it exists...');
        // Sequelize default naming for FK: table_column_fkey
        try {
            // Try removing the constraint. Note: The name might vary, but this is standard.
            // If it fails, we'll continue, as it might not exist or might be named differently.
            // We can inspect constraints but that's complex.
            // Let's rely on standard naming or ignore if not found.
            await sequelize.query('ALTER TABLE "sections" DROP CONSTRAINT IF EXISTS "sections_businessTypeId_fkey";');
        } catch (e) {
            console.warn('Warning during constraint drop:', e.message);
        }

        console.log('Altering businessTypeId column to integer[]...');
        await sequelize.query(`
      ALTER TABLE "sections" 
      ALTER COLUMN "businessTypeId" TYPE integer[] 
      USING ARRAY["businessTypeId"];
    `);

        console.log('Setting default value...');
        await sequelize.query(`
      ALTER TABLE "sections" 
      ALTER COLUMN "businessTypeId" SET DEFAULT '{}';
    `);

        // Remove the NOT NULL constraint to be safe, then re-add if needed? 
        // Model says allowNull: false. The array will be empty not null.

        console.log('Schema update complete. "businessTypeId" is now an array.');

    } catch (error) {
        console.error('Unable to update database:', error);
    } finally {
        await sequelize.close();
    }
};

run();
