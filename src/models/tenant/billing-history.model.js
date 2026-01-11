import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const BillingHistory = sequelize.define('BillingHistory', {
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
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'INR'
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'paid'
    },
    paymentMethodDetails: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Snapshot of payment method used'
    },
    transactionId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    invoiceUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    invoiceDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'erp_billing_history',
    timestamps: true
});
