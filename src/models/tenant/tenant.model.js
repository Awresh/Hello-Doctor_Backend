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
  profilePic: {
    type: DataTypes.STRING,
    allowNull: true
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
  phone: {
    type: DataTypes.STRING,
    allowNull: true
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
  },
  // Custom Override Limits (null means use BusinessType default)
  customMaxRoles: {
    type: DataTypes.INTEGER,
    defaultValue: null
  },
  customMaxUsers: {
    type: DataTypes.INTEGER,
    defaultValue: null
  },
  customMaxStores: {
    type: DataTypes.INTEGER,
    defaultValue: null
  },
  customMaxDoctors: {
    type: DataTypes.INTEGER,
    defaultValue: null
  },
  customMaxStaff: {
    type: DataTypes.INTEGER,
    defaultValue: null
  },
  whatsappCredits: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of WhatsApp messages allowed'
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

Tenant.prototype.getLimits = async function () {
  // 1. Check for Custom Overrides first (highest priority)
  const limits = {
    maxUsers: this.customMaxUsers,
    maxDoctors: this.customMaxDoctors,
    maxStores: this.customMaxStores,
    maxStaff: this.customMaxStaff,
    whatsappCredits: this.whatsappCredits
  };

  // If all limits are set via custom overrides, return them
  if (limits.maxUsers !== null && limits.maxDoctors !== null && limits.maxStores !== null && limits.maxStaff !== null) {
    return limits;
  }

  // 2. Fetch Active Subscription if needed
  // We need to dynamically import models to avoid circular dependency issues at the top level if they exist,
  // or rely on Sequelize association mixins.
  // Assuming 'Subscription' and 'Plan' are associated.
  // Safest is to rely on lazy loading if not already eager loaded.
  
  let plan = null;
  if (!this.Subscription && this.getSubscription) {
    try {
      const subscription = await this.getSubscription({ include: 'Plan' });
      if (subscription && subscription.status === 'active') {
        plan = subscription.Plan;
      }
    } catch (e) {
      console.warn("Could not fetch subscription for limits:", e);
    }
  } else if (this.Subscription && this.Subscription.Plan) {
      // If already eagerly loaded
       if (this.Subscription.status === 'active') {
        plan = this.Subscription.Plan;
       }
  }

  // 3. Fallback to Plan Limits or Defaults
  // Default values if no plan and no custom limit
  const defaults = {
    maxUsers: 1,
    maxDoctors: 0,
    maxStores: 1,
    maxStaff: 1
  };

  return {
    maxUsers: limits.maxUsers !== null ? limits.maxUsers : (plan ? plan.maxUsers : defaults.maxUsers),
    maxDoctors: limits.maxDoctors !== null ? limits.maxDoctors : (plan ? plan.maxDoctors : defaults.maxDoctors),
    maxStores: limits.maxStores !== null ? limits.maxStores : (plan ? plan.maxStores : defaults.maxStores),
    maxStaff: limits.maxStaff !== null ? limits.maxStaff : (plan ? plan.maxStaff : defaults.maxStaff),
    whatsappCredits: limits.whatsappCredits // whatsappCredits is not usually in Plan, it's a top-up thing, but we can verify later
  };
};
