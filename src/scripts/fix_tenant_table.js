import 'dotenv/config';
import { sequelize } from '../models/index.js';

async function run() {
    try {
        console.log('Connecting...');
        await sequelize.authenticate();
        console.log('Connected.');

        console.log('Ensuring columns exist in tenants table...');

        const queries = [
            `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "profilePic" VARCHAR(255);`,
            `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(255);`,
            `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "customMaxRoles" INTEGER;`,
            `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "customMaxUsers" INTEGER;`,
            `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "customMaxStores" INTEGER;`,
            `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "customMaxDoctors" INTEGER;`,
            `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "customMaxStaff" INTEGER;`,
            `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "whatsappCredits" INTEGER DEFAULT 0;`
        ];

        for (const query of queries) {
            try {
                await sequelize.query(query);
                console.log(`Executed: ${query.split(' ')[5] || query}`);
            } catch (e) {
                console.log(`Error on query [${query}]:`, e.message);
            }
        }

        console.log('Fix complete.');

    } catch (e) {
        console.error('Fix script failed:', e);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

run();
