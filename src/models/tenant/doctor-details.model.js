import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

export const DoctorDetails = sequelize.define('DoctorDetails', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
    clinicName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    clinicAddress: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    clinicPhone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    clinicLogo: {
        type: DataTypes.STRING, // URL or base64
        allowNull: true
    },
    startTime: {
        type: DataTypes.STRING, // e.g. "09:00"
        allowNull: true
    },
    endTime: {
        type: DataTypes.STRING, // e.g. "17:00"
        allowNull: true
    },
    availabilityDays: {
        type: DataTypes.STRING, // e.g. "Mon,Tue,Wed" or JSON
        allowNull: true,
        comment: "Comma separated days or JSON string"
    },
    specialization: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'doctor_details',
    timestamps: true
});
