import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    mobile: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            is: /^[0-9]{10,15}$/i
        }
    },
    deviceToken: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'device_token'
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0,
            max: 150
        }
    },
    gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'users',
    timestamps: true
});


