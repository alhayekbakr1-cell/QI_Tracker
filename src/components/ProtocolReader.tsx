"use client"

import { ProtocolData } from "@/utils/protocolExport";
import { X, FileText, Check, Award, AlertCircle, ShieldCheck } from "lucide-react";

interface ProtocolReaderProps {
    protocolData: ProtocolData;
    isOpen: boolean;
    onClose: () => void;
    showStamp?: boolean;
    actions?: React.ReactNode;
}

export default function ProtocolReader({ protocolData, isOpen, onClose, showStamp = true, actions }: ProtocolReaderProps) {
    if (!isOpen) return null;

    const data = protocolData;

    return (
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-md flex justify-end animate-in fade-in duration-300">
            <div className="bg-slate-50 w-full max-w-4xl h-full shadow-2xl flex flex-col border-l border-slate-250/50 overflow-hidden animate-in slide-in-from-right duration-500">
                {/* Header */}
                <div className="px-8 py-5 bg-gradient-to-r from-slate-900 via-slate-950 to-advent-cobalt text-white flex justify-between items-center shrink-0 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-xl">
                            <FileText className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-slate-400">GME Clinical Registry</span>
                            <h3 className="text-base font-black font-serif italic text-white tracking-tight">
                                Official 14-Section QI Protocol
                            </h3>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-350 hover:text-white rounded-xl transition-all cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto px-8 py-10 space-y-10 max-w-4xl mx-auto w-full pb-20">
                    
                    {/* Official Exempt QA Determination Stamp */}
                    {showStamp && (
                        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-emerald-100/50 to-white p-6 rounded-[2rem] border-2 border-emerald-500/20 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in zoom-in-95 duration-500">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-emerald-800">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">AdventHealth Tampa GME</span>
                                </div>
                                <h4 className="text-lg font-serif italic font-bold text-slate-900">
                                    Exempt Quality Improvement (QA) Determination
                                </h4>
                                <p className="text-xs font-semibold text-slate-650 leading-relaxed max-w-xl">
                                    This activity has been formally audited and satisfies institutional clinical research criteria. It does not constitute research involving human subjects per 45 CFR 46.102(d). IRB oversight is bypassed.
                                </p>
                            </div>
                            
                            {/* Visual Stamp Seal */}
                            <div className="self-center md:self-auto flex flex-col items-center justify-center border-4 border-dashed border-emerald-600/60 rounded-full px-5 py-4 rotate-3 text-emerald-700 bg-white/50 backdrop-blur-3xs shrink-0 select-none shadow-3xs">
                                <span className="text-[8px] font-black uppercase tracking-widest leading-none">APPROVED</span>
                                <span className="text-base font-serif italic font-black py-0.5 tracking-tight">QA EXEMPT</span>
                                <span className="text-[8px] font-black uppercase tracking-widest leading-none">GME REGISTRY</span>
                            </div>
                        </div>
                    )}

                    {/* SQUIRE Protocol Content Sheets */}
                    <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-sm border border-slate-200/60 font-serif text-slate-900 space-y-12">
                        
                        {/* Title Block */}
                        <div className="border-b-4 border-slate-900 pb-8 text-center md:text-left space-y-4">
                            <h2 className="text-2.5xl font-bold tracking-tight text-slate-900 leading-snug">
                                {data.title}
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs font-sans text-slate-600">
                                <div>
                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Principal Investigator</span>
                                    <span className="font-bold text-slate-800 text-[11px]">{data.pi || "Not Specified"}</span>
                                </div>
                                <div>
                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Co-Investigators</span>
                                    <span className="font-bold text-slate-800 text-[11px]">{data.coInvestigators || "None listed"}</span>
                                </div>
                                <div>
                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Faculty Mentor</span>
                                    <span className="font-bold text-slate-800 text-[11px]">{data.mentor || "Not Assigned"}</span>
                                </div>
                                <div>
                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Sponsoring Institution</span>
                                    <span className="font-bold text-slate-800 text-[11px]">{data.sponsor}</span>
                                </div>
                                <div>
                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">IRB Classification</span>
                                    <span className="font-bold text-slate-800 text-[11px]">{data.irbStatus} {data.irbNumber && `(#${data.irbNumber})`}</span>
                                </div>
                                <div>
                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Duration</span>
                                    <span className="font-bold text-slate-800 text-[11px]">{data.duration}</span>
                                </div>
                            </div>
                        </div>

                        {/* Section 1: Overview Matrix */}
                        <div className="space-y-4">
                            <h3 className="text-base font-bold font-sans uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2">
                                1. SQUIRE Overview Matrix
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans text-xs">
                                <div className="space-y-1">
                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">The Problem</span>
                                    <p className="text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100">{data.problem || "No description provided."}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">SMART Aim</span>
                                    <p className="text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100">{data.aim || "No aim statement specified."}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Planned Intervention</span>
                                    <p className="text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100">{data.intervention || "No intervention detailed."}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Key Measure</span>
                                    <p className="text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100">{data.outcomeMeasure || "No primary outcome measure listed."}</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Background & Baseline */}
                        <div className="space-y-4">
                            <h3 className="text-base font-bold font-sans uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2">
                                2. Background & Baseline Data
                            </h3>
                            <div className="space-y-4 text-sm leading-relaxed text-slate-800">
                                <div>
                                    <h4 className="text-xs font-bold font-sans text-slate-400 uppercase tracking-widest mb-1">Introduction & Rationale</h4>
                                    <p>{data.background || "Pending detailed rationale."}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold font-sans text-slate-400 uppercase tracking-widest mb-1">Local Baseline Metrics</h4>
                                    <p>{data.baselineData || "Baseline audits pending."}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold font-sans text-slate-400 uppercase tracking-widest mb-1">Summary of Literature Evidence</h4>
                                    <p>{data.evidence || "No clinical evidence listed."}</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Outcomes Table */}
                        <div className="space-y-4">
                            <h3 className="text-base font-bold font-sans uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2">
                                3. Intended Outcomes
                            </h3>
                            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                                <table className="w-full text-left border-collapse font-sans text-xs">
                                    <thead>
                                        <tr className="bg-slate-900 text-white font-black uppercase tracking-wider text-[8.5px]">
                                            <th className="p-3.5 border-b border-slate-250">Outcome Type</th>
                                            <th className="p-3.5 border-b border-slate-250">Working Definition</th>
                                            <th className="p-3.5 border-b border-slate-250">Data Source</th>
                                            <th className="p-3.5 border-b border-slate-250">Target Goal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                                        {data.outcomesTable && data.outcomesTable.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="p-3.5 font-bold text-slate-800">{row.type}</td>
                                                <td className="p-3.5">{row.def}</td>
                                                <td className="p-3.5">{row.source}</td>
                                                <td className="p-3.5 text-advent-navy font-bold">{row.target}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Section 4: Methodology & Setting */}
                        <div className="space-y-4">
                            <h3 className="text-base font-bold font-sans uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2">
                                4. Quality Methods & setting details
                            </h3>
                            <div className="space-y-4 text-sm leading-relaxed text-slate-800">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans text-xs">
                                    <div className="space-y-1">
                                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">QI Design</span>
                                        <span className="font-bold text-slate-800 block text-[11px]">{data.design === "Other" ? data.designOtherText : data.design}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Clinical Setting Details</span>
                                        <span className="font-bold text-slate-800 block text-[11px]">{data.settingDetails}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Inclusion Criteria</span>
                                        <span className="font-bold text-slate-800 block text-[11px]">{data.inclusionCriteria}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Exclusion Criteria</span>
                                        <span className="font-bold text-slate-800 block text-[11px]">{data.exclusionCriteria}</span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <h4 className="text-xs font-bold font-sans text-slate-400 uppercase tracking-widest mb-1">PDSA Workflow Cycles</h4>
                                    <div className="space-y-3 font-sans">
                                        {data.pdsaCycles && data.pdsaCycles.map((cycle, idx) => (
                                            <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-2 text-xs">
                                                <div className="font-black text-slate-900 border-b border-slate-250 pb-1 flex justify-between">
                                                    <span>{cycle.cycle}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Test Cycle</span>
                                                </div>
                                                <p className="leading-relaxed font-semibold text-slate-700"><strong>PLAN:</strong> {cycle.plan}</p>
                                                <p className="leading-relaxed font-semibold text-slate-700"><strong>DO:</strong> {cycle.do}</p>
                                                <p className="leading-relaxed font-semibold text-slate-700"><strong>STUDY:</strong> {cycle.study}</p>
                                                <p className="leading-relaxed font-semibold text-slate-700"><strong>ACT:</strong> {cycle.act}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 5 & 6: Measures & Security */}
                        <div className="space-y-4">
                            <h3 className="text-base font-bold font-sans uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2">
                                5 & 6. Measurement Plan & Data Security
                            </h3>
                            <div className="overflow-x-auto border border-slate-200 rounded-2xl mb-4">
                                <table className="w-full text-left border-collapse font-sans text-xs">
                                    <thead>
                                        <tr className="bg-slate-900 text-white font-black uppercase tracking-wider text-[8.5px]">
                                            <th className="p-3.5 border-b border-slate-250">Measure Name</th>
                                            <th className="p-3.5 border-b border-slate-250">Type</th>
                                            <th className="p-3.5 border-b border-slate-250">Working Definition</th>
                                            <th className="p-3.5 border-b border-slate-250">Numerator / Denominator</th>
                                            <th className="p-3.5 border-b border-slate-250">Frequency</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                                        {data.measuresTable && data.measuresTable.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="p-3.5 font-bold text-slate-800">{row.measure}</td>
                                                <td className="p-3.5 text-slate-500 font-bold">{row.type}</td>
                                                <td className="p-3.5">{row.def}</td>
                                                <td className="p-3.5">{row.denNum}</td>
                                                <td className="p-3.5">{row.freq}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10 font-sans text-xs text-amber-900 space-y-1.5 shadow-3xs">
                                <span className="block text-[8.5px] font-black uppercase tracking-widest text-amber-700">Security Protocols (Section 6.1)</span>
                                <p className="font-semibold">{data.dataManagementDetails || "HIPAA-compliant server folders inside OneDrive."}</p>
                            </div>
                        </div>

                        {/* Section 7: Timeline & Tasks */}
                        <div className="space-y-4">
                            <h3 className="text-base font-bold font-sans uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2">
                                7. Project Timeline & Investigator Matrix
                            </h3>
                            <div className="overflow-x-auto border border-slate-200 rounded-2xl mb-4">
                                <table className="w-full text-left border-collapse font-sans text-xs">
                                    <thead>
                                        <tr className="bg-slate-900 text-white font-black uppercase tracking-wider text-[8.5px]">
                                            <th className="p-3.5 border-b border-slate-250">QI Project Phase</th>
                                            <th className="p-3.5 border-b border-slate-250">Target Dates</th>
                                            <th className="p-3.5 border-b border-slate-250">Lead Owner</th>
                                            <th className="p-3.5 border-b border-slate-250">Core Deliverable</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                                        {data.timelineChart && data.timelineChart.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="p-3.5 font-bold text-slate-800">{row.phase}</td>
                                                <td className="p-3.5 text-slate-500 font-bold">{row.dates}</td>
                                                <td className="p-3.5">{row.owner}</td>
                                                <td className="p-3.5 font-bold text-advent-navy">{row.deliverable}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                                <table className="w-full text-left border-collapse font-sans text-xs">
                                    <thead>
                                        <tr className="bg-slate-900 text-white font-black uppercase tracking-wider text-[8.5px]">
                                            <th className="p-3.5 border-b border-slate-250">Investigator Name</th>
                                            <th className="p-3.5 border-b border-slate-250">Academic Role</th>
                                            <th className="p-3.5 border-b border-slate-250">Specific Clinical Tasks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                                        {data.tasksTable && data.tasksTable.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="p-3.5 font-bold text-slate-800">{row.investigator}</td>
                                                <td className="p-3.5 text-slate-500 font-bold">{row.role}</td>
                                                <td className="p-3.5">{row.tasks}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Section 8 - 14: Final Sections Summary */}
                        <div className="space-y-4 pt-4 border-t border-slate-200">
                            <h3 className="text-base font-bold font-sans uppercase tracking-widest text-slate-900">
                                8-14. Registry Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm leading-relaxed text-slate-800">
                                <div>
                                    <h4 className="text-xs font-bold font-sans text-slate-400 uppercase tracking-widest mb-1">8. Analysis Methodology</h4>
                                    <p>{data.analysisPlan}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold font-sans text-slate-400 uppercase tracking-widest mb-1">10. Discussion & Sustainability</h4>
                                    <p>{data.sustainability || "Continuous ward huddles and standard order sets."}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold font-sans text-slate-400 uppercase tracking-widest mb-1">11. Ethical Considerations</h4>
                                    <p>{data.ethical}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold font-sans text-slate-400 uppercase tracking-widest mb-1">13. Dissemination Plan</h4>
                                    <p>{data.dissemination}</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 14: References */}
                        {data.references && (
                            <div className="pt-6 border-t border-slate-150 space-y-2">
                                <h4 className="text-xs font-bold font-sans text-slate-400 uppercase tracking-widest">14. Literature References</h4>
                                <pre className="font-sans text-xs font-medium whitespace-pre-line text-slate-600 leading-relaxed">
                                    {data.references}
                                </pre>
                            </div>
                        )}

                    </div>
                </div>

                {/* Sticky Action Footer inside Reader Drawer */}
                {actions && (
                    <div className="px-8 py-4 bg-slate-950 border-t border-slate-800/85 flex justify-between items-center gap-3 shrink-0 shadow-lg">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mr-auto">Registry Audit Actions</span>
                        <div className="flex items-center gap-3">
                            {actions}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
