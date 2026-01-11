import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const Plan = sequelize.define('Plan', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    monthlyPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    yearlyPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    maxDoctors: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '0 for unlimited'
    },
    maxUsers: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    maxStores: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    maxRoles: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    maxStaff: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    features: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'INR'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'erp_plans',
    timestamps: true
});
