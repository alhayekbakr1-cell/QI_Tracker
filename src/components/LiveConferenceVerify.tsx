"use client"

import React, { useState } from 'react';
import { Search, Loader2, CheckCircle2, AlertCircle, ExternalLink, RefreshCw, Save, Sparkles, FileText, Presentation, Layout } from 'lucide-react';
import { getLiveConferenceDeadline } from '@/utils/ai';
import { createClient } from '@/utils/supabase/client';
import { toast } from '@/components/ui/custom-ui';

interface LiveConferenceVerifyProps {
    conferenceId: string;
    conferenceName: string;
    currentDeadline: string;
    onUpdateComplete?: () => void;
}

export default function LiveConferenceVerify({ conferenceId, conferenceName, currentDeadline, onUpdateComplete }: LiveConferenceVerifyProps) {
    const [status, setStatus] = useState<'idle' | 'searching' | 'found' | 'saving' | 'error'>('idle');
    const [result, setResult] = useState<any>(null);
    const supabase = createClient();

    const handleSearch = async () => {
        setStatus('searching');
        try {
            const response = await getLiveConferenceDeadline(conferenceName);
            // Clean JSON if AI adds triple backticks
            const cleaned = response.replace(/```json|```/g, '').trim();
            const data = JSON.parse(cleaned);
            setResult(data);
            setStatus('found');
        } catch (err) {
            console.error('AI Scout Error:', err);
            setStatus('error');
        }
    };

    const handleSaveAndSync = async () => {
        if (!result) return;
        setStatus('saving');
        try {
            const date = new Date(result.deadline);
            const updatePayload: Record<string, any> = {
                deadline_month: date.getMonth(),
                deadline_day: date.getDate(),
                website: result.url || result.website || '',
                last_ai_check: new Date().toISOString(),
                ai_confidence: result.confidence || 'Medium',
                updated_at: new Date().toISOString()
            };

            // Add enriched columns
            if (result.url) updatePayload.submission_url = result.url;
            if (result.abstractLimit) updatePayload.abstract_limit = result.abstractLimit;
            if (result.requiredSections) updatePayload.required_sections = result.requiredSections;
            if (result.posterDimensions) updatePayload.poster_dimensions = result.posterDimensions;
            if (result.gmeTips) updatePayload.gme_tips = result.gmeTips;

            const { error } = await supabase
                .from('conferences_registry')
                .update(updatePayload)
                .eq('id', conferenceId);

            if (error) {
                console.warn("Enriched db update failed, falling back to basic columns:", error);
                const basicPayload = {
                    deadline_month: date.getMonth(),
                    deadline_day: date.getDate(),
                    website: result.url || '',
                    last_ai_check: new Date().toISOString(),
                    ai_confidence: result.confidence || 'Medium',
                    updated_at: new Date().toISOString()
                };
                const { error: basicError } = await supabase
                    .from('conferences_registry')
                    .update(basicPayload)
                    .eq('id', conferenceId);
                
                if (basicError) throw basicError;
            }

            toast.success(`${conferenceName} guidelines & dates updated successfully!`);
            setStatus('idle');
            setResult(null);
            if (onUpdateComplete) onUpdateComplete();
        } catch (err) {
            console.error('Failed to sync to database:', err);
            toast.error('Failed to save scraped guidelines to database.');
            setStatus('found');
        }
    };

    return (
        <div className="flex items-center gap-2 relative">
            {status === 'idle' && (
                <button
                    onClick={handleSearch}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 rounded-xl border border-slate-200 hover:border-amber-200 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-2xs"
                >
                    <Search className="w-3 h-3 text-amber-500" /> Live Verify
                </button>
            )}

            {status === 'searching' && (
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 p-1.5">
                    <Loader2 className="w-3 h-3 animate-spin text-amber-500" /> Searching Web...
                </div>
            )}

            {status === 'found' && result && (
                <div className="absolute right-0 bottom-8 flex flex-col gap-2.5 p-4.5 bg-white border border-slate-200 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300 w-[280px] z-50">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-1.5">
                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" /> AI Scraped Guidelines
                        </span>
                        <button onClick={() => setStatus('idle')} className="text-slate-350 hover:text-slate-500 transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    
                    <div className="space-y-2">
                        <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase block leading-none">New Deadline</span>
                            <span className="text-xs font-black text-advent-navy block mt-0.5">{result.displayDate}</span>
                        </div>

                        {result.abstractLimit && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-600">
                                <FileText className="w-3 h-3 text-advent-blue" />
                                <span className="font-extrabold uppercase tracking-wide">Word Limit:</span>
                                <span className="font-semibold text-slate-500">{result.abstractLimit}</span>
                            </div>
                        )}

                        {result.requiredSections && (
                            <div className="flex items-start gap-1 text-[10px] text-slate-600">
                                <Layout className="w-3 h-3 text-advent-green mt-0.5" />
                                <div>
                                    <span className="font-extrabold uppercase tracking-wide block leading-none">Headings:</span>
                                    <span className="font-semibold text-slate-550 leading-tight block mt-0.5 line-clamp-1">{result.requiredSections}</span>
                                </div>
                            </div>
                        )}

                        {result.posterDimensions && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-600">
                                <Presentation className="w-3 h-3 text-amber-500" />
                                <span className="font-extrabold uppercase tracking-wide">Poster Size:</span>
                                <span className="font-semibold text-slate-500">{result.posterDimensions}</span>
                            </div>
                        )}
                        
                        <div className="text-[9px] text-slate-400 leading-tight italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                            "{result.notes}"
                        </div>
                    </div>

                    <div className="mt-1.5 pt-2 border-t border-slate-150 flex items-center justify-between gap-3">
                        {result.url && (
                            <a 
                                href={result.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[9px] font-black text-advent-blue hover:text-advent-navy flex items-center gap-0.5 uppercase tracking-widest hover:underline cursor-pointer"
                            >
                                guidelines <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                        )}
                        <button
                            onClick={handleSaveAndSync}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md transition-all cursor-pointer"
                        >
                            <Save className="w-2.5 h-2.5" /> Save & Sync
                        </button>
                    </div>
                </div>
            )}

            {status === 'saving' && (
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 p-1.5">
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-500" /> Saving changes...
                </div>
            )}

            {status === 'error' && (
                <button
                    onClick={handleSearch}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
                >
                    <AlertCircle className="w-3 h-3" /> Retry Verification
                </button>
            )}
        </div>
    );
}
