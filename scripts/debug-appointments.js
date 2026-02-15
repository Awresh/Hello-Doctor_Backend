import dotenv from 'dotenv';
dotenv.config();
import { Appointment } from '../src/models/index.js';
import { Op } from 'sequelize';

async function debugAppointments() {
    try {
        console.log("Debug: Counting Appointments...");
        
        const total = await Appointment.count();
        console.log(`Total Appointments (Raw): ${total}`);

        const byStatus = await Appointment.findAll({
            attributes: ['status', [Appointment.sequelize.fn('COUNT', Appointment.sequelize.col('id')), 'count']],
            group: ['status'],
            raw: true
        });
        console.log("By Status:", byStatus);

        // const softDeleted = await Appointment.count({ paranoid: false, where: { deletedAt: { [Op.ne]: null } } });
        // console.log(`Soft Deleted Appointments (if paranoid): ${softDeleted}`);
        
        const byTenant = await Appointment.findAll({
            attributes: ['tenantId', [Appointment.sequelize.fn('COUNT', Appointment.sequelize.col('id')), 'count']],
            group: ['tenantId'],
            raw: true
        });
        console.log("By Tenant:", byTenant);

    } catch (error) {
        console.error("Error:", error);
    }
}

debugAppointments();
