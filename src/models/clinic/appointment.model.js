import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const Appointment = sequelize.define('Appointment', {
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
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    appointmentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'appointment_date'
    },
    appointmentTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'appointment_time'
    },
    status: {
        type: DataTypes.ENUM('scheduled', 'confirmed', 'cancelled', 'completed', 'no-show'),
        defaultValue: 'scheduled'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'appointments',
    timestamps: true
});
