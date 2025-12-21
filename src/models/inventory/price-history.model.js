import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const PriceHistory = sequelize.define('PriceHistory', {
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
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  purchaseBillId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'purchase_bills',
      key: 'id'
    }
  },
  oldBuyPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  newBuyPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  oldSellingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  newSellingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  changeReason: {
    type: DataTypes.ENUM('purchase_bill_create', 'purchase_bill_update', 'manual_update'),
    defaultValue: 'purchase_bill_create'
  },
  changeDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  changedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tenants',
      key: 'id'
    }
  }
}, {
  tableName: 'price_histories',
  timestamps: true,
  indexes: [
    {
      fields: ['productId', 'changeDate']
    },
    {
      fields: ['tenantId']
    },
    {
      fields: ['purchaseBillId']
    }
  ]
});
