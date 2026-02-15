import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

const CallHistory = sequelize.define('call_history', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    callerId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    receiverId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'initiated'
    },
    type: {
        type: DataTypes.STRING,
        defaultValue: 'audio'
    },
    startTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    duration: {
        type: DataTypes.INTEGER, // in seconds
        defaultValue: 0
    }
}, {
    tableName: 'call_history',
    timestamps: true
});

export { CallHistory };
