"use client"

import { CONFERENCES, Conference } from "@/constants/conferences";
import { formatDistanceToNow, isAfter } from "date-fns";
import { Trophy, Calendar, ExternalLink } from "lucide-react";

interface ConferenceCountdownProps {
    targetConferenceId?: string | null;
}

export default function ConferenceCountdown({ targetConferenceId }: ConferenceCountdownProps) {
    if (!targetConferenceId) return null;

    const conf = CONFERENCES.find(c => c.id === targetConferenceId);
    if (!conf) return null;

    const deadlineDate = new Date(conf.deadline);
    const isPast = isAfter(new Date(), deadlineDate);

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

                <a
                    href={conf.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-lg text-xs font-bold border border-white/20 backdrop-blur-sm"
                >
                    Official Portal <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        </div>
    );
}
