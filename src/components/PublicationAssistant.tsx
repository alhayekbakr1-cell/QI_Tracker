"use client"

import { Project } from '@/types'
import { Sparkles, Copy, CheckCircle2, FileText, ChevronRight, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { scanForPHI } from '@/utils/phi_guard'

interface PublicationAssistantProps {
    project: Project;
    isOpen: boolean;
    onClose: () => void;
}

export default function PublicationAssistant({ project, isOpen, onClose }: PublicationAssistantProps) {
    const [copied, setCopied] = useState(false)
    const [phiFindings, setPhiFindings] = useState<{ type: string; value: string }[]>([])

    // Scan for PHI whenever the modal opens or project changes
    useEffect(() => {
        if (isOpen) {
            const findings = scanForPHI(JSON.stringify(project));
            setPhiFindings(findings);
        }
    }, [isOpen, project]);

    if (!isOpen) return null;

    const abstractText = `
TITLE: ${project.title.toUpperCase()}

BACKGROUND: 
Quality improvement initiative focused on ${project.category || 'clinical healthcare'} within the ${project.subcategory || 'Internal Medicine'} department. The primary focus was addressed through ${project.primary_outcome || 'standard institutional monitoring'}.

METHODS:
Through ${project.pdsa_cycle} PDSA cycles, we implemented ${project.updates_and_barriers || 'systematic changes'} to address existing barriers. Progress was tracked via standardized metrics and faculty oversight.

RESULTS:
The initiative successfully impacted ${project.total_patients_impacted || 0} patients. Implementation of these changes resulted in an estimated institutional savings of $${project.estimated_cost_savings || 0}. Current status: ${project.status}.

CONCLUSIONS:
This project demonstrates the effectiveness of ${project.title} in improving quality outcomes. Continuous monitoring through the QI Chief Tracker ensures sustainability of gained improvements.
`.trim()

    const handleCopy = () => {
        navigator.clipboard.writeText(abstractText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight leading-none">Publication Assistant</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 px-2 py-0.5 bg-white/5 rounded-full inline-block">Ready for Submission</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCopy}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied' : 'Copy Abstract'}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                    {phiFindings.length > 0 && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-[10px] font-black text-red-700 uppercase tracking-widest leading-none mb-1">Privacy Alert: Potential PHI Detected</h4>
                                <p className="text-[10px] text-red-600 font-medium">
                                    We found {phiFindings.length} item(s) that look like sensitive patient data (MRNs, Names, or Dates). Please ensure all clinical data is redacted before submission.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 font-mono text-sm text-slate-600 whitespace-pre-wrap leading-relaxed shadow-inner">
                        {abstractText}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                <div className="w-10 h-10 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600 shadow-sm">AH</div>
                                <div className="w-10 h-10 rounded-full border-4 border-white bg-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-600 shadow-sm">GME</div>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Collaborators Linked</span>
                        </div>

                        <button
                            className="group flex items-center gap-2 text-advent-blue font-black text-[10px] uppercase tracking-widest hover:translate-x-1 transition-transform bg-advent-blue/5 px-6 py-3 rounded-xl"
                            onClick={() => alert("PDF Export coming soon!")}
                        >
                            Export PDF Summary
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Trophy(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 22V18" />
            <path d="M14 22V18" />
            <path d="M12 4v10" />
            <path d="M4 9c0 4.4 3.6 8 8 8s8-3.6 8-8V4H4Z" />
        </svg>
    )
}
