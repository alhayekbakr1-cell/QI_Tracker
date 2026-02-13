"use client"

import { Project } from "@/types";
import { BellRing, Loader2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";

interface NudgeButtonProps {
    project: Project;
    variant?: "icon" | "full";
}

export default function NudgeButton({ project, variant = "icon" }: NudgeButtonProps) {
    const supabase = createClient();
    const [recipientEmail, setRecipientEmail] = useState<string>("");
    const [isLoadingEmail, setIsLoadingEmail] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

                const { data: directory, error } = await supabase
                    .from('directory')
                    .select('email')
                    .in('name', leadNames);

                if (error) {
                    console.error("Directory lookup error:", error);
                    setErrorMsg("System Error: Could not verify email.");
                } else if (directory && directory.length > 0) {
                    const emails = directory.map(d => d.email).join(",");
                    setRecipientEmail(emails);
                } else {
                    setErrorMsg(`No email found for: ${leadNames.join(", ")}`);
                }
            } catch (err) {
                console.error("Nudge init failed:", err);
            } finally {
                setIsLoadingEmail(false);
            }
        };

        fetchEmail();
    }, [project.lead_proponents, supabase]);

    const handleNudge = () => {
        // SYNCHRONOUS HANDLER (No await -> No blocking)

        if (isLoadingEmail) return;

        if (!recipientEmail) {
            const warning = errorMsg || "No email address found for this project lead.";
            const proceed = window.confirm(`Warning: ${warning}\n\nThe email will open with a BLANK 'To' field.\n\nDo you want to proceed anyway?`);
            if (!proceed) return;
        }

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

        // Instant navigation
        window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
    };

    if (variant === "full") {
        return (
            <button
                onClick={handleNudge}
                disabled={isLoadingEmail}
                title={errorMsg || "Send Nudge Email"}
                className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-100 transition-all border border-amber-200 disabled:opacity-50"
            >
                {isLoadingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
                Nudge Leads
            </button>
        );
    }

    return (
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
    );
}
