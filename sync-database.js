import 'dotenv/config';
import { sequelize, setupAssociations, BusinessType, Users, Store, Category, Brand, Unit, Supplier, Product, PriceHistory, PurchaseBill, SalesBill, Section, MenuItem, BaseRoute } from './src/models/index.js';

async function syncDatabase() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Setup associations
    setupAssociations();
    console.log('✅ Model associations configured.');
    
    // Sync all tables
    console.log('Creating all tables...');
    await sequelize.sync({ force: true });
    console.log('✅ All tables created successfully.');
    
    // Create default business type
    const defaultBusinessType = await BusinessType.create({
      name: 'Doctor Portal',
      isActive: true
    });
    console.log('✅ Default business type created:', defaultBusinessType.name);
    
    // Close connection
    await sequelize.close();
    console.log('✅ Database connection closed.');
    
  } catch (error) {
    console.error('❌ Database sync failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

syncDatabase();