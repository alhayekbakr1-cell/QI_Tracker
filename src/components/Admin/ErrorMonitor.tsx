"use client"

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AlertCircle, CheckCircle, Clock, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { AuditLog } from '@/types';

interface SystemError {
    id: string;
    error_message: string;
    error_stack: string | null;
    component_name: string | null;
    user_id: string | null;
    url: string | null;
    user_agent: string | null;
    created_at: string;
    is_fixed?: boolean; // We'll simulate this if not in schema yet
}

export default function ErrorMonitor() {
    const [errors, setErrors] = useState<SystemError[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const supabase = createClient();

    const fetchErrors = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('system_errors')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching system logs:', error);
        } else {
            setErrors(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchErrors();
    }, []);

    const deleteError = async (id: string) => {
        const { error } = await supabase
            .from('system_errors')
            .delete()
            .eq('id', id);

        if (!error) {
            setErrors(errors.filter(e => e.id !== id));
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-advent-blue" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight">System Error Monitor</h3>
                </div>
                <button
                    onClick={fetchErrors}
                    className="text-[10px] font-bold text-advent-blue hover:underline"
                >
                    REFRESH LOGS
                </button>
            </div>

            <div className="glass rounded-2xl overflow-hidden border border-slate-200/50 shadow-sm">
                <div className="max-h-[400px] overflow-y-auto">
                    {errors.length === 0 ? (
                        <div className="p-12 text-center">
                            <CheckCircle className="w-12 h-12 text-emerald-100 mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Errors Detected</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {errors.map((err) => (
                                <div key={err.id} className={`p-4 transition-all ${expandedId === err.id ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div
                                            className="flex-1 cursor-pointer"
                                            onClick={() => setExpandedId(expandedId === err.id ? null : err.id)}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black bg-red-100 text-red-700 px-1.5 py-0.5 rounded leading-none">
                                                    ERROR
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-400 italic">
                                                    {new Date(err.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-slate-700 line-clamp-1">
                                                {err.error_message}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => deleteError(err.id)}
                                                className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setExpandedId(expandedId === err.id ? null : err.id)}
                                                className="p-1.5 text-slate-300"
                                            >
                                                {expandedId === err.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {expandedId === err.id && (
                                        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-2 bg-white rounded-lg border border-slate-200">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Component</span>
                                                    <span className="text-[10px] font-bold text-slate-600">{err.component_name || 'Global Handler'}</span>
                                                </div>
                                                <div className="p-2 bg-white rounded-lg border border-slate-200">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">URL</span>
                                                    <span className="text-[10px] font-bold text-slate-600 truncate block text-advent-blue">{err.url}</span>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-slate-900 rounded-xl overflow-x-auto">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Stack Trace</span>
                                                <pre className="text-[9px] font-mono text-emerald-400 leading-relaxed max-h-[150px] overflow-auto">
                                                    {err.error_stack || 'No stack trace provided.'}
                                                </pre>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                <Clock className="w-3 h-3" />
                                                <span>User Agent: {err.user_agent}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <p className="text-[9px] text-slate-400 font-medium italic">
                * Error logs are automatically captured in real-time. Use the monitor to triage recurring frontend issues.
            </p>
        </div>
    );
}
