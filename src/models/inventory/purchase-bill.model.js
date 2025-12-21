import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const PurchaseBill = sequelize.define('PurchaseBill', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  billNumber: {
    type: DataTypes.STRING,
    unique: true
  },
  purchaseDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'suppliers',
      key: 'id'
    }
  },
  products: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  billImages: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('draft', 'completed', 'cancelled'),
    defaultValue: 'draft'
  },
  paymentStatus: {
    type: DataTypes.ENUM('Paid', 'Partial', 'Unpaid'),
    defaultValue: 'Unpaid'
  },
  paidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  payments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  storeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'stores',
      key: 'id'
    }
  }
}, {
  tableName: 'purchase_bills',
  timestamps: true,
  hooks: {
    beforeSave: async (bill) => {
      if (!bill.billNumber) {
        const lastBill = await PurchaseBill.findOne({
          where: { tenantId: bill.tenantId },
          order: [['createdAt', 'DESC']]
        });

        let nextNumber = 1;
        if (lastBill && lastBill.billNumber) {
          const match = lastBill.billNumber.match(/PB-(\d+)/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }

        bill.billNumber = `PB-${String(nextNumber).padStart(6, '0')}`;
      }
    }
  },
  indexes: [
    {
      fields: ['tenantId']
    },
    {
      fields: ['tenantId', 'createdAt']
    },
    {
      fields: ['tenantId', 'storeId', 'createdAt']
    },
    {
      fields: ['supplierId']
    },
    {
      fields: ['purchaseDate']
    },
    {
      fields: ['billNumber'],
      unique: true
    }
  ]
});
