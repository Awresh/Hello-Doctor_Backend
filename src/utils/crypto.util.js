import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // Must be 32 chars
const IV_LENGTH = 16; // For AES, this is always 16

export const encrypt = (text) => {
    try {
        if (!text) return null;
        if (typeof text !== 'string') text = JSON.stringify(text);

        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        return {
            iv: iv.toString('hex'),
            errorCode: null,
            content: encrypted.toString('hex')
        };
    } catch (error) {
        console.error("Encryption Error:", error);
        return { errorCode: 'ENCRYPTION_FAILED', content: null, iv: null };
    }
};

export const decrypt = (encryptedText, ivHex) => {
    try {
        if (!encryptedText || !ivHex) return null;
        
        const iv = Buffer.from(ivHex, 'hex');
        const encryptedTextBuffer = Buffer.from(encryptedText, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        
        let decrypted = decipher.update(encryptedTextBuffer);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return decrypted.toString();
    } catch (error) {
        console.error("Decryption Error:", error);
        return null;
    }
};
