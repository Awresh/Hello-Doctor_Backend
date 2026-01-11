import 'dotenv/config';
import { Plan, setupAssociations, sequelize } from '../models/index.js';

async function run() {
    try {
        console.log('Connecting...');
        setupAssociations();
        await sequelize.authenticate();
        console.log('Connected.');

        const plans = [
            {
                name: 'Silver',
                description: 'Perfect for small clinics',
                monthlyPrice: 999,
                yearlyPrice: 9990,
                maxDoctors: 2,
                maxUsers: 5,
                maxStores: 1,
                maxStaff: 5,
                features: ['Basic Inventory', 'Online Appointments', '2 Doctors included']
            },
            {
                name: 'Gold',
                description: 'Great for growing practices',
                monthlyPrice: 1999,
                yearlyPrice: 19990,
                maxDoctors: 5,
                maxUsers: 15,
                maxStores: 3,
                maxStaff: 15,
                features: ['Advanced Analytics', 'Pharmacy Management', '5 Doctors included', 'Multi-store support']
            },
            {
                name: 'Platinum',
                description: 'The ultimate power for hospitals',
                monthlyPrice: 4999,
                yearlyPrice: 49990,
                maxDoctors: 0, // Unlimited
                maxUsers: 0,
                maxStores: 0,
                maxStaff: 0,
                features: ['Unlimited everything', 'Priority Support', 'Custom Branding', 'API Access']
            }
        ];

        console.log('Seeding plans...');
        for (const planData of plans) {
            await Plan.findOrCreate({
                where: { name: planData.name },
                defaults: planData
            });
            console.log(`Plan check/create done: ${planData.name}`);
        }
        console.log('Seeding complete.');

    } catch (e) {
        console.error('Seeding failed:', e);
    } finally {
        process.exit();
    }
}

run();
