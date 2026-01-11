
import { Section, MenuItem } from './src/models/menu/menu.model.js';
import sequelize from './src/config/db.config.js';

const updateMenu = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // Fix Sequence (Postgres specific)
    try {
       await sequelize.query("SELECT setval('menu_items_id_seq', (SELECT MAX(id) FROM menu_items));");
       console.log('Sequence updated.');
    } catch (seqError) {
       console.log('Sequence update skipped (might not be needed or failed):', seqError.message);
    }

    // Find Inventory Section
    const inventorySection = await Section.findOne({ where: { sectionId: 'inventory' } });
    
    if (!inventorySection) {
      console.error('Inventory Section not found!');
      return;
    }

    console.log('Found Inventory Section:', inventorySection.id);

    // Check if Sales History already exists
    const existingItem = await MenuItem.findOne({
      where: {
        sectionId: inventorySection.id,
        path: '/inventory/sales-history'
      }
    });

    if (existingItem) {
      console.log('Sales History menu item already exists.');
    } else {
      // Find max order to append
      const lastItem = await MenuItem.findOne({
        where: { sectionId: inventorySection.id },
        order: [['order', 'DESC']]
      });
      const newOrder = lastItem ? lastItem.order + 1 : 10;

      await MenuItem.create({
        sectionId: inventorySection.id,
        title: 'Sales History',
        icon: 'ti ti-history',
        path: '/inventory/sales-history',
        order: newOrder,
        isActive: true,
        level: 0
      });
      console.log('Sales History menu item created successfully.');
    }

  } catch (error) {
    console.error('Error updating menu:', error);
  } finally {
    process.exit();
  }
};

updateMenu();
