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
  }
}, {
  tableName: 'business_types',
  timestamps: true
});

