import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { MESSAGES } from "../../config/serverConfig.js";
import DashboardService from "../../services/dashboard.service.js";

export const getDashboardStats = async (req, res) => {
  try {
    const tenant = req.tenant;
    const tenantId = tenant ? tenant.id : null;
    
    if (!tenantId) {
      return sendResponse(res, { 
        statusCode: STATUS_CODES.UNAUTHORIZED, 
        message: "Tenant not found" 
      });
    }

    const period = req.query.period;
    const data = await DashboardService.getDashboardStats(tenantId, period);

    return sendResponse(res, { 
      statusCode: STATUS_CODES.OK, 
      message: "Dashboard stats fetched", 
      data 
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return sendResponse(res, { 
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, 
      message: MESSAGES.INTERNAL_SERVER_ERROR, 
      data: error.message 
    });
  }
};
