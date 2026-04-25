"use client"

import { useState } from "react";
import { Sparkles, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { auditProjectQuality } from "@/utils/ai";
import { Project } from "@/types";

export default function QualityAudit({ project }: { project: Project }) {
    const [audit, setAudit] = useState<{ score: number, feedback: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAudit = async () => {
        setIsLoading(true);
        try {
            const result = await auditProjectQuality(project);
            // Result is expected to be like "Score: 85 | Feedback: ..." or similar.
            // Let's parse it if possible, else just show the text.
            const scoreMatch = result.match(/(\d+)%/) || result.match(/Score: (\d+)/);
            const score = scoreMatch ? parseInt(scoreMatch[1]) : 70;
            setAudit({ score, feedback: result });
        } catch (error: any) {
            console.error("Audit error:", error);
            setAudit({ score: 0, feedback: "Audit failed. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck className="w-24 h-24" />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Academic Quality Audit</h3>
                    {!audit && !isLoading && (
                        <button
                            onClick={handleAudit}
                            className="text-[10px] font-black uppercase tracking-widest bg-advent-blue/20 text-advent-blue px-3 py-1.5 rounded-lg hover:bg-advent-blue/30 transition-all border border-advent-blue/30"
                        >
                            Run Audit
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="py-4 flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-advent-blue" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Evaluating academic rigor...</span>
                    </div>
                ) : audit ? (
                    <div className="space-y-4 animate-in fade-in duration-500">
                        <div className="flex items-end gap-3">
                            <span className={`text-4xl font-black ${audit.score > 80 ? 'text-emerald-400' : audit.score > 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                {audit.score}%
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Completeness Score</span>
                        </div>
                        <p className="text-xs font-medium text-slate-300 leading-relaxed italic">
                            "{audit.feedback}"
                        </p>
                    </div>
                ) : (
                    <p className="text-xs font-medium text-slate-400 italic">
                        The AI will audit your project for SMART aim compliance, metric alignment, and update frequency.
                    </p>
                )}
            </div>
        </div>
    );
}
