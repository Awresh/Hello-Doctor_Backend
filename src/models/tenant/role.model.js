import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const Role = sequelize.define('Role', {
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
        type: DataTypes.STRING,
        allowNull: true
    },
    roleType: {
        type: DataTypes.ENUM('admin', 'staff', 'doctor'),
        allowNull: false,
        defaultValue: 'staff'
    },
    permissions: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tenants',
            key: 'id'
        }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'roles',
    timestamps: true
});
