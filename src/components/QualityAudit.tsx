"use client"

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { auditProjectQuality } from "@/utils/ai";
import { Project } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// The model phrases the rating as "82/100", "82%", or "Quality Score: 82"
// depending on where it lands, so try each form widest-first.
function parseScore(text: string): number {
    const match =
        text.match(/(\d{1,3})\s*\/\s*100/) ||
        text.match(/(\d{1,3})\s*%/) ||
        text.match(/score[^\d]{0,15}(\d{1,3})/i);
    const value = match ? parseInt(match[1], 10) : NaN;
    return Number.isFinite(value) && value >= 0 && value <= 100 ? value : 70;
}

// The score is already shown as the big number, so strip it from the prose.
// Leaving it in was rendering as a stray "**/100**" beside the dial. A line
// that is *only* the score is dropped; a line that opens with the score and
// then continues into real feedback keeps its remainder.
const SCORE_CLAUSE =
    /^\W*(?:overall\s+)?(?:quality\s+)?score\b[^.\n]*?\d{1,3}\s*(?:\/\s*100|%)?\s*[.:-]?\s*/i;
const SCORE_ONLY = /^(?:overall)?(?:quality)?score[:-]?\d{1,3}(?:\/100|%)?$/i;

export function stripScore(text: string): string {
    return text
        .replace(/^\s*["'`]+|["'`]+\s*$/g, "")
        .split("\n")
        .map((line, i) => {
            if (i > 1 || !/\d/.test(line)) return line;
            if (SCORE_ONLY.test(line.replace(/[*_#\s]/g, ""))) return "";
            return line.replace(SCORE_CLAUSE, "");
        })
        .join("\n")
        .replace(/^\s*\*{0,2}feedback\*{0,2}\s*[:-]\s*/im, "")
        .replace(/^\s*[*_\s]+/, "")
        .trim();
}

export default function QualityAudit({ project }: { project: Project }) {
    const [audit, setAudit] = useState<{ score: number, feedback: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAudit = async () => {
        setIsLoading(true);
        try {
            const result = await auditProjectQuality(project);
            const cleaned = stripScore(result);
            setAudit({ score: parseScore(result), feedback: cleaned || result });
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
                        <div className="text-xs font-medium text-slate-300 leading-relaxed prose prose-invert max-w-none
                                        prose-p:my-1.5 prose-p:text-xs prose-strong:text-white prose-strong:font-bold
                                        prose-ul:my-1.5 prose-li:my-0.5 prose-li:text-xs prose-headings:hidden">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {audit.feedback}
                            </ReactMarkdown>
                        </div>
                        <button
                            onClick={handleAudit}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                        >
                            Re-run audit
                        </button>
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
