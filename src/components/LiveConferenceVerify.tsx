"use client"

import React, { useState } from 'react';
import { Search, Loader2, CheckCircle2, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { getLiveConferenceDeadline } from '@/utils/ai';

interface LiveConferenceVerifyProps {
    conferenceName: string;
    currentDeadline: string;
}

export default function LiveConferenceVerify({ conferenceName, currentDeadline }: LiveConferenceVerifyProps) {
    const [status, setStatus] = useState<'idle' | 'searching' | 'found' | 'error'>('idle');
    const [result, setResult] = useState<any>(null);

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
            console.error(err);
            setStatus('error');
        }
    };

    return (
        <div className="flex items-center gap-2">
            {status === 'idle' && (
                <button
                    onClick={handleSearch}
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-advent-blue hover:text-advent-navy transition-colors"
                >
                    <Search className="w-3 h-3" /> Live Verify
                </button>
            )}

            {status === 'searching' && (
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Loader2 className="w-3 h-3 animate-spin" /> Searching Web...
                </div>
            )}

            {status === 'found' && result && (
                <div className="flex flex-col gap-1 p-3 bg-white border border-slate-200 rounded-xl shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 min-w-[200px] z-50">
                    <div className="flex justify-between items-start">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">AI Found</span>
                        <button onClick={() => setStatus('idle')} className="text-slate-300 hover:text-slate-500 transition-colors">
                            <RefreshCw className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="text-xs font-black text-advent-navy">{result.displayDate}</div>
                    <div className="text-[10px] text-slate-500 leading-tight italic">"{result.notes}"</div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-advent-blue flex items-center gap-1 uppercase tracking-widest">
                            Official Site <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <div className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${result.confidence === 'High' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                            {result.confidence} Confidence
                        </div>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <button
                    onClick={handleSearch}
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-500"
                >
                    <AlertCircle className="w-3 h-3" /> AI Connection Error
                </button>
            )}
        </div>
    );
}
