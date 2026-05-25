"use client"

import React, { useState, useEffect } from 'react';
import { 
    Calendar, 
    Clock, 
    Trophy, 
    ExternalLink, 
    ChevronRight, 
    Loader2, 
    Sparkles, 
    FileText, 
    Presentation, 
    Layout, 
    Copy, 
    Check, 
    MessageSquare, 
    AlertCircle,
    ChevronDown,
    Award
} from 'lucide-react';
import { DEFAULT_CONFERENCES, fetchRegistry, Conference, getNextDeadline } from '@/constants/conferences';
import { format, differenceInDays } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { generateAbstract } from '@/utils/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ConferenceMatcherProps {
    isTabbed?: boolean;
}

export default function ConferenceMatcher({ isTabbed = false }: ConferenceMatcherProps) {
    const [registry, setRegistry] = useState<Conference[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    
    // AI Abstract generator states
    const [myProjects, setMyProjects] = useState<any[]>([]);
    const [selectedProjId, setSelectedProjId] = useState<string>('');
    const [generatedAbstract, setGeneratedAbstract] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        async function load() {
            try {
                // Fetch registry
                const data = await fetchRegistry();
                setRegistry(data);
                
                // Fetch user projects for abstract prep
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: projData } = await supabase
                        .from('projects')
                        .select('id, title, category, status, primary_outcome, pdsa_cycle, updates_and_barriers, total_patients_impacted, estimated_cost_savings');
                    if (projData) {
                        setMyProjects(projData);
                        if (projData.length > 0) {
                            setSelectedProjId(projData[0].id);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load conference registry data:', error);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [supabase]);

    const handleCopyAbstract = () => {
        if (!generatedAbstract) return;
        navigator.clipboard.writeText(generatedAbstract);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleGenerateAbstract = async (conf: Conference) => {
        if (!selectedProjId) return;
        
        const project = myProjects.find(p => p.id === selectedProjId);
        if (!project) return;

        setIsGenerating(true);
        setGeneratedAbstract('');
        
        try {
            // Determine appropriate abstract format
            const id = conf.id.toUpperCase();
            let formatMode: 'standard' | 'acp' | 'shm' | 'ihi' | 'bmj' = 'standard';
            if (id === 'SHM') formatMode = 'shm';
            else if (id === 'ACP' || id === 'SGIM' || id === 'ACG' || id === 'DDW') formatMode = 'acp';
            else if (id === 'IHI') formatMode = 'ihi';
            else if (id === 'ASCO' || id === 'IDWEEK') formatMode = 'bmj';

            const abstractText = await generateAbstract(project, formatMode);
            setGeneratedAbstract(abstractText);
        } catch (error) {
            console.error('Failed to generate abstract:', error);
            setGeneratedAbstract('Failed to draft abstract. Please verify your project details contain sufficient baseline descriptions and try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center min-h-[200px] ${isTabbed ? '' : 'bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm'}`}>
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
        );
    }

    const conferences = registry.length > 0 ? registry : DEFAULT_CONFERENCES;

    const content = (
        <div className="space-y-6">
            {!isTabbed && (
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20">
                        <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-advent-navy tracking-tight">Conference Matcher</h3>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Upcoming Academic Deadlines</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {conferences.map((conf, idx) => {
                    const deadline = getNextDeadline(conf);
                    const daysLeft = differenceInDays(deadline, new Date());
                    const isUrgent = daysLeft < 30;
                    const isExpanded = expandedId === conf.id;

                    return (
                        <div 
                            key={idx} 
                            className={`group p-5 rounded-3xl border transition-all duration-300 ${
                                isExpanded 
                                    ? 'bg-amber-50/20 border-amber-300/80 shadow-md shadow-amber-500/5' 
                                    : 'bg-slate-50/50 border-slate-100 hover:border-amber-200 hover:bg-amber-50/30'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black text-amber-600 bg-amber-150/50 px-2 py-0.5 rounded uppercase tracking-wider">
                                        {conf.id} Registry
                                    </span>
                                    <h4 className="text-sm font-black text-slate-900 group-hover:text-amber-700 transition-colors uppercase tracking-tight">
                                        {conf.name}
                                    </h4>
                                    <p className="text-[10px] font-semibold text-slate-400 leading-none">
                                        {conf.fullName}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <a 
                                        href={conf.website} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="p-1.5 bg-white rounded-lg text-slate-400 hover:text-advent-navy border border-slate-200 shadow-xs transition-all cursor-pointer"
                                        title="Official Conference Website"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 mt-3">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-advent-navy/60" /> {format(deadline, 'MMMM dd, yyyy')}
                                </span>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                                    isUrgent 
                                        ? 'bg-rose-100 border-rose-200 text-rose-700' 
                                        : 'bg-white border-slate-200 text-slate-650 font-extrabold shadow-2xs'
                                }`}>
                                    <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'animate-pulse' : ''}`} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        {daysLeft} Days Remaining
                                    </span>
                                </div>
                                
                                <button 
                                    onClick={() => {
                                        setExpandedId(isExpanded ? null : conf.id);
                                        setGeneratedAbstract('');
                                    }}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-advent-navy hover:bg-advent-cobalt text-white text-[9px] font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                                >
                                    <span>{isExpanded ? 'Hide Details' : 'View Guidelines & Tips'}</span>
                                    <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                            </div>

                            {/* 📚 Expanded Section containing precise formatting, guidelines, direct submit links, and AI builder */}
                            {isExpanded && (
                                <div className="mt-5 pt-5 border-t border-slate-200/70 space-y-5 animate-in fade-in duration-300">
                                    
                                    {/* 📋 Official Guidelines Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <FileText className="w-3.5 h-3.5 text-advent-blue/80" />
                                                <span className="text-[8px] font-black uppercase tracking-wider">Abstract Limit</span>
                                            </div>
                                            <p className="text-xs font-black text-slate-700 pl-5">
                                                {conf.abstractLimit || '300 words'}
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <Layout className="w-3.5 h-3.5 text-advent-green/80" />
                                                <span className="text-[8px] font-black uppercase tracking-wider">Required Headings</span>
                                            </div>
                                            <p className="text-[10px] font-extrabold text-slate-700 pl-5 line-clamp-2 leading-tight">
                                                {conf.requiredSections || 'INTRODUCTION, METHODS, RESULTS, CONCLUSIONS'}
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <Presentation className="w-3.5 h-3.5 text-amber-500/80" />
                                                <span className="text-[8px] font-black uppercase tracking-wider">Poster Size</span>
                                            </div>
                                            <p className="text-xs font-black text-slate-700 pl-5">
                                                {conf.posterDimensions || '4\' x 8\' Landscape'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 💡 GME Academic Tip Card */}
                                    <div className="bg-advent-navy/5 border border-advent-navy/15 rounded-2xl p-4.5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="w-4 h-4 text-advent-navy" />
                                            <h5 className="text-[9px] font-black uppercase tracking-widest text-advent-navy">GME Success Strategy</h5>
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-650 leading-relaxed italic">
                                            "{conf.gmeTips || 'Ensure a robust clinical quality aim is clearly specified.'}"
                                        </p>
                                    </div>

                                    {/* ⚡ AI Abstract Prep Toolkit */}
                                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-4">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                                <Award className="w-4.5 h-4.5 text-amber-500" />
                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-800">AI Abstract Drafter</h5>
                                            </div>
                                            
                                            {conf.submissionUrl && (
                                                <a 
                                                    href={conf.submissionUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="flex items-center gap-1 text-[9px] font-black text-amber-600 hover:text-amber-700 uppercase tracking-widest hover:underline cursor-pointer"
                                                >
                                                    <span>Direct Submission Portal</span>
                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                </a>
                                            )}
                                        </div>

                                        {myProjects.length === 0 ? (
                                            <p className="text-[10px] font-bold text-slate-400 italic">No registered projects found. Create a project to draft an abstract.</p>
                                        ) : (
                                            <div className="space-y-3.5">
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <select 
                                                        value={selectedProjId}
                                                        onChange={(e) => setSelectedProjId(e.target.value)}
                                                        className="flex-1 p-2.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all"
                                                    >
                                                        {myProjects.map(p => (
                                                            <option key={p.id} value={p.id}>{p.title}</option>
                                                        ))}
                                                    </select>
                                                    
                                                    <button
                                                        onClick={() => handleGenerateAbstract(conf)}
                                                        disabled={isGenerating}
                                                        className="px-4.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-amber-500/10 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                                                    >
                                                        {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                                        <span>Draft structured Abstract</span>
                                                    </button>
                                                </div>

                                                {/* Output Area */}
                                                {generatedAbstract && (
                                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 relative overflow-hidden animate-in fade-in duration-300">
                                                        <div className="flex justify-between items-center bg-slate-100/70 p-2 rounded-lg border border-slate-200/50">
                                                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                                                                Suggested Abstract Manuscript
                                                            </span>
                                                            <button 
                                                                onClick={handleCopyAbstract}
                                                                className="flex items-center gap-1 text-[9px] font-black text-advent-navy hover:text-advent-cobalt uppercase tracking-widest cursor-pointer"
                                                            >
                                                                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                                                <span>{copied ? 'Copied' : 'Copy Abstract'}</span>
                                                            </button>
                                                        </div>
                                                        <div className="text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap font-medium font-sans">
                                                            <ReactMarkdown 
                                                                remarkPlugins={[remarkGfm]}
                                                                components={{
                                                                    p: ({node, ...props}) => <p className="mb-2 last:mb-0 text-slate-700 leading-relaxed font-semibold text-[11px]" {...props} />,
                                                                    strong: ({node, ...props}) => <strong className="font-black text-advent-navy block mt-3 mb-1 uppercase tracking-wider text-[10px]" {...props} />
                                                                }}
                                                            >
                                                                {generatedAbstract}
                                                            </ReactMarkdown>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="pt-2">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
                    Submit your abstract through the ORA Portal.
                </p>
            </div>
        </div>
    );

    if (isTabbed) {
        return content;
    }

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            {content}
        </div>
    );
}
