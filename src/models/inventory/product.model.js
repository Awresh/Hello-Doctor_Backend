import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const Product = sequelize.define('Product', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: true
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  brandId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'brands',
      key: 'id'
    }
  },
  unitId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'units',
      key: 'id'
    }
  },
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'suppliers',
      key: 'id'
    }
  },
  buyPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  sellingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Archived'),
    defaultValue: 'Active'
  },
  stockStatus: {
    type: DataTypes.ENUM('In Stock', 'Out of Stock', 'Low Stock'),
    defaultValue: 'In Stock'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  minStock: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  globalStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  storeAllocations: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  tableName: 'products',
  timestamps: true,
  indexes: [
    {
      fields: ['tenantId']
    },
    {
      fields: ['tenantId', 'createdAt']
    },
    {
      fields: ['categoryId']
    },
    {
      fields: ['brandId']
    },
    {
      fields: ['unitId']
    },
    {
      fields: ['supplierId']
    },
    {
      fields: ['name']
    }
  ]
});
