import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const BusinessType = sequelize.define('BusinessType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  maxRoles: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Maximum number of roles allowed. 0 for unlimited.'
  },
  maxUsers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Maximum number of total users allowed. 0 for unlimited.'
  },
  maxStores: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Maximum number of stores allowed. 0 for unlimited.'
  },
  maxDoctors: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Maximum number of doctors allowed. 0 for unlimited.'
  },
  maxStaff: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Maximum number of staff allowed. 0 for unlimited.'
  }
}, {
  tableName: 'business_types',
  timestamps: true
});

