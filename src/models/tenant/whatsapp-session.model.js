import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const WhatsAppSession = sequelize.define('WhatsAppSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'session_id'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    },
    field: 'tenant_id'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'not_found'
  },
  connectedNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'connected_number'
  },
  services: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: []
  }
}, {
  tableName: 'whatsapp_sessions',
  timestamps: true
});
