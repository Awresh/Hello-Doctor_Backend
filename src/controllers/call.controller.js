import { CallHistory, TenantUser, Tenant } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../logger/index.logger.js';

export const getCallHistory = async (req, res) => {
    try {
        const userId = req.user?.id || req.tenant?.id;
        if (!userId) {
            logger.warn("No user ID found in request for call history");
            return res.status(401).json({ success: false, message: "Unauthorized: No user ID identified" });
        }
        const history = await CallHistory.findAll({
            where: {
                [Op.or]: [
                    { callerId: userId },
                    { receiverId: userId }
                ]
            },
            include: [
                {
                    model: TenantUser,
                    as: 'caller',
                    attributes: ['id', 'email', 'name', 'profilePic'],
                },
                {
                    model: TenantUser,
                    as: 'receiver',
                    attributes: ['id', 'email', 'name', 'profilePic']
                },
                {
                    model: Tenant,
                    as: 'callerTenant',
                    attributes: ['id', 'email', 'name'],
                },
                {
                    model: Tenant,
                    as: 'receiverTenant',
                    attributes: ['id', 'email', 'name']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        // Enhance response with names? 
        // Ideally TenantUser should have name/businessName.
        // But for now email is basic. 
        // Let's assume frontend can map IDs to online user list names if available, 
        // or we fetch user details here.
        // TenantUser has associations to DoctorDetails? 
        // Let's keep it simple for now, frontend has onlineUsers list which might help mapping, 
        // but for offline users we might need name.

        res.status(200).json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error("Error fetching call history:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch call history"
        });
    }
};
