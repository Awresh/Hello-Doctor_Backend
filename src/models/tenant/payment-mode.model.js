
import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const PaymentMode = sequelize.define('PaymentMode', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tenants',
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    taxPercentage: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    isEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'payment_modes',
    timestamps: true
});
