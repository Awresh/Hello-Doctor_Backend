import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const TenantUser = sequelize.define('TenantUser', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Role of the user e.g. doctor, receptionist'
    },
    about: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    experience: {
        type: DataTypes.STRING,
        allowNull: true
    },
    speciality: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tenants',
            key: 'id'
        }
    },
    doctorId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Can be null if we want clinic-wide overrides later, but primarily for doctors
        field: 'doctor_id',
        references: {
            model: 'tenant_users',
            key: 'id'
        }
    }
}, {
    tableName: 'tenant_users',
    timestamps: true
});
