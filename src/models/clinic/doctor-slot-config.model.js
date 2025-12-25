import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const DoctorSlotConfig = sequelize.define('DoctorSlotConfig', {
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
    numberOfPerSlot: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'numberOfPerSlot'
    },
    onlinePatients: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'online_patients'
    },
    offlinePatients: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'offline_patients'
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
    useClinicSlots: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'use_clinic_slots'
    },
    customWeeklySlots: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
            "Monday": [],
            "Tuesday": [],
            "Wednesday": [],
            "Thursday": [],
            "Friday": [],
            "Saturday": [],
            "Sunday": []
        },
        field: 'custom_weekly_slots',
        comment: 'Stores custom weekly slot configuration for the doctor if useClinicSlots is false'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'doctor_slot_configs',
    timestamps: true
});
