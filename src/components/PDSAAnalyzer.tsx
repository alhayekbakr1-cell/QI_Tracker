"use client"

import { useState } from "react";
import { Sparkles, Loader2, TrendingUp, AlertCircle } from "lucide-react";
import { analyzePDSA } from "@/utils/ai";
import { Project } from "@/types";

interface PDSAAnalyzerProps {
    project: Project;
    metrics: any[];
}

export default function PDSAAnalyzer({ project, metrics }: PDSAAnalyzerProps) {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAnalyze = async () => {
        setIsLoading(true);
        try {
            const result = await analyzePDSA(project, metrics);
            setAnalysis(result);
        } catch (error) {
            console.error("PDSA Analysis error:", error);
            setAnalysis("Failed to generate analysis. Ensure the AI proxy is active and configured correctly.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-advent-navy to-advent-cobalt rounded-3xl p-6 text-white shadow-xl shadow-advent-navy/20">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-xl">
                        <Sparkles className="w-5 h-5 text-advent-sky" />
                    </div>
                    <div>
                        <h3 className="font-black text-sm uppercase tracking-widest leading-none">PDSA Consultant</h3>
                        <p className="text-[10px] text-white/60 font-medium mt-1 uppercase tracking-wider">AI-Powered Insights</p>
                    </div>
                </div>

                {!analysis && !isLoading && (
                    <button
                        onClick={handleAnalyze}
                        className="bg-white text-advent-navy px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-advent-sky hover:text-white transition-all active:scale-95 shadow-lg"
                    >
                        Analyze Project
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center py-8 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-advent-sky" />
                    <p className="text-xs font-bold animate-pulse uppercase tracking-[0.2em] text-white/40">Reviewing metrics...</p>
                </div>
            ) : analysis ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                        <p className="text-sm font-medium leading-relaxed italic opacity-90">
                            "{analysis}"
                        </p>
                    </div>
                    <button
                        onClick={handleAnalyze}
                        className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-advent-sky hover:text-white transition-colors"
                    >
                        <TrendingUp className="w-3 h-3" />
                        Re-run Analysis
                    </button>
                </div>
            ) : (
                <div className="flex items-start gap-3 py-4 opacity-50">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-xs font-medium leading-relaxed">
                        Ready to analyze your PDSA cycle. Click the button above to generate clinical insights and next steps based on your current data.
                    </p>
                </div>
            )}
        </div>
    );
}
