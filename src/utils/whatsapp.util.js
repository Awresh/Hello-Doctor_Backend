import { WhatsAppSession } from '../models/index.js';
import { Op } from 'sequelize';

const getApiConfig = () => ({
    url: process.env.WHATSAPP_API_URL,
    key: process.env.WHATSAPP_API_KEY
});

/**
 * Look up the WhatsApp session assigned to a service key (e.g. 'purchase')
 * and send a text message to the given phone number.
 *
 * @param {string} serviceKey  - e.g. 'purchase', 'store', 'appointment'
 * @param {number} tenantId    - tenant to scope the lookup
 * @param {string} toNumber    - recipient phone number (local digits)
 * @param {string} message     - plain-text message body
 * @param {string} countryCode - (optional) dial code (e.g. '+91' or '91')
 * @returns {Promise<boolean>} - true if sent, false if skipped (no session / no number)
 */
export const sendWhatsAppForService = async (serviceKey, tenantId, toNumber, message, countryCode = '') => {
    try {
        if (!toNumber) {
            console.log(`[WhatsApp] No phone number provided for service '${serviceKey}', skipping.`);
            return false;
        }

        // Find the session assigned to this service
        const session = await WhatsAppSession.findOne({
            where: {
                tenantId,
                services: { [Op.contains]: [serviceKey] },
                status: 'connected'
            }
        });

        if (!session) {
            console.log(`[WhatsApp] No connected session found for service '${serviceKey}', skipping.`);
            return false;
        }

        const { url, key } = getApiConfig();

        // Normalise phone: combine CC + Number, strip non-digits (including +)
        const cleanCC = String(countryCode || '').replace(/\D/g, '');
        const cleanNum = String(toNumber).replace(/\D/g, '');
        const phone = cleanCC ? `${cleanCC}${cleanNum}` : cleanNum;

        const response = await fetch(`${url}/whatsapp/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': key
            },
            body: JSON.stringify({
                sessionId: session.sessionId,
                jid: `${phone}@s.whatsapp.net`,
                text: message
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`[WhatsApp] Message sent via session '${session.sessionId}' to ${phone}`);
            return true;
        } else {
            console.warn(`[WhatsApp] Send failed:`, data);
            return false;
        }
    } catch (err) {
        // Never throw — WhatsApp is a non-critical side-effect
        console.error('[WhatsApp] sendWhatsAppForService error:', err.message);
        return false;
    }
};
/**
 * Send a media file (e.g. PDF) via a WhatsApp session assigned to a service key.
 * 
 * @param {string} serviceKey - e.g. 'store'
 * @param {number} tenantId - tenant to scope the lookup
 * @param {string} toNumber - recipient phone number
 * @param {Buffer} fileBuffer - Buffer containing the file data
 * @param {string} fileName - Name of the file (e.g. 'Bill-123.pdf')
 * @param {string} mimetype - Mimetype of the file (e.g. 'application/pdf')
 * @param {string} caption - (optional) Caption for the media
 * @param {string} countryCode - (optional) Dial code
 * @returns {Promise<boolean>} - true if sent, false otherwise
 */
export const sendWhatsAppMediaForService = async (serviceKey, tenantId, toNumber, fileBuffer, fileName, mimetype, caption = '', countryCode = '') => {
    try {
        if (!toNumber || !fileBuffer) {
            console.log(`[WhatsApp] Missing number or file for service '${serviceKey}', skipping.`);
            return false;
        }

        // Find the session assigned to this service
        const session = await WhatsAppSession.findOne({
            where: {
                tenantId,
                services: { [Op.contains]: [serviceKey] },
                status: 'connected'
            }
        });

        if (!session) {
            console.log(`[WhatsApp] No connected session found for service '${serviceKey}', skipping.`);
            return false;
        }

        const { url, key } = getApiConfig();

        // Normalise phone: combine CC + Number, strip non-digits (including +)
        const cleanCC = String(countryCode || '').replace(/\D/g, '');
        const cleanNum = String(toNumber).replace(/\D/g, '');
        const phone = cleanCC ? `${cleanCC}${cleanNum}` : cleanNum;

        const formData = new FormData();
        formData.append('sessionId', session.sessionId);
        formData.append('jid', `${phone}@s.whatsapp.net`);
        formData.append('caption', caption);
        
        // Convert Buffer to Blob for FormData
        // Using global Blob (available in Node 18+)
        const blob = new Blob([fileBuffer], { type: mimetype });
        formData.append('file', blob, fileName);

        const response = await fetch(`${url}/whatsapp/send-media`, {
            method: 'POST',
            headers: {
                'x-api-key': key
                // Note: Don't set Content-Type, fetch sets it with boundary for FormData
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`[WhatsApp] Media sent via session '${session.sessionId}' to ${phone}`);
            return true;
        } else {
            console.warn(`[WhatsApp] Media send failed:`, data);
            return false;
        }
    } catch (err) {
        console.error('[WhatsApp] sendWhatsAppMediaForService error:', err.message);
        return false;
    }
};
