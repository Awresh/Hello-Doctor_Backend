import nodemailer from 'nodemailer';
import winston from 'winston';

/**
 * Utility to send emails.
 * Uses nodemailer with SMTP configuration from environment variables.
 */
export const sendEmail = async ({ to, subject, html }) => {
    try {
        // Create a transporter using the provided SMTP credentials
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.MAIL_ENCRYPTION === 'ssl', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false // Helps with some self-signed certificate issues or specific network configs
            }
        });

        const mailOptions = {
            from: `"${process.env.MAIL_FROM_NAME || 'MedKit'}" <${process.env.MAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: html,
        };

        const info = await transporter.sendMail(mailOptions);
        
        console.log(`[EMAIL] Message sent: %s`, info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[EMAIL] Error sending email:', error);
        return { success: false, error: error.message };
    }
};
