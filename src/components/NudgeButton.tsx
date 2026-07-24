"use client"

import { differenceInDays, format } from "date-fns";
import { BellRing, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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
    const isStale = daysSinceUpdate >= 30;

    useEffect(() => {
        const fetchEmail = async () => {
            try {
                const leadNames = project.lead_proponents;
                if (!leadNames || leadNames.length === 0) {
                    setErrorMsg("No project leads are assigned yet.");
                    setIsLoadingEmail(false);
                    return;
                }

                const { data: directory, error } = await supabase
                    .from('directory')
                    .select('email')
                    .in('name', leadNames);

                if (error) {
                    const fallbackEmails = leadNames.map((name) => name.replace(/ /g, ".") + "@AdventHealth.com").join(",");
                    setRecipientEmail(fallbackEmails);
                    setErrorMsg("Directory lookup failed; using generated institutional addresses.");
                } else if (directory && directory.length > 0) {
                    const emails = directory.map((d) => d.email).join(",");
                    setRecipientEmail(emails);
                } else {
                    const fallbackEmails = leadNames.map((name) => name.replace(/ /g, ".") + "@AdventHealth.com").join(",");
                    setRecipientEmail(fallbackEmails);
                    setErrorMsg("Using generated institutional addresses because no directory match was found.");
                }
            } catch (err) {
                console.error("Nudge init failed:", err);
                const fallbackEmails = project.lead_proponents.map((name) => name.replace(/ /g, ".") + "@AdventHealth.com").join(",");
                setRecipientEmail(fallbackEmails);
                setErrorMsg("Directory lookup failed; using generated institutional addresses.");
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
        `Thanks,\nAthena Office`
    );

    const handleNudge = () => {
        if (isLoadingEmail || !recipientEmail) {
            alert("No recipient email found. Please check the directory mapping first.");
            return;
        }

        setIsModalOpen(true);
    };

    return (
        <>
            {variant === "full" ? (
                <button
                    onClick={handleNudge}
                    disabled={isLoadingEmail}
                    title={errorMsg || "Prepare nudge email"}
                    className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-100 transition-all border border-amber-200 disabled:opacity-50"
                >
                    {isLoadingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
                    {isLoadingEmail ? "Preparing..." : "Draft Nudge"}
                </button>
            ) : (
                <button
                    onClick={handleNudge}
                    disabled={isLoadingEmail}
                    title={errorMsg ? `Notice: ${errorMsg}` : `Prepare nudge for ${project.title}`}
                    className={`p-2 rounded-lg transition-all ${isStale
                        ? "text-amber-600 hover:bg-amber-50 bg-amber-50/50 border border-amber-100"
                        : "text-slate-400 hover:text-advent-blue hover:bg-slate-50"
                        } disabled:opacity-50 src-nudge-btn`}
                >
                    {isLoadingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
                </button>
            )}

            <NudgeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                project={project}
                recipientEmail={recipientEmail}
                emailSubject={subject}
                emailBody={body}
            />
        </>
    );
}
