"use client"

import { differenceInDays, format } from "date-fns";
import { BellRing, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import emailjs from '@emailjs/browser';
import { createClient } from "@/utils/supabase/client";
import { Project } from "@/types";
import NudgeModal from "./NudgeModal";

interface NudgeButtonProps {
    project: Project;
    variant?: "icon" | "full";
}

export default function NudgeButton({ project, variant = "icon" }: NudgeButtonProps) {
    const supabase = createClient();
    const [recipientEmail, setRecipientEmail] = useState<string>("");
    const [isLoadingEmail, setIsLoadingEmail] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const lastUpdated = new Date(project.last_updated_date);
    const daysSinceUpdate = differenceInDays(new Date(), lastUpdated);

    // We only nudge if it's been > 30 days, but the button can be visible/active regardless
    const isStale = daysSinceUpdate >= 30;

    // PRE-FETCH EMAIL ON MOUNT
    useEffect(() => {
        const fetchEmail = async () => {
            try {
                const leadNames = project.lead_proponents;
                if (!leadNames || leadNames.length === 0) {
                    setIsLoadingEmail(false);
                    return;
                }

                console.log("Nudge: Fetching emails for", leadNames);

                const { data: directory, error } = await supabase
                    .from('directory')
                    .select('email')
                    .in('name', leadNames);

                if (error) {
                    console.error("Nudge: Directory lookup error:", error);
                    // FALLBACK: Construct email manually if API fails (401/404)
                    // Format: Firstname.Lastname.MD@AdventHealth.com
                    const fallbackEmails = leadNames.map(name => {
                        return name.replace(/ /g, ".") + "@AdventHealth.com";
                    }).join(",");
                    console.warn("Nudge: Using fallback email:", fallbackEmails);
                    setRecipientEmail(fallbackEmails);
                    // Don't set errorMsg, just let it work with fallback
                } else if (directory && directory.length > 0) {
                    const emails = directory.map(d => d.email).join(",");
                    setRecipientEmail(emails);
                } else {
                    // No directory match, try fallback
                    const fallbackEmails = leadNames.map(name => {
                        return name.replace(/ /g, ".") + "@AdventHealth.com";
                    }).join(",");
                    setRecipientEmail(fallbackEmails);
                }
            } catch (err) {
                console.error("Nudge init failed:", err);
                const fallbackEmails = project.lead_proponents.map(name => {
                    return name.replace(/ /g, ".") + "@AdventHealth.com";
                }).join(",");
                setRecipientEmail(fallbackEmails);
            } finally {
                setIsLoadingEmail(false);
            }
        };

        fetchEmail();
    }, [project.lead_proponents, supabase]);

    const leadNames = project.lead_proponents;
    const subject = encodeURIComponent(`QI Update Requested: ${project.title}`);
    const body = encodeURIComponent(
        `Hi ${leadNames.join(", ") || "Team"},\n\n` +
        `I'm checking in on the "${project.title}" project. Our records show it hasn't been updated in ${daysSinceUpdate} days (last update: ${format(lastUpdated, 'MMM d')}).\n\n` +
        `Could you please take a moment to log into the QI Tracker and update the "Updates and Barriers" section or add any new data points?\n\n` +
        `Tracker Link: ${window.location.origin}/QI_Tracker/\n\n` +
        `Thanks,\n` +
        `QI Chief`
    );

    const handleNudge = async () => {
        if (isLoadingEmail || !recipientEmail) {
            alert("No recipient email found. Please check logs.");
            return;
        }

        const confirmSend = window.confirm(`Send formal nudge email to: ${recipientEmail}?`);
        if (!confirmSend) return;

        setIsLoadingEmail(true);

        try {
            // EmailJS Configuration
            const SERVICE_ID = 'service_cmylzni';
            const TEMPLATE_ID = 'template_zp4ihsn';
            const PUBLIC_KEY = 'FUMeORBrHGR5uaims';

            const templateParams = {
                lead_email: recipientEmail, // This variable directs the email to the Lead (set in EmailJS template)
                to_name: recipientEmail.split('@')[0].replace('.', ' '), // "nasar khan"
                project_title: project.title,
                days_inactive: daysSinceUpdate,
                last_update: format(lastUpdated, 'MMM d, yyyy'),
                message: `Please log in to the QI Tracker and update your "Updates and Barriers" section to keep the dashboard current.`,
                reply_to: 'noreply@qitracker.com' // Placeholder as we don't know the sender's email
            };

            await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);

            alert(`✅ Nudge sent to ${recipientEmail} successfully!`);
        } catch (err: any) {
            console.error("EmailJS Error:", err);
            alert(`❌ Failed to send: ${err.text || err.message}`);
        } finally {
            setIsLoadingEmail(false);
        }
    };

    return (
        <>
            {variant === "full" ? (
                <button
                    onClick={handleNudge}
                    disabled={isLoadingEmail}
                    title={errorMsg || "Send Nudge Email"}
                    className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-100 transition-all border border-amber-200 disabled:opacity-50"
                >
                    {isLoadingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
                    {isLoadingEmail ? "Sending..." : "Nudge Leads"}
                </button>
            ) : (
                <button
                    onClick={handleNudge}
                    disabled={isLoadingEmail}
                    title={errorMsg ? `Error: ${errorMsg}` : `Nudge leads for ${project.title}`}
                    className={`p-2 rounded-lg transition-all ${isStale
                        ? "text-amber-600 hover:bg-amber-50 bg-amber-50/50 border border-amber-100"
                        : "text-slate-400 hover:text-advent-blue hover:bg-slate-50"
                        } disabled:opacity-50 src-nudge-btn`}
                >
                    {isLoadingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
                </button>
            )}

            {/* Modal removed as we now send directly */}
        </>
    );
}
