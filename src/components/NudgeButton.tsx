"use client"

import { Project } from "@/types";
import { BellRing } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface NudgeButtonProps {
    project: Project;
    variant?: "icon" | "full";
}

export default function NudgeButton({ project, variant = "icon" }: NudgeButtonProps) {
    const lastUpdated = new Date(project.last_updated_date);
    const daysSinceUpdate = differenceInDays(new Date(), lastUpdated);

    // We only nudge if it's been > 30 days, but the button can be visible/active regardless
    const isStale = daysSinceUpdate >= 30;

    const handleNudge = () => {
        const subject = encodeURIComponent(`QI Update Requested: ${project.title}`);

        const leadNames = project.lead_proponents.join(", ");
        const body = encodeURIComponent(
            `Hi ${leadNames || "Team"},\n\n` +
            `I'm checking in on the "${project.title}" project. Our records show it hasn't been updated in ${daysSinceUpdate} days (last update: ${format(lastUpdated, 'MMM d')}).\n\n` +
            `Could you please take a moment to log into the QI Tracker and update the "Updates and Barriers" section or add any new data points?\n\n` +
            `Tracker Link: ${window.location.origin}/QI_Tracker/\n\n` +
            `Thanks,\n` +
            `QI Chief`
        );

        // In a real institutional setting, we might have their emails in the DB.
        // For now, we'll open the mail client and let the Chief add the recipient,
        // or we could potentially guess it if there's a convention (e.g. name@adventhealth.com)
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    if (variant === "full") {
        return (
            <button
                onClick={handleNudge}
                className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-100 transition-all border border-amber-200"
            >
                <BellRing className="w-4 h-4" />
                Nudge Leads
            </button>
        );
    }

    return (
        <button
            onClick={handleNudge}
            title={`Nudge leads for ${project.title}`}
            className={`p-2 rounded-lg transition-all ${isStale
                    ? "text-amber-600 hover:bg-amber-50 bg-amber-50/50 border border-amber-100"
                    : "text-slate-400 hover:text-advent-blue hover:bg-slate-50"
                }`}
        >
            <BellRing className="w-4 h-4" />
        </button>
    );
}
