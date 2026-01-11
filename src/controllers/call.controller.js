import { CallHistory, TenantUser } from '../models/index.js';
import { Op } from 'sequelize';

export const getCallHistory = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming user is authenticated and id is in req.user
        
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
                    attributes: ['id', 'email'], 
                    // Add other attributes if needed, or include DoctorDetails
                },
                { 
                    model: TenantUser, 
                    as: 'receiver',
                    attributes: ['id', 'email']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: 50 // Limit to last 50 calls
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
