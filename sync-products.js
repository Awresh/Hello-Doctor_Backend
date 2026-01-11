import dotenv from 'dotenv';
dotenv.config();
import { Product } from './src/models/inventory/product.model.js';
import sequelize from './src/config/db.config.js';

const syncProductArray = async () => {
  try {
    console.log('Syncing Product model...');
    await Product.sync({ alter: true });
    console.log('Product model synced successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing Product model:', error);
    process.exit(1);
  }
};

syncProductArray();
