import emailjs from '@emailjs/browser';
import { createClient } from '@/utils/supabase/client';

// EmailJS Configuration from environment variables
const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '';
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '';
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '';

/**
 * Sends a notification email using EmailJS.
 * If configuration is missing, it logs to the console as a fallback.
 */
export async function sendEmailNotification(params: {
    to_email: string;
    to_name: string;
    subject: string;
    message: string;
    project_title: string;
    action_url?: string;
}) {
    // Basic validation
    if (!params.to_email) {
        console.warn('Notification skipped: No recipient email provided.');
        return;
    }

    const templateParams = {
        to_email: params.to_email,
        to_name: params.to_name,
        subject: params.subject,
        message: params.message,
        project_title: params.project_title,
        action_url: params.action_url || window.location.origin
    };

    console.log('🔔 [Internal Notification System]:', templateParams);

    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
        console.info('ℹ️ EmailJS not fully configured. Notification logged but not sent via email.');
        return { success: true, mode: 'log' };
    }

    try {
        const response = await emailjs.send(
            SERVICE_ID,
            TEMPLATE_ID,
            templateParams,
            PUBLIC_KEY
        );
        console.log('✅ Email sent successfully:', response.status, response.text);
        return { success: true, mode: 'email' };
    } catch (error) {
        console.error('❌ Failed to send email via EmailJS:', error);
        return { success: false, error };
    }
}

/**
 * Helper to fetch emails and names for a list of profile IDs.
 */
export async function getProfileDetails(ids: string[]) {
    const supabase = createClient();

    // Fetch from directory first as it definitely has the emails linked to IDs
    console.log('🔍 [Notifications] Looking up directory for IDs:', ids);
    const { data: directoryData, error: dirError } = await supabase
        .from('directory')
        .select('id, email, name')
        .in('id', ids);

    if (dirError) {
        console.error('❌ [Notifications] Error fetching directory details:', dirError);
    }
    console.log('📊 [Notifications] Directory data found:', directoryData);

    // Fetch from profiles for any that might not be in directory but have profiles
    const { data: profileData, error: profError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', ids);

    if (profError) {
        console.error('❌ [Notifications] Error fetching profile details:', profError);
    }
    console.log('👤 [Notifications] Profile data found:', profileData);

    // Combine results
    const results = ids.map(id => {
        const dir = directoryData?.find(d => d.id === id);
        const prof = profileData?.find(p => p.id === id);
        return {
            id,
            name: dir?.name || prof?.full_name || 'Participant',
            email: dir?.email || ''
        };
    }).filter(p => !!p.email);

    console.log('✅ [Notifications] Resolved recipients:', results);
    return results;
}
