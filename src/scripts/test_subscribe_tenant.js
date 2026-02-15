import 'dotenv/config';
import { Tenant, Plan, Subscription, setupAssociations, sequelize } from '../models/index.js';

async function run() {
    try {
        console.log('Connecting...');
        setupAssociations();
        await sequelize.authenticate();
        console.log('Connected.');

        const tenantId = 2; // Inventory tenant from earlier logs
        const planName = 'Silver';

        const tenant = await Tenant.findByPk(tenantId);
        if (!tenant) {
            console.error(`Tenant with ID ${tenantId} not found.`);
            return;
        }

        const plan = await Plan.findOne({ where: { name: planName } });
        if (!plan) {
            console.error(`Plan ${planName} not found.`);
            return;
        }

        console.log(`Subscribing tenant ${tenant.name} to ${plan.name} plan...`);

        const existing = await Subscription.findOne({ where: { tenantId } });
        if (existing) {
            console.log('Subscription already exists:', existing.id);
            process.exit();
        }

        const now = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(now.getMonth() + 1);

        console.log('Creating subscription...');
        const sub = await Subscription.create({
            tenantId,
            planId: plan.id,
            status: 'active',
            billingCycle: 'monthly',
            currentPeriodStart: now,
            currentPeriodEnd: nextMonth
        });

        console.log('Subscription created successfully:', sub.id);

    } catch (e) {
        console.error('Subscription linking failed:', e);
    } finally {
        process.exit();
    }
}

run();
