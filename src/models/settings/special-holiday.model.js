import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const SpecialHoliday = sequelize.define('SpecialHoliday', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  storeId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isClosed: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  target: {
    type: DataTypes.ENUM('BOTH', 'STORE', 'APPOINTMENT'),
    defaultValue: 'BOTH',
    allowNull: false
  }
}, {
  tableName: 'special_holidays',
  timestamps: true
});
