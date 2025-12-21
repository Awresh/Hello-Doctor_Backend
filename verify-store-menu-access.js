import mongoose from 'mongoose';
import { Users } from './src/models/user/user.model.js';
import { Store } from './src/models/inventory/store.model.js';
import { Section, MenuItem, BaseRoute } from './src/models/menu/menu.model.js';
import { BusinessType } from './src/models/business/business-type.model.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hello-doctor-dev';

async function verifyStoreMenuAccess() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Setup Data
        // Create Business Type
        const businessType = await BusinessType.create({ name: 'Pharmacy', isActive: true });

        // Create Base Route
        await BaseRoute.create({ businessType: businessType._id, baseRoute: '/pharmacy' });

        // Create User (Owner)
        const user = await Users.create({
            userName: 'Owner',
            email: `owner_${Date.now()}@test.com`,
            businessName: 'My Pharmacy',
            businessType: businessType._id,
            password: 'password123'
        });

        // Create Section
        const section = await Section.create({
            businessType: [businessType._id],
            label: 'Inventory',
            isActive: true
        });

        // Create Menu Items
        const allowedItem = await MenuItem.create({
            sectionRef: section._id,
            title: 'Allowed Item',
            path: '/allowed',
            isActive: true
        });

        const deniedItem = await MenuItem.create({
            sectionRef: section._id,
            title: 'Denied Item',
            path: '/denied',
            isActive: true
        });

        // Create Store with permission ONLY for allowedItem
        const storeEmail = `store_${Date.now()}@test.com`;
        const storePassword = 'storepassword';
        const store = await Store.create({
            name: 'Test Store',
            email: storeEmail,
            password: storePassword,
            userId: user._id,
            permissions: [allowedItem._id],
            isActive: true
        });

        console.log('Test Data Created');

        // 2. Simulate Login (Get Token)
        // We can't easily call the controller directly without mocking req/res, 
        // so we'll generate the token manually as the controller would.
        const token = jwt.sign(
            { storeId: store._id, userId: store.userId },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1h' }
        );
        console.log('Store Token Generated');

        // 3. Simulate Menu Fetch (Mocking Controller Logic)
        // We will call the static method directly, mimicking what the controller does
        // The controller logic we added:
        // if (req.store) { allowedMenuItemIds = req.store.permissions.map(...) }
        // const menuData = await MenuItem.getMenuByBusinessType(businessType, userRole, allowedMenuItemIds);

        const allowedMenuItemIds = store.permissions.map(id => id.toString());
        const menuData = await MenuItem.getMenuByBusinessType(
            businessType._id,
            businessType.name, // userRole defaults to businessType name for stores usually
            allowedMenuItemIds
        );

        // 4. Verification
        console.log('Menu Data Fetched');

        const sectionData = menuData.sections[section.sectionId];
        if (!sectionData) {
            throw new Error('Section not found in menu response');
        }

        const items = sectionData.items;
        const foundAllowed = items.find(i => i.id === allowedItem._id.toString());
        const foundDenied = items.find(i => i.id === deniedItem._id.toString());

        if (foundAllowed && !foundDenied) {
            console.log('SUCCESS: Allowed item found and Denied item NOT found.');
        } else {
            console.error('FAILURE: Permission filtering failed.');
            console.log('Allowed Found:', !!foundAllowed);
            console.log('Denied Found:', !!foundDenied);
        }

        // Cleanup
        await Store.deleteMany({ _id: store._id });
        await MenuItem.deleteMany({ _id: { $in: [allowedItem._id, deniedItem._id] } });
        await Section.deleteMany({ _id: section._id });
        await Users.deleteMany({ _id: user._id });
        await BaseRoute.deleteMany({ businessType: businessType._id });
        await BusinessType.deleteMany({ _id: businessType._id });

        console.log('Cleanup Done');

    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

verifyStoreMenuAccess();
