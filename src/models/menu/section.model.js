import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const Section = sequelize.define('Section', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  businessTypeId: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: false,
    defaultValue: []
  },
  sectionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'section'
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  allowedRoles: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  tableName: 'sections',
  timestamps: true,
  indexes: [
    {
      fields: ['sectionId']
    },
    {
      fields: ['isActive']
    }
  ]
});
