import emailjs from '@emailjs/browser';

// EmailJS Configuration (Using existing keys from NudgeButton)
const SERVICE_ID = 'service_cmylzni';
const PUBLIC_KEY = 'FUMeORBrHGR5uaims';

// Template IDs
export const TEMPLATES = {
    NUDGE: 'template_zp4ihsn',
    // We can reuse the same template or add more if created in EmailJS dashboard
    MENTOR_ASSIGNED: 'template_zp4ihsn',
    PROTOCOL_APPROVED: 'template_zp4ihsn'
};

interface EmailParams {
    to_email: string;
    to_name: string;
    project_title: string;
    message: string;
    [key: string]: any;
}

/**
 * Sends an email using EmailJS.
 * Note: Currently configured to send a CC to the admin for testing/verification.
 */
export async function sendEmail(templateId: string, params: EmailParams) {
    try {
        const templateParams = {
            ...params,
            // Add any common fields expected by the template
            lead_email: params.to_email, // Map to what the template expects
            reply_to: 'noreply@qitracker.com'
        };

        // SAFE TEST MODE: Always CC the admin during initial rollout if desired, 
        // but let's follow the NudgeButton pattern of sending to lead_email.

        await emailjs.send(SERVICE_ID, templateId, templateParams, PUBLIC_KEY);
        console.log(`Email sent successfully to ${params.to_email}`);
        return { success: true };
    } catch (error: any) {
        console.error("EmailJS Error:", error);
        return { success: false, error: error.text || error.message };
    }
}
