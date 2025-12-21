import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Section, MenuItem, BaseRoute } from './src/models/menu/menu.model.js';
import { BusinessType } from './src/models/business/business-type.model.js';

dotenv.config();

const createTestData = async () => {
    try {
        await mongoose.connect(process.env.DB_url);
        console.log('Connected to DB');

        // 1. Create Business Type
        const businessType = await BusinessType.create({
            name: 'TestBusiness_' + Date.now(),
            isActive: true
        });
        console.log('Created BusinessType:', businessType._id, businessType.name);

        // 2. Create Base Route
        await BaseRoute.create({
            businessType: businessType._id,
            baseRoute: '/test-biz'
        });

        // 3. Create Section
        const section = await Section.create({
            businessType: businessType._id,
            label: 'Test Section',
            allowedRoles: [] // Visible to all
        });
        console.log('Created Section:', section._id, section.label);

        // 4. Create Menu Items
        const item1 = await MenuItem.create({
            sectionRef: section._id,
            title: 'Public Item (No Role)',
            path: '/public',
            allowedRoles: null
        });
        console.log('Created Item:', item1.title);

        const item2 = await MenuItem.create({
            sectionRef: section._id,
            title: 'Admin Only Item',
            path: '/admin',
            allowedRoles: ['Admin']
        });
        console.log('Created Item:', item2.title);

        const item3 = await MenuItem.create({
            sectionRef: section._id,
            title: 'Doctor Only Item',
            path: '/doctor',
            allowedRoles: ['Doctor']
        });
        console.log('Created Item:', item3.title);

        console.log('\n--- Test Data Created Successfully ---');
        console.log(`Business Type ID: ${businessType._id}`);
        console.log('You can now use this ID to query the menu API.');

    } catch (error) {
        console.error('Error creating test data:', error);
    } finally {
        await mongoose.disconnect();
    }
};

createTestData();
