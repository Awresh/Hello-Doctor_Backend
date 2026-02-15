
import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const PaymentMethod = sequelize.define('PaymentMethod', {
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
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    label: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Custom label like My Business Card'
    },
    holderName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    last4: {
        type: DataTypes.STRING(4),
        allowNull: true
    },
    expiryMonth: {
        type: DataTypes.STRING(2),
        allowNull: true
    },
    expiryYear: {
        type: DataTypes.STRING(4),
        allowNull: true
    },
    brand: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'VISA, MASTERCARD, etc.'
    },
    upiId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    encryptedData: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Encrypted JSON of full details (PAN, CVV, etc.)'
    },
    iv: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Initialization Vector for partial encryption'
    },
    isPrimary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'erp_payment_methods',
    timestamps: true
});
