import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MenuItem } from './src/models/menu/menu.model.js';
import { BusinessType } from './src/models/business/business-type.model.js';

dotenv.config();

const getMenuJson = async () => {
    try {
        await mongoose.connect(process.env.DB_url);

        const businessTypeId = '69355f73c4fbe6d2ba500d38'; // ID from previous step

        console.log('--- JSON Output (No Role / Admin View) ---');
        const menu = await MenuItem.getMenuByBusinessType(businessTypeId, null);
        console.log(JSON.stringify(menu, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

getMenuJson();
