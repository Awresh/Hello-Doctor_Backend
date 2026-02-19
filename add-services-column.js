import dotenv from 'dotenv';
dotenv.config();
import sequelize from './src/config/db.config.js';

const migrate = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ DB connected');

        await sequelize.query(`
            ALTER TABLE whatsapp_sessions
            ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}';
        `);
        console.log('✅ services column added to whatsapp_sessions');

        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
};

migrate();
