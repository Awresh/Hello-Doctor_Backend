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
    doctorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'doctor_id',
        references: {
            model: 'tenant_users',
            key: 'id'
        }
    },
    appointmentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'appointment_date'
    },
    appointmentSlot: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'appointment_slot'
    },
    status: {
        type: DataTypes.ENUM('scheduled', 'confirmed', 'cancelled', 'completed', 'no-show', 'processing', 'ongoing', 'visited'),
        defaultValue: 'scheduled'
    },
    type: {
        type: DataTypes.ENUM('online', 'offline'),
        defaultValue: 'offline'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    },
    source: {
        type: DataTypes.ENUM('walkin', 'online', 'telecaller'),
        defaultValue: 'walkin'
    },
    startedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'started_at'
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'completed_at'
    },
    queueOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'queue_order'
    },
    isEmergency: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_emergency'
    }
}, {
    tableName: 'appointments',
    timestamps: true
});
