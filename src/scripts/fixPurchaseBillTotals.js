
import sequelize from '../config/db.config.js';
import { PurchaseBill } from '../models/inventory/purchase-bill.model.js';
import '../models/index.js'; // Import associations

const fixTotals = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const bills = await PurchaseBill.findAll();
    console.log(`Found ${bills.length} bills.`);

    for (const bill of bills) {
      if (bill.products && Array.isArray(bill.products)) {
        const totalAmount = bill.products.reduce((sum, item) => {
          return sum + (Number(item.buyPrice || 0) * Number(item.quantity || 0));
        }, 0);

        // Also recalculate paidAmount if needed, but user issue is totalAmount
        
        console.log(`Bill ${bill.billNumber}: Old Total=${bill.totalAmount}, New Total=${totalAmount}`);
        
        bill.totalAmount = totalAmount;
        
        // Recalculate balance/payment status if necessary? 
        // For now, just fix totalAmount as requested.
        
        await bill.save();
      }
    }

    console.log('All bills updated.');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing totals:', error);
    process.exit(1);
  }
};

fixTotals();
