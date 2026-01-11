import 'dotenv/config';
import { sequelize } from '../models/index.js';

async function run() {
    try {
        console.log('Connecting...');
        await sequelize.authenticate();
        console.log('Connected.');

        try {
            const [q1] = await sequelize.query(`SELECT "profilePic" FROM tenants LIMIT 1`);
            console.log("Found with quotes profilePic");
        } catch (e) {
            console.log("Failed with quotes profilePic:", e.message);
        }

        try {
            const [q2] = await sequelize.query(`SELECT profilePic FROM tenants LIMIT 1`);
            console.log("Found without quotes profilePic");
        } catch (e) {
            console.log("Failed without quotes profilePic:", e.message);
        }

        try {
            const [q3] = await sequelize.query(`SELECT "profilepic" FROM tenants LIMIT 1`);
            console.log("Found with quotes profilepic");
        } catch (e) {
            console.log("Failed with quotes profilepic:", e.message);
        }


    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

run();
