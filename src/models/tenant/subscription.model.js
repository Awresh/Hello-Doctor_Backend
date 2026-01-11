import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const Subscription = sequelize.define('Subscription', {
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
    planId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'erp_plans',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'active'
    },
    billingCycle: {
        type: DataTypes.STRING,
        defaultValue: 'monthly'
    },
    currentPeriodStart: {
        type: DataTypes.DATE,
        allowNull: true
    },
    currentPeriodEnd: {
        type: DataTypes.DATE,
        allowNull: true
    },
    cancelAtPeriodEnd: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'erp_subscriptions',
    timestamps: true
});
