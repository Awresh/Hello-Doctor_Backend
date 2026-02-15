import 'dotenv/config';
import { Tenant } from '../models/index.js';

async function run() {
    try {
        console.log('Connecting...');
        const tenant = await Tenant.findOne();

        if (tenant) {
            console.log("Successfully found tenant:", tenant.toJSON());
        } else {
            console.log("No tenant found.");
        }

    } catch (e) {
        console.error('Model check failed:', e);
    } finally {
        process.exit();
    }
}

run();
