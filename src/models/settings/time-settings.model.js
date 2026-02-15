import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const TimeSettings = sequelize.define('TimeSettings', {
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
  day: {
    type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('store', 'appointment'),
    allowNull: false
  },
  startTime: {
    type: DataTypes.STRING, // Format 'HH:mm'
    allowNull: true
  },
  endTime: {
    type: DataTypes.STRING, // Format 'HH:mm'
    allowNull: true
  },
  isClosed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'time_settings',
  timestamps: true
});
