import { useState } from "react";
import { Sparkles, Loader2, TrendingUp, AlertCircle, PlusCircle, CheckCircle2, ListTodo } from "lucide-react";
import { analyzePDSA } from "@/utils/ai";
import { Project } from "@/types";
import { createClient } from "@/utils/supabase/client";

interface PDSAAnalyzerProps {
    project: Project;
    metrics: any[];
}

export default function PDSAAnalyzer({ project, metrics }: PDSAAnalyzerProps) {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [importedTasks, setImportedTasks] = useState<Record<number, boolean>>({});
    const [importingIndex, setImportingIndex] = useState<number | null>(null);

    const handleAnalyze = async () => {
        setIsLoading(true);
        setImportedTasks({});
        try {
            const result = await analyzePDSA(project, metrics);
            setAnalysis(result);
        } catch (error: any) {
            console.error("PDSA Analysis error:", error);
            setAnalysis(`Error: ${error.message || "Unknown error"}. Check Supabase logs or GEMINI_API_KEY.`);
        } finally {
            setIsLoading(false);
        }
    };

    // Regex to extract contents between [ANALYSIS] and [/ANALYSIS]
    const analysisMatch = analysis?.match(/\[ANALYSIS\]([\s\S]*?)\[\/ANALYSIS\]/i);
    // Regex to extract contents between [RECOMMENDATION_CARDS] and [/RECOMMENDATION_CARDS]
    const cardsMatch = analysis?.match(/\[RECOMMENDATION_CARDS\]([\s\S]*?)\[\/RECOMMENDATION_CARDS\]/i);

    let cleanAnalysis = analysis || "";
    let recommendedTasks: Array<{ title: string; description: string }> = [];

    if (analysisMatch) {
        cleanAnalysis = analysisMatch[1].trim();
    }
    if (cardsMatch) {
        try {
            recommendedTasks = JSON.parse(cardsMatch[1].trim());
        } catch (e) {
            console.error("Failed to parse recommended tasks JSON:", e);
        }
    }

    const handleImportTask = async (task: { title: string; description: string }, index: number) => {
        if (importingIndex !== null) return;
        setImportingIndex(index);
        
        try {
            const supabase = createClient();
            // Get current logged-in user id
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || null;

            // 1. Insert task
            const { error: tError } = await supabase
                .from('tasks')
                .insert([{
                    project_id: project.id,
                    title: task.title,
                    description: task.description,
                    status: 'todo',
                    due_date: null,
                    assignee_id: null
                }]);

            if (tError) throw tError;

            // 2. Insert audit log
            await supabase.from('audit_logs').insert([{
                project_id: project.id,
                user_id: userId,
                field_name: 'task_create',
                old_value: null,
                new_value: task.title,
                action: 'INSERT'
            }]);

            // Set imported state
            setImportedTasks(prev => ({ ...prev, [index]: true }));
        } catch (error: any) {
            console.error("Failed to import task:", error);
            alert(`Failed to add task: ${error.message || error}`);
        } finally {
            setImportingIndex(null);
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
                        className="bg-white text-advent-navy px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-advent-sky hover:text-white transition-all active:scale-95 shadow-lg cursor-pointer"
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
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                        <p className="text-xs sm:text-sm font-medium leading-relaxed italic opacity-95">
                            "{cleanAnalysis}"
                        </p>
                    </div>

                    {/* Interactive Recommended Tasks Section */}
                    {recommendedTasks.length > 0 && (
                        <div className="space-y-4 pt-2 border-t border-white/10">
                            <div>
                                <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-advent-sky mb-1">Interactive Guidance</span>
                                <h4 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                                    <ListTodo className="w-4 h-4 text-emerald-400" />
                                    Suggested PDSA Actions
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {recommendedTasks.map((task, idx) => {
                                    const isImported = importedTasks[idx];
                                    const isImporting = importingIndex === idx;

                                    return (
                                        <div 
                                            key={idx} 
                                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                                                isImported 
                                                    ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-200' 
                                                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            <div className="space-y-1">
                                                <h5 className="text-xs font-black uppercase tracking-tight leading-tight">{task.title}</h5>
                                                <p className="text-[10px] opacity-75 font-medium leading-relaxed">{task.description}</p>
                                            </div>

                                            <div className="flex justify-end pt-2">
                                                {isImported ? (
                                                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Added to Registry
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleImportTask(task, idx)}
                                                        disabled={isImporting}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-white text-advent-navy hover:bg-advent-sky hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
                                                    >
                                                        {isImporting ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <PlusCircle className="w-3.5 h-3.5" />
                                                        )}
                                                        {isImporting ? "Adding..." : "Import Task"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                        <button
                            onClick={handleAnalyze}
                            className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-advent-sky hover:text-white transition-colors cursor-pointer"
                        >
                            <TrendingUp className="w-3 h-3" />
                            Re-run Analysis
                        </button>
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/30">
                            AdventHealth IM GME
                        </span>
                    </div>
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
