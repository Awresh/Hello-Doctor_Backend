import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const SlotOverride = sequelize.define('SlotOverride', {
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
    doctorId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Can be null if we want clinic-wide overrides later, but primarily for doctors
        field: 'doctor_id',
        references: {
            model: 'tenant_users',
            key: 'id'
        }
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    slots: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [], // Empty array means no slots (holiday/off)
        comment: 'Stores the specific slots for this date'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'slot_overrides',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['tenant_id', 'doctor_id', 'date']
        }
    ]
});
