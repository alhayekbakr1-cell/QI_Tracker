"use client"

import { Project } from "@/types";
import { BellRing, Loader2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";

interface NudgeButtonProps {
    project: Project;
    variant?: "icon" | "full";
}

export default function NudgeButton({ project, variant = "icon" }: NudgeButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const supabase = createClient();

    const lastUpdated = new Date(project.last_updated_date);
    const daysSinceUpdate = differenceInDays(new Date(), lastUpdated);

    // We only nudge if it's been > 30 days, but the button can be visible/active regardless
    const isStale = daysSinceUpdate >= 30;

    const handleNudge = async () => {
        setIsGenerating(true);
        try {
            const subject = encodeURIComponent(`QI Update Requested: ${project.title}`);
            const leadNames = project.lead_proponents;

            // Look up emails for leads in the directory
            let recipients = "";
            if (leadNames.length > 0) {
                const { data: directory } = await supabase
                    .from('directory')
                    .select('email')
                    .in('name', leadNames);

                if (directory && directory.length > 0) {
                    recipients = directory.map(d => d.email).join(",");
                }
            }

            const body = encodeURIComponent(
                `Hi ${leadNames.join(", ") || "Team"},\n\n` +
                `I'm checking in on the "${project.title}" project. Our records show it hasn't been updated in ${daysSinceUpdate} days (last update: ${format(lastUpdated, 'MMM d')}).\n\n` +
                `Could you please take a moment to log into the QI Tracker and update the "Updates and Barriers" section or add any new data points?\n\n` +
                `Tracker Link: ${window.location.origin}/QI_Tracker/\n\n` +
                `Thanks,\n` +
                `QI Chief`
            );

            window.location.href = `mailto:${recipients}?subject=${subject}&body=${body}`;
        } catch (error) {
            console.error("Nudge generation failed:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    if (variant === "full") {
        return (
            <button
                onClick={handleNudge}
                disabled={isGenerating}
                className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-100 transition-all border border-amber-200 disabled:opacity-50"
            >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
                Nudge Leads
            </button>
        );
    }

    return (
        <button
            onClick={handleNudge}
            disabled={isGenerating}
            title={`Nudge leads for ${project.title}`}
            className={`p-2 rounded-lg transition-all ${isStale
                ? "text-amber-600 hover:bg-amber-50 bg-amber-50/50 border border-amber-100"
                : "text-slate-400 hover:text-advent-blue hover:bg-slate-50"
                } disabled:opacity-50`}
        >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
        </button>
    );
}
