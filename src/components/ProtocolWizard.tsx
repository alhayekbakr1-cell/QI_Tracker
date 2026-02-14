"use client"

import { useState, useEffect } from "react";
import {
    FileText, Sparkles, Loader2, ChevronRight, ChevronLeft,
    Save, Download, CheckCircle, Bot, HelpCircle
} from "lucide-react";
import { getProtocolSectionAdvice } from "@/utils/ai";
import { generateProtocolDoc, ProtocolData } from "@/utils/protocolExport";
import { createClient } from "@/utils/supabase/client";
import { saveAs } from "file-saver";

interface ProtocolWizardProps {
    projectId: string;
    projectTitle: string;
    onClose: () => void;
}

export default function ProtocolWizard({ projectId, projectTitle, onClose }: ProtocolWizardProps) {
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiAdvice, setAiAdvice] = useState<string | null>(null);
    const [directory, setDirectory] = useState<{ name: string; email: string }[]>([]);
    const [formData, setFormData] = useState<ProtocolData>({
        title: projectTitle,
        setting: "",
        pi: "",
        coInvestigators: "",
        mentor: "",
        irbStatus: "",
        // ... (remaining fields)
        problem: "",
        aim: "",
        intervention: "",
        outcomeMeasure: "",
        processMeasure: "",
        balancingMeasure: "",
        targetPop: "",
        duration: "3-6 months",
        background: "",
        baselineData: "",
        evidence: "",
        citations: "",
        outcomesTable: [{ type: "Primary", def: "", source: "", target: "" }],
        design: "PDSA",
        designDesc: "",
        populationDetails: [
            { component: "Setting", details: "" },
            { component: "Population", details: "" }
        ],
        interventionsDesc: "",
        pdsaCycles: [{ cycle: "Cycle 1", plan: "", do: "", study: "", act: "" }],
        measuresTable: [{ measure: "", type: "Outcome", def: "", denNum: "", freq: "", source: "" }],
        hipaa: "Data stored on AdventHealth OneDrive/SharePoint. Restricted to investigators.",
        analysisPlan: "Descriptive statistics, pre-vs-post comparison, run charts.",
        sustainability: "",
        ethical: "Minimal risk. QI/Not Human Subjects Research determination sought.",
        dissemination: "QI Conference presentation.",
        references: ""
    });

    const supabase = createClient();

    useEffect(() => {
        const fetchDirectory = async () => {
            const { data } = await supabase.from('directory').select('name, email').order('name');
            if (data) setDirectory(data);
        };
        fetchDirectory();
    }, [supabase]);

    const handleNext = () => setStep(s => Math.min(s + 8, s + 1));
    const handlePrev = () => setStep(s => Math.max(1, s - 1));

    const askAI = async (sectionName: string) => {
        setAiLoading(true);
        setAiAdvice(null);
        try {
            const context = `Context: ${sectionName}. The project title is ${projectTitle}.`;
            const advice = await getProtocolSectionAdvice(sectionName, "How do I best fill out this section for academic rigor?");
            setAiAdvice(advice);
        } catch (e) {
            setAiAdvice("Failed to get AI advice. Please try again.");
        } finally {
            setAiLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const blob = await generateProtocolDoc(formData);
            const fileName = `Protocol_${projectTitle.replace(/\s+/g, '_')}_${Date.now()}.docx`;

            // 1. Download for user immediately
            saveAs(blob, fileName);

            // 2. Upload to Supabase Storage
            // Path: Protocols/Category/ProjectTitle/FileName
            // Note: In a real app, we'd fetch the category first or pass it in.
            const path = `protocols/${projectId}/${fileName}`;
            const { error: uploadError } = await supabase.storage
                .from('attachments')
                .upload(path, blob);

            if (uploadError) throw uploadError;

            // 3. Link to project
            // Assuming projects table has a protocol_url or similar. 
            // For now, let's just alert success or close.
            alert("Protocol generated, downloaded, and saved to secure cloud storage!");
            onClose();
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 bg-advent-navy text-white flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/10 rounded-xl">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black uppercase tracking-widest text-sm">QI Protocol AI Wizard</h3>
                            <p className="text-xs text-white/60 font-medium">AdventHealth IM GME — Tampa</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <ChevronRight className="w-6 h-6 rotate-90" />
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Sidebar Steps */}
                    <div className="w-64 bg-slate-50 border-r border-slate-100 p-6 space-y-2 hidden md:block">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                            <div key={s} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${step === s ? 'bg-white shadow-sm border border-slate-200' : 'opacity-40'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${step === s ? 'bg-advent-navy text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    {s}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                                    {getStepTitle(s)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Form Area */}
                    <div className="flex-1 overflow-y-auto p-8 relative">
                        <div className="max-w-2xl mx-auto space-y-8">
                            <div className="space-y-2">
                                <h4 className="text-2xl font-black text-slate-900 leading-tight">
                                    {getStepTitle(step)}
                                </h4>
                                <p className="text-slate-500 text-sm font-medium">Follow the prompts below. Use the AI Assistant for guidance.</p>
                            </div>

                            {/* Render Inputs based on Step */}
                            {renderStep(step, formData, setFormData, askAI, directory)}

                            {/* AI Advice Panel */}
                            {aiAdvice && (
                                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex gap-3 animate-in slide-in-from-bottom-2">
                                    <div className="shrink-0 pt-1">
                                        <Bot className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">AI Consultant Insight</p>
                                        <p className="text-xs font-medium text-emerald-800 leading-relaxed italic">"{aiAdvice}"</p>
                                    </div>
                                </div>
                            )}

                            {aiLoading && (
                                <div className="flex items-center gap-2 text-slate-300 animate-pulse">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Consulting Knowledge Base...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <button
                        onClick={handlePrev}
                        disabled={step === 1}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all disabled:opacity-30"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </button>

                    <div className="flex gap-4">
                        {step < 8 ? (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 bg-advent-navy text-white px-10 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-advent-cobalt transition-all shadow-lg shadow-advent-navy/10"
                            >
                                Next Section
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-emerald-600 text-white px-10 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Generate & Save Protocol
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function getStepTitle(s: number) {
    const titles = ["Information", "Project Overview", "Background", "Outcomes & Aim", "Design & Setting", "Interventions", "Measures", "Review & Export"];
    return titles[s - 1];
}

function renderStep(step: number, data: ProtocolData, setData: any, askAI: any, directory: any[]) {
    const update = (field: keyof ProtocolData, val: any) => setData({ ...data, [field]: val });

    const settings = ["Inpatient (General Wards)", "Inpatient (ICU)", "Outpatient (Clinic)", "Emergency Department", "Surgery / OR", "AdventHealth Imaging", "Other"];
    const irbOptions = ["QI/Not Human Subjects Research", "IRB Review Needed", "IRB Approved (#)"];

    switch (step) {
        case 1:
            return (
                <div className="space-y-6">
                    <DirectorySelect
                        label="Principal Investigator (Resident)"
                        value={data.pi}
                        onChange={v => update("pi", v)}
                        options={directory}
                    />
                    <DirectorySelect
                        label="Co-Investigators (Residents/Students)"
                        value={data.coInvestigators}
                        onChange={v => update("coInvestigators", v)}
                        options={directory}
                        isMulti={true}
                    />
                    <DirectorySelect
                        label="Faculty Mentor"
                        value={data.mentor}
                        onChange={v => update("mentor", v)}
                        options={directory}
                    />
                    <SelectField
                        label="Clinical Site / Setting"
                        value={data.setting}
                        options={settings}
                        onChange={v => update("setting", v)}
                    />
                    <SelectField
                        label="IRB / QI Determination"
                        value={data.irbStatus}
                        options={irbOptions}
                        onChange={v => update("irbStatus", v)}
                    />
                </div>
            );
        case 2:
            return (
                <div className="space-y-6">
                    <TextArea label="The Problem" value={data.problem} onChange={v => update("problem", v)} placeholder="Briefly describe the gap in care..." onAsk={() => askAI("Problem Identification")} />
                    <InputField label="Target Population" value={data.targetPop} onChange={v => update("targetPop", v)} placeholder="e.g., Adults with CHF" />
                </div>
            );
        case 3:
            return (
                <div className="space-y-6">
                    <TextArea label="Background & Rationale" value={data.background} onChange={v => update("background", v)} placeholder="Why does this matter?" onAsk={() => askAI("Background Review")} />
                    <TextArea label="Baseline Data" value={data.baselineData} onChange={v => update("baselineData", v)} placeholder="What is the current status?" />
                </div>
            );
        case 4:
            return (
                <div className="space-y-6">
                    <TextArea label="SMART Aim Statement" value={data.aim} onChange={v => update("aim", v)} placeholder="Specific, Measurable, Achievable, Relevant, Time-bound" onAsk={() => askAI("SMART Aim Construction")} />
                </div>
            );
        case 5:
            return (
                <div className="space-y-6">
                    <InputField label="QI Design" value={data.design} onChange={v => update("design", v)} placeholder="e.g. PDSA, Lean" />
                    <TextArea label="Design Description" value={data.designDesc} onChange={v => update("designDesc", v)} placeholder="Why does this fit?" />
                </div>
            );
        case 6:
            return (
                <div className="space-y-6">
                    <TextArea label="Interventions" value={data.interventionsDesc} onChange={v => update("interventionsDesc", v)} placeholder="Describe each step..." onAsk={() => askAI("Implementation Strategy")} />
                </div>
            );
        case 7:
            return (
                <div className="space-y-6">
                    <TextArea label="Primary Outcome Measure" value={data.outcomeMeasure} onChange={v => update("outcomeMeasure", v)} placeholder="How do we help patients?" onAsk={() => askAI("Selecting QI Metrics")} />
                    <TextArea label="Process Measure" value={data.processMeasure} onChange={v => update("processMeasure", v)} placeholder="What are we doing?" />
                </div>
            );
        case 8:
            return (
                <div className="space-y-6 text-center py-12">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-advent-navy">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h5 className="text-xl font-black text-slate-900">Ready to Finalize</h5>
                    <p className="text-slate-500 font-medium">Please review all sections. Clicking below will generate your standardized Word document and secure it in the project cloud folder.</p>
                </div>
            );
        default:
            return null;
    }
}

function InputField({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue font-bold text-slate-700 transition-all"
            />
        </div>
    );
}

function SelectField({ label, value, options, onChange }: { label: string, value: string, options: string[], onChange: (v: string) => void }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue font-bold text-slate-700 transition-all appearance-none"
            >
                <option value="">Select Option...</option>
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    );
}

function DirectorySelect({ label, value, options, onChange, isMulti = false }: { label: string, value: string, options: any[], onChange: (v: string) => void, isMulti?: boolean }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
            <input
                list={`list-${label.replace(/\s+/g, '')}`}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder="Search name..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue font-bold text-slate-700 transition-all"
            />
            <datalist id={`list-${label.replace(/\s+/g, '')}`}>
                {options.map(opt => (
                    <option key={opt.email} value={opt.name}>{opt.email}</option>
                ))}
            </datalist>
            {isMulti && <p className="text-[9px] font-medium text-slate-400 italic mt-1 ml-1">Separate multiple names with commas.</p>}
        </div>
    );
}

function TextArea({ label, value, onChange, placeholder, onAsk }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, onAsk?: () => void }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
                {onAsk && (
                    <button onClick={onAsk} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-advent-blue bg-advent-blue/5 px-2.5 py-1 rounded-lg hover:bg-advent-blue/10 transition-all border border-advent-blue/10">
                        <Sparkles className="w-3 h-3" />
                        AI Helper
                    </button>
                )}
            </div>
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                rows={4}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue font-bold text-slate-700 transition-all resize-none"
            />
        </div>
    );
}
