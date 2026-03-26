import React, { useState, useEffect } from "react";
import { DEFAULT_CONFERENCES, fetchRegistry, getNextDeadline, Conference } from "@/constants/conferences";
import { formatDistanceToNow } from "date-fns";
import { Trophy, Calendar, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { getLiveConferenceDeadline } from "@/utils/ai";

interface ConferenceCountdownProps {
    targetConferenceId?: string | null;
}

export default function ConferenceCountdown({ targetConferenceId }: ConferenceCountdownProps) {
    const [registry, setRegistry] = useState<Conference[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isResearching, setIsResearching] = useState(false);
    const [aiUpdate, setAiUpdate] = useState<any>(null);

    useEffect(() => {
        async function load() {
            if (!targetConferenceId) return;
            const data = await fetchRegistry();
            setRegistry(data);
            setIsLoading(false);
        }
        load();
    }, [targetConferenceId]);

    if (!targetConferenceId) return null;

    if (isLoading) {
        return (
            <div className="bg-gradient-to-br from-indigo-500/50 to-purple-600/50 rounded-xl p-6 flex items-center justify-center min-h-[140px]">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
        );
    }

    const conferences = registry.length > 0 ? registry : DEFAULT_CONFERENCES;
    const conf = conferences.find(c => c.id === targetConferenceId);
    if (!conf) return null;

    const deadlineDate = getNextDeadline(conf);
    const isPast = false;

    const handleAIResearch = async () => {
        setIsResearching(true);
        try {
            const result = await getLiveConferenceDeadline(conf.name);
            const data = typeof result === 'string' ? JSON.parse(result) : result;
            setAiUpdate(data);
        } catch (error) {
            console.error("AI Research failed:", error);
        } finally {
            setIsResearching(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy size={80} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-indigo-200" />
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-100">Academic Deadline</span>
                </div>

                <h3 className="text-xl font-black mb-1">{conf.name} Match</h3>
                <p className="text-sm text-indigo-100 mb-4 line-clamp-1">{conf.fullName}</p>

                <div className="flex flex-col gap-1">
                    <div className="text-2xl font-black tabular-nums">
                        {isPast ? 'Deadline Passed' : formatDistanceToNow(deadlineDate, { addSuffix: true }).replace('in ', '')}
                    </div>
                    <div className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">
                        Until Abstract Submission
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                    <a
                        href={aiUpdate?.url || conf.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-lg text-xs font-bold border border-white/20 backdrop-blur-sm"
                    >
                        Official Portal <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                        onClick={handleAIResearch}
                        disabled={isResearching}
                        className="inline-flex items-center gap-2 bg-amber-400 text-advent-navy hover:bg-amber-300 transition-colors px-3 py-1.5 rounded-lg text-xs font-black border border-amber-200 shadow-sm disabled:opacity-50"
                    >
                        {isResearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {aiUpdate ? "Refresh AI Intel" : "Research with AI"}
                    </button>
                </div>

                {aiUpdate && (
                    <div className="mt-4 p-3 bg-white/10 rounded-xl border border-white/10 backdrop-blur-md animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">AI Intel: {aiUpdate.displayDate}</span>
                        </div>
                        <p className="text-[10px] text-indigo-100 font-bold leading-tight">{aiUpdate.notes}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
