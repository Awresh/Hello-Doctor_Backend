import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const DoctorService = sequelize.define('DoctorService', {
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
    tenantUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tenant_users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    serviceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'products',
            key: 'id'
        }
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
    }
}, {
    tableName: 'doctor_services',
    timestamps: true,
    indexes: [
        {
            fields: ['tenantUserId']
        },
        {
            fields: ['serviceId']
        }
    ]
});
