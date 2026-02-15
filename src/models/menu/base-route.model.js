import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const BaseRoute = sequelize.define('BaseRoute', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  businessTypeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'business_types',
      key: 'id'
    }
  },
  baseRoute: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'base_routes',
  timestamps: true
});