import { WhatsAppSession } from "../models/index.js";
import { sendResponse } from "../utils/response.util.js";
import { STATUS_CODES } from "../config/statusCodes.js";

const getApiConfig = () => ({
    url: process.env.WHATSAPP_API_URL,
    key: process.env.WHATSAPP_API_KEY
});

// Static list of available services that can be assigned to a WhatsApp instance
const AVAILABLE_SERVICES = [
    { key: 'store',       label: 'Store',       icon: 'ti-shopping-cart',   color: '#3b82f6' },
    { key: 'appointment', label: 'Appointment', icon: 'ti-calendar',        color: '#8b5cf6' },
    { key: 'purchase',    label: 'Purchase',    icon: 'ti-receipt',         color: '#f59e0b' },
    { key: 'billing',     label: 'Billing',     icon: 'ti-file-invoice',    color: '#ef4444' },
    { key: 'general',     label: 'General',     icon: 'ti-message-circle',  color: '#10b981' },
];

export const listSessions = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const sessions = await WhatsAppSession.findAll({ where: { tenantId } });
        return sendResponse(res, { message: "Sessions fetched successfully", data: sessions });
    } catch (error) {
        console.error('List WhatsApp Sessions Error:', error);
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: error.message });
    }
};

export const createSession = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { sessionId, name } = req.body;

        if (!sessionId) {
            return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: "Session ID is required" });
        }

        const { url, key } = getApiConfig();
        const response = await fetch(`${url}/whatsapp/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': key },
            body: JSON.stringify({ sessionId })
        });

        const data = await response.json();

        if (response.ok) {
            const [session, created] = await WhatsAppSession.findOrCreate({
                where: { sessionId },
                defaults: { tenantId, name, status: 'initializing', services: [] }
            });
            if (!created) {
                await session.update({ tenantId, name, status: 'initializing' });
            }
            return sendResponse(res, { message: "Session created successfully", data: session });
        } else {
            return sendResponse(res, { statusCode: response.status, success: false, message: data.message || "Failed to create session on API" });
        }
    } catch (error) {
        console.error('Create WhatsApp Session Error:', error);
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: error.message });
    }
};

export const getSessionStatus = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { url, key } = getApiConfig();
        const response = await fetch(`${url}/whatsapp/session/${sessionId}/status`, {
            headers: { 'x-api-key': key }
        });
        const data = await response.json();

        if (response.ok) {
            await WhatsAppSession.update(
                { status: data.status, connectedNumber: data.user?.id?.split(':')[0] },
                { where: { sessionId } }
            );
            return sendResponse(res, { message: "Status fetched successfully", data });
        } else {
            return sendResponse(res, { statusCode: response.status, success: false, message: data.message || "Failed to fetch status from API" });
        }
    } catch (error) {
        console.error('Get WhatsApp Status Error:', error);
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: error.message });
    }
};

export const deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { url, key } = getApiConfig();
        const response = await fetch(`${url}/whatsapp/session/${sessionId}`, {
            method: 'DELETE',
            headers: { 'x-api-key': key }
        });
        await response.json();
        await WhatsAppSession.destroy({ where: { sessionId } });
        return sendResponse(res, { message: "Session deleted successfully" });
    } catch (error) {
        console.error('Delete WhatsApp Session Error:', error);
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: error.message });
    }
};

// GET /whatsapp/services/list — returns the static list of available services
export const getAvailableServices = async (req, res) => {
    try {
        return sendResponse(res, { message: "Services fetched successfully", data: AVAILABLE_SERVICES });
    } catch (error) {
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: error.message });
    }
};

// PATCH /whatsapp/session/:sessionId/services — assign services to a session
export const updateSessionServices = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { sessionId } = req.params;
        const { services } = req.body;

        if (!Array.isArray(services)) {
            return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: "services must be an array" });
        }

        // Validate service keys
        const validKeys = AVAILABLE_SERVICES.map(s => s.key);
        const invalid = services.filter(s => !validKeys.includes(s));
        if (invalid.length > 0) {
            return sendResponse(res, { statusCode: STATUS_CODES.BAD_REQUEST, success: false, message: `Invalid service keys: ${invalid.join(', ')}` });
        }

        // Find the session
        const session = await WhatsAppSession.findOne({ where: { sessionId, tenantId } });
        if (!session) {
            return sendResponse(res, { statusCode: STATUS_CODES.NOT_FOUND, success: false, message: "Session not found" });
        }

        // Remove these services from any other sessions first (exclusive assignment)
        if (services.length > 0) {
            const otherSessions = await WhatsAppSession.findAll({
                where: { tenantId }
            });
            for (const other of otherSessions) {
                if (other.sessionId !== sessionId && other.services) {
                    const filtered = other.services.filter(s => !services.includes(s));
                    if (filtered.length !== other.services.length) {
                        await other.update({ services: filtered });
                    }
                }
            }
        }

        await session.update({ services });
        return sendResponse(res, { message: "Services updated successfully", data: session });
    } catch (error) {
        console.error('Update Session Services Error:', error);
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: error.message });
    }
};

// GET /whatsapp/service/:serviceKey — get the session assigned to a specific service
export const getSessionByService = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { serviceKey } = req.params;

        const { Op } = await import('sequelize');
        const session = await WhatsAppSession.findOne({
            where: {
                tenantId,
                services: { [Op.contains]: [serviceKey] }
            }
        });

        if (!session) {
            return sendResponse(res, { statusCode: STATUS_CODES.NOT_FOUND, success: false, message: `No WhatsApp session assigned to service: ${serviceKey}` });
        }

        return sendResponse(res, { message: "Session found", data: session });
    } catch (error) {
        console.error('Get Session By Service Error:', error);
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, success: false, message: error.message });
    }
};

export default { listSessions, createSession, getSessionStatus, deleteSession, getAvailableServices, updateSessionServices, getSessionByService };
