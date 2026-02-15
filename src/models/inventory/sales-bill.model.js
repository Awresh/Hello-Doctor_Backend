import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const SalesBill = sequelize.define('SalesBill', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  billNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  storeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  customer: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  doctor: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  items: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  pricing: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  payments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  billingType: {
    type: DataTypes.ENUM('Intra-State', 'Inter-State'),
    defaultValue: 'Intra-State'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('Paid', 'Partial', 'Unpaid', 'Cancelled'),
    defaultValue: 'Paid'
  }
}, {
  tableName: 'sales_bills',
  timestamps: true
});
