import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.config.js';

const CallHistory = sequelize.define('call_history', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    callerId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    receiverId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('initiated', 'ongoing', 'completed', 'missed', 'rejected'),
        defaultValue: 'initiated'
    },
    type: {
        type: DataTypes.ENUM('audio', 'video'),
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
