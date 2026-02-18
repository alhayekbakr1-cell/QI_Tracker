"use client"

import { Project } from '@/types'
import { Sparkles, Copy, CheckCircle2, FileText, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface PublicationAssistantProps {
    project: Project;
}

export default function PublicationAssistant({ project }: PublicationAssistantProps) {
    const [isGenerating, setIsGenerating] = useState(false)
    const [copied, setCopied] = useState(false)

    const generateAbstract = () => {
        setIsGenerating(true)
        // Simulated generation - in real life this could call AI with more context
        // But we can structure the existing data beautifully first
        setTimeout(() => setIsGenerating(false), 800)
    }

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
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black tracking-tight leading-none">Publication Assistant</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ready for Abstract Submission</p>
                    </div>
                </div>
                <button
                    onClick={handleCopy}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                >
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy Abstract'}
                </button>
            </div>

            <div className="p-8 space-y-6">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {abstractText}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600">AH</div>
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-600">GME</div>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Collaborators Linked</span>
                    </div>

                    <button
                        className="flex items-center gap-2 text-advent-blue font-black text-xs uppercase tracking-widest hover:translate-x-1 transition-transform"
                        onClick={() => alert("PDF Export coming soon!")}
                    >
                        Export PDF Summary
                        <ChevronRight className="w-4 h-4" />
                    </button>
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
