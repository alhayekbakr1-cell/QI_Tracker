import emailjs from '@emailjs/browser';

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

export const TEMPLATES = {
    NUDGE: process.env.NEXT_PUBLIC_EMAILJS_NUDGE_TEMPLATE_ID || '',
    MENTOR_ASSIGNED: process.env.NEXT_PUBLIC_EMAILJS_MENTOR_TEMPLATE_ID || '',
    PROTOCOL_APPROVED: process.env.NEXT_PUBLIC_EMAILJS_PROTOCOL_TEMPLATE_ID || ''
};

interface EmailParams {
    to_email: string;
    to_name: string;
    project_title: string;
    message: string;
    [key: string]: unknown;
}

/**
 * Sends an email using EmailJS.
 * Note: Currently configured to send a CC to the admin for testing/verification.
 */
export async function sendEmail(templateId: string, params: EmailParams) {
    try {
        if (!SERVICE_ID || !PUBLIC_KEY || !templateId) {
            console.warn("Email delivery skipped because EmailJS public configuration is missing.");
            return { success: false, error: "Email service is not configured." };
        }

        const templateParams = {
            ...params,
            lead_email: params.to_email,
            reply_to: 'noreply@qitracker.com'
        };

        await emailjs.send(SERVICE_ID, templateId, templateParams, PUBLIC_KEY);
        console.log(`Email sent successfully to ${params.to_email}`);
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("EmailJS Error:", error);
        return { success: false, error: message };
    }
}
