import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const TimeSlot = sequelize.define('TimeSlot', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    from: {
        type: DataTypes.TIME,
        allowNull: false
    },
    to: {
        type: DataTypes.TIME,
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'time_slots',
    timestamps: true
});
