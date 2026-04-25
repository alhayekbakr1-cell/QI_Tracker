"use client"

import { useState } from "react";
import { FileText, Sparkles, Loader2, Download, TrendingUp, AlertCircle } from "lucide-react";
import { generateExecutiveReport } from "@/utils/ai";
import { createClient } from "@/utils/supabase/client";

export default function ExecutiveReportCenter() {
    const [report, setReport] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            // Fetch all projects for analysis
            const { data: projects } = await supabase
                .from('projects')
                .select('title, category, status, updates_and_barriers');

            if (!projects || projects.length === 0) {
                setReport("No projects found to analyze.");
                return;
            }

            // Summarize for AI
            const summary = projects.map(p =>
                `Title: ${p.title} | Category: ${p.category} | Status: ${p.status} | Barriers: ${p.updates_and_barriers?.substring(0, 100)}...`
            ).join('\n---\n');

            const result = await generateExecutiveReport(summary);
            setReport(result);
        } catch (error: any) {
            console.error("Report generation error:", error);
            setReport("Failed to generate report. Details: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-12">
            <div className="p-8 bg-gradient-to-br from-slate-50 to-white flex justify-between items-center border-b border-slate-100">
                <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-advent-navy" />
                        Executive Intelligence Center
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 font-medium italic">Generate high-level institutional QI summaries for hospital leadership.</p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="flex items-center gap-3 bg-advent-navy text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-advent-cobalt transition-all shadow-xl shadow-advent-navy/10 disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate Briefing
                </button>
            </div>

            {report && (
                <div className="p-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 prose prose-slate max-w-none">
                        <h3 className="text-advent-navy text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                            Analysis Complete
                        </h3>
                        <div className="text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                            {report}
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-advent-blue transition-all">
                            <Download className="w-4 h-4" />
                            Copy for Email
                        </button>
                    </div>
                </div>
            )}

            {!report && !isLoading && (
                <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
                        <FileText className="w-8 h-8" />
                    </div>
                    <p className="text-slate-400 font-bold text-sm tracking-wide">Click the button above to synthesize project data into a Chief's Briefing.</p>
                </div>
            )}
        </div>
    );
}
