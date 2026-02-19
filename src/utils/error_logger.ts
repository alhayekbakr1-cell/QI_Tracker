import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ErrorReport {
    message: string;
    stack?: string;
    componentName?: string;
    url?: string;
    userId?: string;
}

export const logError = async (report: ErrorReport) => {
    // Only log in production to avoid cluttering DB during dev
    if (process.env.NODE_ENV !== 'production') {
        console.error('System Error Captured (Not logged in dev):', report);
        return;
    }

    try {
        const { error } = await supabase.from('system_errors').insert({
            error_message: report.message,
            error_stack: report.stack,
            component_name: report.componentName,
            user_id: report.userId,
            url: report.url || (typeof window !== 'undefined' ? window.location.href : ''),
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server-side'
        });

        if (error) console.error('Failed to log error to Supabase:', error);
    } catch (e) {
        console.error('Critical Error in Logger:', e);
    }
};

/**
 * Global Error Handler Registration
 */
if (typeof window !== 'undefined') {
    window.onerror = (message, source, lineno, colno, error) => {
        logError({
            message: message.toString(),
            stack: error?.stack,
            url: source
        });
    };

    window.onunhandledrejection = (event) => {
        logError({
            message: `Unhandled Rejection: ${event.reason?.message || event.reason}`,
            stack: event.reason?.stack
        });
    };
}
