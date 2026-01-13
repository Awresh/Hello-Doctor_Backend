import { DataTypes } from 'sequelize';
import { sequelize } from '../index.js';

export const CallBillingHistory = sequelize.define('CallBillingHistory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'tenant_id',
        references: {
            model: 'tenants',
            key: 'id'
        }
    },
    callerId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Nullable because admins (Tenants) don't exist in tenant_users
        field: 'caller_id'
        // References removed to allow admin IDs (from tenants table) which are not in tenant_users
    },
    receiverId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Nullable because admins (Tenants) don't exist in tenant_users
        field: 'receiver_id'
        // References removed to allow admin IDs (from tenants table) which are not in tenant_users
    },
    callType: {
        type: DataTypes.ENUM('audio', 'video'),
        allowNull: false,
        defaultValue: 'audio',
        field: 'call_type'
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Duration in seconds'
    },
    tokensDeducted: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        field: 'tokens_deducted'
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'call_billing_history',
    timestamps: true,
    underscored: true
});
