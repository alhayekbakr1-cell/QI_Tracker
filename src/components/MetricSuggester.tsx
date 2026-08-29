"use client"

import { useState } from "react";
import { Sparkles, Loader2, ChevronRight } from "lucide-react";
import { suggestMetrics } from "@/utils/ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MetricSuggester({ projectTitle }: { projectTitle: string }) {
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSuggest = async () => {
        setIsLoading(true);
        try {
            const result = await suggestMetrics(projectTitle);
            setSuggestion(result);
        } catch (error: any) {
            console.error("Metric Suggestion error:", error);
            setSuggestion("Failed to get suggestions. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-advent-navy/5 to-advent-blue/5 border border-advent-blue/10 rounded-2xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-advent-blue" />
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-advent-navy">Metric Suggestion Engine</h4>
                </div>
                <button
                    onClick={handleSuggest}
                    disabled={isLoading}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white bg-advent-navy px-3 py-1.5 rounded-lg hover:bg-advent-cobalt transition-all disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Suggest Metrics"}
                </button>
            </div>

            {suggestion ? (
                <div className="bg-white/50 border border-white rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed
                                    prose-headings:text-[11px] prose-headings:font-black prose-headings:uppercase
                                    prose-headings:tracking-widest prose-headings:text-advent-navy prose-headings:mt-4
                                    prose-headings:mb-1.5 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5
                                    prose-strong:text-advent-navy prose-strong:font-bold">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {suggestion}
                        </ReactMarkdown>
                    </div>
                </div>
            ) : (
                <p className="text-[11px] text-slate-400 font-medium italic">
                    Stuck on what to measure? The AI can suggest Process, Outcome, and Balancing metrics optimized for this project title.
                </p>
            )}
        </div>
    );
}
