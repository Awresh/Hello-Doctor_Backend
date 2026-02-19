import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const Prescription = sequelize.define('Prescription', {
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
    appointmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        field: 'appointment_id',
        references: {
            model: 'appointments',
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
    vitals: {
        type: DataTypes.JSON,
        allowNull: true
    },
    medications: {
        type: DataTypes.JSON,
        allowNull: true
    },
    notes: {
        type: DataTypes.JSON,
        allowNull: true
    },
    canvasData: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'canvas_data'
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'prescriptions',
    timestamps: true
});
