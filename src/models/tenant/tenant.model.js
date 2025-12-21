import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../../config/db.config.js';

export const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  businessTypeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'business_types',
      key: 'id'
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'tenants',
  timestamps: true,
  hooks: {
    beforeSave: async (tenant) => {
      if (tenant.changed('password')) {
        tenant.password = await bcrypt.hash(tenant.password, 12);
      }
    }
  },
  defaultScope: {
    attributes: { exclude: ['password'] }
  },
  scopes: {
    withPassword: {
      attributes: {}
    }
  }
});

Tenant.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
