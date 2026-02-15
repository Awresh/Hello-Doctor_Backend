import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const ClinicSlotConfig = sequelize.define('ClinicSlotConfig', {
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
    weeklySlots: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
            "Monday": [],
            "Tuesday": [],
            "Wednesday": [],
            "Thursday": [],
            "Friday": [],
            "Saturday": [],
            "Sunday": []
        },
        field: 'weekly_slots',
        comment: 'Stores the weekly slot configuration for the clinic'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'clinic_slot_configs',
    timestamps: true
});
