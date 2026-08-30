"use client"

import { useState, useEffect } from "react";
import {
    FileText, Sparkles, Loader2, ChevronRight, ChevronLeft,
    Save, Download, CheckCircle, Bot, Plus, Trash2, HelpCircle
} from "lucide-react";
import { getProtocolSectionAdvice } from "@/utils/ai";
import { PROTOCOL_GUIDANCE, SUBMISSION_CHECKLIST } from "@/constants/protocolGuidance";
import { uploadProjectFile } from "@/utils/projectStorage";
import { sendEmail, TEMPLATES } from "@/utils/email";
import { generateProtocolDoc, ProtocolData } from "@/utils/protocolExport";
import { uploadToSharedFolder } from "@/utils/oneDrive";
import { createClient } from "@/utils/supabase/client";
import { useMsal } from "@azure/msal-react";
import { saveAs } from "file-saver";

interface ProtocolWizardProps {
    projectId: string;
    projectTitle: string;
    onClose: () => void;
    isRegistrationRequest?: boolean;
    onSaveSuccess?: () => void;
}

export default function ProtocolWizard({ projectId, projectTitle, onClose, isRegistrationRequest = false, onSaveSuccess }: ProtocolWizardProps) {
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiAdvice, setAiAdvice] = useState<string | null>(null);
    const [directory, setDirectory] = useState<{ name: string; email: string }[]>([]);
    
    // Detailed form data supporting the 14 GME Tampa sections
    const [formData, setFormData] = useState<ProtocolData>({
        title: projectTitle,
        setting: "",
        pi: "",
        coInvestigators: "",
        mentor: "",
        sponsor: "AdventHealth IM GME — Tampa, FL",
        committee: "",
        irbStatus: "QI Exempt",
        irbNumber: "",

        // Section 1: Overview Matrix
        problem: "",
        aim: "",
        intervention: "",
        outcomeMeasure: "",
        processMeasure: "",
        balancingMeasure: "",
        targetPop: "",
        duration: "6 months",

        // Section 2: Background
        background: "",
        baselineData: "",
        evidence: "",
        evidenceGaps: "",
        citations: "",

        // Section 3: Outcomes
        outcomesTable: [
            { type: "Primary Outcome", def: "", source: "Epic chart review", target: "" }
        ],

        // Section 4: Methods
        design: "PDSA",
        designOtherText: "",
        designDesc: "Plan-Do-Study-Act cycles allow rapid testing of workflow changes on medicine wards.",
        settingDetails: "General Internal Medicine wards at AdventHealth Tampa.",
        popDetails: "Adult patients admitted to General Medicine services.",
        inclusionCriteria: "Age >= 18; admitted to general medicine units.",
        exclusionCriteria: "ICU admissions; comfort care / hospice status.",
        baselineTimeframe: "Pre-intervention window (e.g. Month 1)",
        postTimeframe: "Post-intervention tracking (e.g. Months 4-6)",

        // 4.3 Interventions
        chartReviewDesc: "",
        educationDesc: "",
        emrToolsDesc: "",
        responsibilitiesDesc: "",

        // 4.4 PDSA Cycles
        pdsaCycles: [
            { cycle: "PDSA 1", plan: "Huddle education with Team A residents.", do: "Implemented during morning sign-out.", study: "Track order completion rates.", act: "Refine checklist and roll out to Team B." }
        ],

        // Section 5: Measures
        measuresTable: [
            { measure: "Primary Measure", type: "Outcome", def: "", denNum: "", freq: "Weekly", source: "Epic chart review" }
        ],
        epicReviewSource: true,
        registrySource: false,
        surveySource: false,
        otherSource: false,
        otherSourceText: "",
        dataAbstractionPlan: "PI and co-investigators will perform retrospective and prospective electronic chart audits using a standardized template in OneDrive.",

        // Section 6: HIPAA & Security
        spreadsheetFile: true,
        pdfFile: false,
        redcapFile: false,
        otherFile: false,
        otherFileText: "",
        dataManagementDetails: "All data stored on HIPAA-compliant AdventHealth OneDrive. Only investigators have access. Patient MRN is used; no names or direct identifiers.",

        // Section 7: Timeline
        timelineChart: [
            { phase: "Retrospective chart/source review (Month 1)", dates: "", owner: "", deliverable: "Baseline data" },
            { phase: "Patient outreach & education (Month 2-3)", dates: "", owner: "", deliverable: "Education rollout" },
            { phase: "Intervention implementation (Month 3-5)", dates: "", owner: "", deliverable: "Active intervention" },
            { phase: "Post-intervention data collection/analysis (Month 6)", dates: "", owner: "", deliverable: "Final metrics" },
            { phase: "Presentation/poster preparation", dates: "", owner: "", deliverable: "QI Conference Poster" }
        ],
        meetingMonthly: true,
        meetingBiweekly: false,
        meetingOther: false,
        meetingOtherText: "",

        // 7.1 Investigator Tasks
        tasksTable: [
            { investigator: "", role: "Principal Investigator", tasks: "Data abstraction, coordination, draft protocol", dates: "" }
        ],

        // Section 8: Analysis Plan
        excelAnalysis: true,
        epicAnalysis: false,
        pythonAnalysis: false,
        otherAnalysis: false,
        otherAnalysisText: "",
        analysisPlan: "Descriptive statistics (percentages, means) will summarize inclusion/exclusion cohorts. Run charts will display weekly compliance percentages to evaluate trend shifts using standard run chart rules.",

        // Section 9: Results Plan
        resultsPlan: "Metrics will be summarized in tabular and graphical formats (run charts). No PHI will be shared outside the direct clinical registry.",

        // Section 10: Discussion
        discussionText: "",
        sustainability: "Handoff to incoming resident quality leaders; EMR tools will remain active; unit charge nurses will own daily audits.",

        // Section 11: Ethical
        ethical: "Minimal expected risk. This study constitutes quality improvement surveillance of standard healthcare delivery and does not expose patients to experimental therapies.",

        // Section 12: Funding
        fundingNone: true,
        fundingDept: false,
        fundingGrant: false,
        fundingOther: false,
        fundingOtherText: "",
        stipendsNone: true,
        stipendsYes: false,
        stipendsText: "",
        materialsNeeded: "",

        // Section 13: Dissemination
        dissemination: "QI presentation (5 minutes) at the local Quality Initiative Conference and abstract submission to GME Research Day.",

        // Section 14: References
        references: "1. Standards for Quality Improvement Reporting Excellence (SQUIRE 2.0) guidelines.\n2. Institute for Healthcare Improvement (IHI) Quality Improvement Toolkit."
    });

    const supabase = createClient();
    const { instance, accounts } = useMsal();

    // 1. Retrieve directory of residents / faculty autocompletes
    useEffect(() => {
        const fetchDirectory = async () => {
            const { data } = await supabase.from('directory').select('name, email').order('name');
            if (data) setDirectory(data);
        };
        fetchDirectory();
    }, [supabase]);

    // 2. Draft recovery using Database or localStorage
    useEffect(() => {
        const fetchRegistrationDraft = async () => {
            if (isRegistrationRequest && projectId) {
                const { data, error } = await supabase
                    .from('project_registration_requests')
                    .select('*')
                    .eq('id', projectId)
                    .single();
                if (data && data.protocol_data) {
                    setFormData(prev => ({ ...prev, ...data.protocol_data }));
                } else if (error) {
                    console.error("Error loading registration request draft:", error);
                }
            } else {
                const cached = localStorage.getItem(`qi_protocol_draft_${projectId}`);
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        setFormData(prev => ({ ...prev, ...parsed }));
                    } catch (e) {
                        console.error("Error loading protocol cache:", e);
                    }
                }
            }
        };
        fetchRegistrationDraft();
    }, [projectId, isRegistrationRequest, supabase]);

    const handleFieldChange = (updated: Partial<ProtocolData>) => {
        const next = { ...formData, ...updated };
        setFormData(next);
        localStorage.setItem(`qi_protocol_draft_${projectId}`, JSON.stringify(next));
    };

    const handleNext = () => setStep(s => Math.min(8, s + 1));
    const handlePrev = () => setStep(s => Math.max(1, s - 1));

    const askAI = async (sectionName: string, guidancePrompt: string) => {
        setAiLoading(true);
        setAiAdvice(null);
        try {
            const context = `For a Quality Improvement project titled "${projectTitle}". Help me fill out: ${sectionName}. Instruction details: ${guidancePrompt}.`;
            const advice = await getProtocolSectionAdvice(sectionName, context);
            setAiAdvice(advice);
        } catch (e) {
            setAiAdvice("Failed to retrieve AI advice. Please describe your project aim or settings in more detail.");
        } finally {
            setAiLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const blob = await generateProtocolDoc(formData);
            const fileName = `Official_QI_Protocol_${projectTitle.replace(/\s+/g, '_')}.docx`;

            // 1. Download document locally for immediate access
            saveAs(blob, fileName);

            if (isRegistrationRequest) {
                // Save to project_registration_requests
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("User not authenticated");

                // Find the mentor's profiles.id by matching name
                let mentorId: string | null = null;
                if (formData.mentor) {
                    const { data: mentorProfile } = await supabase
                        .from('profiles')
                        .select('id')
                        .ilike('full_name', `%${formData.mentor}%`)
                        .limit(1)
                        .maybeSingle();
                    if (mentorProfile) {
                        mentorId = mentorProfile.id;
                    }
                }

                // Update the project_registration_requests table
                const { error: updateError } = await supabase
                    .from('project_registration_requests')
                    .update({
                        title: formData.title || projectTitle,
                        smart_aim: formData.aim || null,
                        squire_rationale: formData.problem || null,
                        protocol_data: formData as any,
                        faculty: formData.mentor || null,
                        faculty_id: mentorId,
                        mentor_approval_status: 'pending',
                        gme_approval_status: 'pending',
                        status: 'pending',
                        reviewer_feedback: null, // Reset feedback on re-submission
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', projectId);

                if (updateError) throw updateError;

                await notifyMentor(formData.mentor, formData.title || projectTitle, null);
                alert("Success! Your official 14-section QI Protocol has been updated and submitted for dual-sponsorship review. Your faculty mentor has been notified.");
                localStorage.removeItem(`qi_protocol_draft_${projectId}`);
                if (onSaveSuccess) onSaveSuccess();
                onClose();
            } else {
                // 2a. Store the protocol in-app first. OneDrive below is best-effort
                // and frequently blocked; without this the document existed only in
                // the Downloads folder of whoever generated it.
                let storagePath: string | null = null;
                try {
                    const stored = await uploadProjectFile(
                        projectId,
                        fileName,
                        blob,
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    );
                    storagePath = stored.storagePath;
                } catch (err) {
                    console.error("In-app storage upload failed:", err);
                }

                // 2b. Attempt direct upload to shared OneDrive folders
                let oneDriveUrl = "";
                try {
                    const { url } = await uploadToSharedFolder(
                        instance,
                        accounts[0],
                        projectTitle,
                        fileName,
                        blob,
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    );
                    oneDriveUrl = url;
                } catch (err) {
                    console.warn("Direct OneDrive upload bypassed or blocked:", err);
                }

                // 3. Save to database profiles & project_files
                const { data: { user } } = await supabase.auth.getUser();
                const { data: profile } = user
                    ? await supabase.from('profiles').select('id, full_name').eq('id', user.id).single()
                    : { data: null };

                await Promise.all([
                    supabase.from('project_files').insert({
                        project_id: projectId,
                        file_name: fileName,
                        file_type: 'docx',
                        file_url: oneDriveUrl || null,
                        storage_path: storagePath,
                        uploaded_by: profile?.id ?? null,
                        uploaded_by_name: profile?.full_name ?? null,
                    }),
                    supabase.from('projects').update({ 
                        protocol_url: oneDriveUrl || null,
                        status: 'Active'
                    }).eq('id', projectId),
                ]);

                await notifyMentor(formData.mentor, formData.title || projectTitle, profile?.full_name ?? null);

                alert(
                    storagePath
                        ? "Success! Your 14-section QI Protocol has been generated, downloaded, and stored on the project. Your faculty mentor has been notified."
                        : "Your protocol was generated and downloaded, but could not be stored on the project. Please re-run the export or contact the QI office."
                );
                localStorage.removeItem(`qi_protocol_draft_${projectId}`);
                if (onSaveSuccess) onSaveSuccess();
                onClose();
            }
        } catch (error: any) {
            alert("Export error: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-6xl h-[92vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100">
                
                {/* Header */}
                <div className="px-8 py-5 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-advent-blue to-indigo-600 rounded-2xl shadow-lg">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <span className="inline-flex items-center gap-1.5 bg-advent-blue/20 text-advent-blue text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-advent-blue/30 mb-0.5">
                                GME Tampa Academic Template
                            </span>
                            <h3 className="text-base font-black tracking-tight text-white">Institutional QI Protocol Wizard</h3>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest"
                    >
                        Close
                    </button>
                </div>

                {/* Body Area */}
                <div className="flex-1 overflow-hidden flex">
                    
                    {/* Navigation Sidebar */}
                    <div className="w-72 bg-slate-50 border-r border-slate-200/50 p-6 flex flex-col justify-between hidden lg:flex">
                        <div className="space-y-1.5">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-3">Sections Roadmap</div>
                            {[
                                { s: 1, title: "1. Cover & Mentors" },
                                { s: 2, title: "2. Project Overview Matrix" },
                                { s: 3, title: "3. Background & Citations" },
                                { s: 4, title: "4. Study Outcomes" },
                                { s: 5, title: "5. Methods & PDSA" },
                                { s: 6, title: "6. Measures & HIPAA" },
                                { s: 7, title: "7. Timeline & Tasks" },
                                { s: 8, title: "8. Analysis & Dissemination" }
                            ].map(item => (
                                <button
                                    key={item.s}
                                    onClick={() => setStep(item.s)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left border ${
                                        step === item.s 
                                            ? 'bg-white text-advent-navy border-slate-200 shadow-sm font-black' 
                                            : 'border-transparent hover:bg-slate-100/60 text-slate-500 font-bold'
                                    }`}
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                                        step === item.s 
                                            ? 'bg-slate-900 text-white font-black' 
                                            : 'bg-slate-200 text-slate-500'
                                    }`}>
                                        {item.s}
                                    </div>
                                    <span className="text-[10.5px] uppercase tracking-wider">{item.title}</span>
                                </button>
                            ))}
                        </div>

                        <div className="bg-slate-900/5 p-4 rounded-2xl border border-slate-200/40">
                            <div className="flex items-center gap-2 mb-1.5">
                                <HelpCircle className="w-4 h-4 text-advent-navy" />
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Need Help?</span>
                            </div>
                            <p className="text-[10px] leading-relaxed text-slate-500 font-semibold">
                                Use the floating "AI Helper" prompts inside each field to pull up localized evidence or SMART Aim builders.
                            </p>
                        </div>
                    </div>

                    {/* Form Area */}
                    <div className="flex-1 overflow-y-auto bg-slate-50/30 p-8 xl:p-12">
                        <div className="max-w-3xl mx-auto space-y-8">
                            
                            {/* Render step forms */}
                            {/* The Word template carries instructions for every section.
                                Without them residents filled labelled boxes with no
                                explanation of what belonged in each. */}
                            <SectionGuidance step={step} />

                            {renderWizardStep(step, formData, handleFieldChange, askAI, directory)}

                            {step === 8 && <SubmissionChecklist data={formData} />}

                            {/* Floating AI Helper Panel */}
                            {aiAdvice && (
                                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex gap-4 border border-slate-800 animate-in slide-in-from-bottom-3 duration-500">
                                    <div className="shrink-0 pt-0.5">
                                        <div className="p-2 bg-advent-blue/20 rounded-xl border border-advent-blue/30">
                                            <Bot className="w-5 h-5 text-advent-blue" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-advent-blue">AI Academic Advisor</p>
                                            <button 
                                                onClick={() => setAiAdvice(null)}
                                                className="text-[9px] font-black uppercase text-slate-400 hover:text-white"
                                            >
                                                Dismiss
                                            </button>
                                        </div>
                                        <p className="text-xs leading-relaxed font-medium text-slate-300">{aiAdvice}</p>
                                    </div>
                                </div>
                            )}

                            {aiLoading && (
                                <div className="flex items-center gap-3 text-slate-400 animate-pulse px-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-advent-blue" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Consulting Academic Repositories...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Toolbar */}
                <div className="px-8 py-5 bg-white border-t border-slate-200/60 flex justify-between items-center">
                    <button
                        onClick={handlePrev}
                        disabled={step === 1}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl text-slate-500 font-bold uppercase tracking-wider text-xs hover:bg-slate-50 transition-all disabled:opacity-30 border border-slate-200/50"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous Section
                    </button>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 mr-2">Section {step} of 8</span>
                        {step < 8 ? (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-md"
                            >
                                Next Section
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-lg shadow-emerald-600/10 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {isRegistrationRequest ? "Save & Submit Protocol" : "Generate Word Protocol (.docx)"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Sub-step layout rendering
function renderWizardStep(
    step: number,
    data: ProtocolData,
    onChange: (updated: Partial<ProtocolData>) => void,
    askAI: (sec: string, prompt: string) => void,
    directory: any[]
) {
    const update = (field: keyof ProtocolData, val: any) => onChange({ [field]: val });

    const settings = ["Inpatient (General Wards)", "Inpatient (ICU)", "Outpatient (Clinic)", "Emergency Department", "Surgery / OR", "AdventHealth Imaging", "Other"];
    const irbOptions = ["QI Exempt", "IRB Review Needed", "Approved"];

    switch (step) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="space-y-1 border-b border-slate-100 pb-4">
                        <h4 className="text-xl font-black text-slate-900">Clinical Setting & Investigator Directory</h4>
                        <p className="text-xs text-slate-500 font-semibold">Ensure all co-investigators and mentors are correctly mapped for the cover sheet.</p>
                    </div>

                    <InputField 
                        label="Project Title" 
                        value={data.title} 
                        onChange={v => update("title", v)} 
                        placeholder="Study Title..." 
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DirectorySelect 
                            label="Principal Investigator (Resident)" 
                            value={data.pi} 
                            onChange={v => update("pi", v)} 
                            options={directory} 
                        />
                        <DirectorySelect 
                            label="Faculty Mentor" 
                            value={data.mentor} 
                            onChange={v => update("mentor", v)} 
                            options={directory} 
                        />
                    </div>

                    <DirectoryMultiSelect
                        label="Co-Investigators (Residents/Students)"
                        value={data.coInvestigators}
                        onChange={v => update("coInvestigators", v)}
                        options={directory}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SelectField 
                            label="Site Setting" 
                            value={data.setting} 
                            options={settings} 
                            onChange={v => update("setting", v)} 
                        />
                        <SelectField 
                            label="IRB Status" 
                            value={data.irbStatus} 
                            options={irbOptions} 
                            onChange={v => update("irbStatus", v)} 
                        />
                    </div>

                    {data.irbStatus === "Approved" && (
                        <InputField 
                            label="IRB Approval Number" 
                            value={data.irbNumber} 
                            onChange={v => update("irbNumber", v)} 
                            placeholder="e.g. IRB-100293" 
                        />
                    )}
                </div>
            );

        case 2:
            return (
                <div className="space-y-6">
                    <div className="space-y-1 border-b border-slate-100 pb-4">
                        <h4 className="text-xl font-black text-slate-900">Section 1: SQUIRE Overview Response Matrix</h4>
                        <p className="text-xs text-slate-500 font-semibold font-semibold">These inputs generate the high-density grid summarizing the project on page 1.</p>
                    </div>

                    <TextArea 
                        label="Problem Statement" 
                        value={data.problem} 
                        onChange={v => update("problem", v)} 
                        placeholder="In 1-2 sentences, what clinical gap or quality issue are you addressing?"
                        onAsk={() => askAI("Problem Definition", "Draft a 1-2 sentence clinical problem statement about patient safety, costs, or efficiency gaps.")}
                    />

                    <TextArea 
                        label="Primary Intervention" 
                        value={data.intervention} 
                        onChange={v => update("intervention", v)} 
                        placeholder="What specific workflow, education, or EMR changes are you deploying?"
                        onAsk={() => askAI("Intervention Rationale", "Draft a primary intervention summary covering EMR build parameters and staff education huddles.")}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField 
                            label="Target Patient Population" 
                            value={data.targetPop} 
                            onChange={v => update("targetPop", v)} 
                            placeholder="e.g., Adults >= 65 on telemetry" 
                        />
                        <InputField 
                            label="Estimated Duration (months)" 
                            value={data.duration} 
                            onChange={v => update("duration", v)} 
                            placeholder="e.g. 6 months" 
                        />
                    </div>
                </div>
            );

        case 3:
            return (
                <div className="space-y-6">
                    <div className="space-y-1 border-b border-slate-100 pb-4">
                        <h4 className="text-xl font-black text-slate-900">Section 2: Background & Evidence-Based Rationale</h4>
                        <p className="text-xs text-slate-500 font-semibold">Provide clinical context and refer to standard societal guidelines (ACP, CHEST, CDC, etc.).</p>
                    </div>

                    <TextArea 
                        label="Clinical Problem & Impact" 
                        value={data.background} 
                        onChange={v => update("background", v)} 
                        placeholder="Why does this matter? (Costs, patient safety, device-days, readmission risk...)"
                        onAsk={() => askAI("Clinical Significance", "Help me compile an academic background review with national references regarding the problem.")}
                    />

                    <TextArea 
                        label="Local Baseline Data (Current Status)" 
                        value={data.baselineData} 
                        onChange={v => update("baselineData", v)} 
                        placeholder="Describe the current status at your setting. What is the baseline compliance rate?"
                    />

                    <TextArea 
                        label="Evidence & Gap Analysis" 
                        value={data.evidence} 
                        onChange={v => update("evidence", v)} 
                        placeholder="What guideline or study supports your change? What barriers did previous teams face?"
                        onAsk={() => askAI("Evidence Base", "Suggest key consensus guidelines or evidence gaps supporting this type of clinical intervention.")}
                    />

                    <TextArea 
                        label="References (Minimum of 3)" 
                        value={data.references} 
                        onChange={v => update("references", v)} 
                        placeholder="1. Journal reference / Organization guideline..."
                    />
                </div>
            );

        case 4:
            return (
                <div className="space-y-6">
                    <div className="space-y-1 border-b border-slate-100 pb-4">
                        <h4 className="text-xl font-black text-slate-900">Section 3: Study Outcomes Table</h4>
                        <p className="text-xs text-slate-500 font-semibold">Specify the definition and metrics targets. Add rows for secondary outcomes.</p>
                    </div>

                    <TextArea 
                        label="SMART Aim Statement" 
                        value={data.aim} 
                        onChange={v => update("aim", v)} 
                        placeholder="Increase/Decrease [outcome] from [baseline] to [target] by [date] on [unit]..."
                        onAsk={() => askAI("SMART Goal", "Write a precise, time-bound SMART aim statement using a baseline of 35% and a target of 70% in 6 months.")}
                    />

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Outcomes Grid</label>
                            <button
                                onClick={() => update("outcomesTable", [...data.outcomesTable, { type: "Secondary Outcome", def: "", source: "", target: "" }])}
                                className="flex items-center gap-1 text-[9px] font-black uppercase text-advent-navy bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Outcome
                            </button>
                        </div>

                        <div className="space-y-4">
                            {data.outcomesTable.map((row, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-3xs space-y-4 relative">
                                    <div className="absolute top-4 right-4">
                                        {data.outcomesTable.length > 1 && (
                                            <button 
                                                onClick={() => update("outcomesTable", data.outcomesTable.filter((_, i) => i !== idx))}
                                                className="text-rose-500 hover:text-rose-600 transition-colors p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        <div>
                                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Type</label>
                                            <input 
                                                type="text" 
                                                value={row.type} 
                                                onChange={e => {
                                                    const next = [...data.outcomesTable];
                                                    next[idx].type = e.target.value;
                                                    update("outcomesTable", next);
                                                }}
                                                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs" 
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Target Value</label>
                                            <input 
                                                type="text" 
                                                value={row.target} 
                                                onChange={e => {
                                                    const next = [...data.outcomesTable];
                                                    next[idx].target = e.target.value;
                                                    update("outcomesTable", next);
                                                }}
                                                placeholder="e.g. Compliance >= 80%"
                                                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs" 
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Operational Definition</label>
                                            <input 
                                                type="text" 
                                                value={row.def} 
                                                onChange={e => {
                                                    const next = [...data.outcomesTable];
                                                    next[idx].def = e.target.value;
                                                    update("outcomesTable", next);
                                                }}
                                                placeholder="Describe how it is computed..."
                                                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs" 
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Data Source</label>
                                            <input 
                                                type="text" 
                                                value={row.source} 
                                                onChange={e => {
                                                    const next = [...data.outcomesTable];
                                                    next[idx].source = e.target.value;
                                                    update("outcomesTable", next);
                                                }}
                                                placeholder="e.g. Epic Reporting"
                                                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case 5:
            return (
                <div className="space-y-6">
                    <div className="space-y-1 border-b border-slate-100 pb-4">
                        <h4 className="text-xl font-black text-slate-900">Section 4: Methods & PDSA Design</h4>
                        <p className="text-xs text-slate-500 font-semibold">Define your QI framework, inclusion/exclusion criteria, and intervention cycles.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SelectField 
                            label="QI Framework Design" 
                            value={data.design} 
                            options={["PDSA", "Lean", "Six Sigma", "Other"]} 
                            onChange={v => update("design", v)} 
                        />
                        {data.design === "Other" && (
                            <InputField 
                                label="Specify Framework" 
                                value={data.designOtherText} 
                                onChange={v => update("designOtherText", v)} 
                            />
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Site/Unit Location" value={data.settingDetails} onChange={v => update("settingDetails", v)} />
                        <InputField label="Stakeholders Affected" value={data.popDetails} onChange={v => update("popDetails", v)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TextArea label="Inclusion Criteria" value={data.inclusionCriteria} onChange={v => update("inclusionCriteria", v)} placeholder="Which patient charts to count?" />
                        <TextArea label="Exclusion Criteria" value={data.exclusionCriteria} onChange={v => update("exclusionCriteria", v)} placeholder="Which patient charts to filter?" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Pre-Intervention Baseline Dates" value={data.baselineTimeframe} onChange={v => update("baselineTimeframe", v)} placeholder="e.g. March 1 - March 31" />
                        <InputField label="Post-Intervention Tracking Dates" value={data.postTimeframe} onChange={v => update("postTimeframe", v)} placeholder="e.g. April 1 - Sept 30" />
                    </div>

                    <TextArea 
                        label="Workflow changes / EMR tools" 
                        value={data.emrToolsDesc} 
                        onChange={v => update("emrToolsDesc", v)} 
                        placeholder="Detail Epic adjustments, smart phrases (.glycemicrounds), or nurse workflow checklists."
                        onAsk={() => askAI("EMR Optimization", "Draft EMR optimization workflow intervention steps, such as hard-stop timers or automated order sets.")}
                    />

                    {/* PDSA cycles table editor */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plan-Do-Study-Act Iterations</label>
                            <button
                                onClick={() => update("pdsaCycles", [...data.pdsaCycles, { cycle: `PDSA ${data.pdsaCycles.length + 1}`, plan: "", do: "", study: "", act: "" }])}
                                className="flex items-center gap-1 text-[9px] font-black uppercase text-advent-navy bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add PDSA Cycle
                            </button>
                        </div>

                        <div className="space-y-4">
                            {data.pdsaCycles.map((cycle, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-3xs space-y-3 relative">
                                    <div className="absolute top-4 right-4">
                                        {data.pdsaCycles.length > 1 && (
                                            <button 
                                                onClick={() => update("pdsaCycles", data.pdsaCycles.filter((_, i) => i !== idx))}
                                                className="text-rose-500 hover:text-rose-600 transition-colors p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="font-black text-slate-800 text-xs">{cycle.cycle} Details</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <TextArea 
                                            label="Plan (What change?)" 
                                            value={cycle.plan} 
                                            onChange={v => {
                                                const next = [...data.pdsaCycles];
                                                next[idx].plan = v;
                                                update("pdsaCycles", next);
                                            }}
                                        />
                                        <TextArea 
                                            label="Do (Who/where?)" 
                                            value={cycle.do} 
                                            onChange={v => {
                                                const next = [...data.pdsaCycles];
                                                next[idx].do = v;
                                                update("pdsaCycles", next);
                                            }}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <TextArea 
                                            label="Study (What data?)" 
                                            value={cycle.study} 
                                            onChange={v => {
                                                const next = [...data.pdsaCycles];
                                                next[idx].study = v;
                                                update("pdsaCycles", next);
                                            }}
                                        />
                                        <TextArea 
                                            label="Act (Next step?)" 
                                            value={cycle.act} 
                                            onChange={v => {
                                                const next = [...data.pdsaCycles];
                                                next[idx].act = v;
                                                update("pdsaCycles", next);
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case 6:
            return (
                <div className="space-y-6">
                    <div className="space-y-1 border-b border-slate-100 pb-4">
                        <h4 className="text-xl font-black text-slate-900">Section 5: Family of Measures & HIPAA</h4>
                        <p className="text-xs text-slate-500 font-semibold">Balance outcome measures, process controls, and risk balancing metrics.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Measures Grid</label>
                            <button
                                onClick={() => update("measuresTable", [...data.measuresTable, { measure: "", type: "Process", def: "", denNum: "", freq: "Weekly", source: "" }])}
                                className="flex items-center gap-1 text-[9px] font-black uppercase text-advent-navy bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Measure
                            </button>
                        </div>

                        <div className="space-y-4">
                            {data.measuresTable.map((m, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-3xs space-y-4 relative">
                                    <div className="absolute top-4 right-4">
                                        {data.measuresTable.length > 1 && (
                                            <button 
                                                onClick={() => update("measuresTable", data.measuresTable.filter((_, i) => i !== idx))}
                                                className="text-rose-500 hover:text-rose-600 transition-colors p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                        <div>
                                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Measure Name</label>
                                            <input 
                                                type="text" 
                                                value={m.measure} 
                                                onChange={e => {
                                                    const next = [...data.measuresTable];
                                                    next[idx].measure = e.target.value;
                                                    update("measuresTable", next);
                                                }}
                                                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs" 
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Type</label>
                                            <select
                                                value={m.type}
                                                onChange={e => {
                                                    const next = [...data.measuresTable];
                                                    next[idx].type = e.target.value;
                                                    update("measuresTable", next);
                                                }}
                                                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs"
                                            >
                                                <option value="Outcome">Outcome</option>
                                                <option value="Process">Process</option>
                                                <option value="Balancing">Balancing</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Frequency</label>
                                            <input 
                                                type="text" 
                                                value={m.freq} 
                                                onChange={e => {
                                                    const next = [...data.measuresTable];
                                                    next[idx].freq = e.target.value;
                                                    update("measuresTable", next);
                                                }}
                                                placeholder="e.g. Monthly"
                                                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs" 
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Numerator / Denominator Formula</label>
                                            <input 
                                                type="text" 
                                                value={m.denNum} 
                                                onChange={e => {
                                                    const next = [...data.measuresTable];
                                                    next[idx].denNum = e.target.value;
                                                    update("measuresTable", next);
                                                }}
                                                placeholder="Num: [x]; Den: [y]"
                                                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs" 
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Operational Definition / Audit instructions</label>
                                            <input 
                                                type="text" 
                                                value={m.def} 
                                                onChange={e => {
                                                    const next = [...data.measuresTable];
                                                    next[idx].def = e.target.value;
                                                    update("measuresTable", next);
                                                }}
                                                placeholder="Specific criteria..."
                                                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Source Type</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <CheckboxField label="Epic Reviews" checked={data.epicReviewSource} onChange={v => update("epicReviewSource", v)} />
                            <CheckboxField label="Registry Database" checked={data.registrySource} onChange={v => update("registrySource", v)} />
                            <CheckboxField label="Surveys" checked={data.surveySource} onChange={v => update("surveySource", v)} />
                            <CheckboxField label="Other" checked={data.otherSource} onChange={v => update("otherSource", v)} />
                        </div>
                        {data.otherSource && (
                            <InputField label="Specify Other Source" value={data.otherSourceText} onChange={v => update("otherSourceText", v)} />
                        )}
                    </div>

                    <div className="space-y-1 border-t border-slate-100 pt-6">
                        <h5 className="font-bold text-slate-800 text-sm">HIPAA & Clinical Data Security</h5>
                        <p className="text-xs text-slate-500 font-semibold mb-3">Limit spreadsheet identifiers to MRNs only. Store on AdventHealth OneDrive.</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
                            <CheckboxField label="Spreadsheets" checked={data.spreadsheetFile} onChange={v => update("spreadsheetFile", v)} />
                            <CheckboxField label="PDF Archives" checked={data.pdfFile} onChange={v => update("pdfFile", v)} />
                            <CheckboxField label="REDCap" checked={data.redcapFile} onChange={v => update("redcapFile", v)} />
                            <CheckboxField label="Other Files" checked={data.otherFile} onChange={v => update("otherFile", v)} />
                        </div>
                        <TextArea label="Data Security & Audit details" value={data.dataManagementDetails} onChange={v => update("dataManagementDetails", v)} />
                    </div>
                </div>
            );

        case 7:
            return (
                <div className="space-y-6">
                    <div className="space-y-1 border-b border-slate-100 pb-4">
                        <h4 className="text-xl font-black text-slate-900">Section 7: Timeline & Investigator Tasks</h4>
                        <p className="text-xs text-slate-500 font-semibold font-semibold">Map out scheduled project phases, team meetings, and specific task owners.</p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Scheduled Milestones</label>
                        <div className="space-y-3">
                            {data.timelineChart.map((t, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-3xs flex flex-col md:flex-row gap-4 items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 w-full md:w-1/3 truncate">{t.phase}</span>
                                    <div className="flex gap-3 w-full md:w-2/3">
                                        <input 
                                            type="text" 
                                            value={t.dates}
                                            onChange={e => {
                                                const next = [...data.timelineChart];
                                                next[idx].dates = e.target.value;
                                                update("timelineChart", next);
                                            }}
                                            placeholder="Date range" 
                                            className="w-1/2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-[11px]" 
                                        />
                                        <input 
                                            type="text" 
                                            value={t.owner}
                                            onChange={e => {
                                                const next = [...data.timelineChart];
                                                next[idx].owner = e.target.value;
                                                update("timelineChart", next);
                                            }}
                                            placeholder="Owner initials" 
                                            className="w-1/2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-[11px]" 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3 pt-4">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">7.1 Specific Tasks per Investigator</label>
                            <button
                                onClick={() => update("tasksTable", [...data.tasksTable, { investigator: "", role: "Co-Investigator", tasks: "", dates: "" }])}
                                className="flex items-center gap-1 text-[9px] font-black uppercase text-advent-navy bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Team Assignment
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {data.tasksTable.map((t, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-3xs space-y-3 relative">
                                    <div className="absolute top-3 right-3">
                                        {data.tasksTable.length > 1 && (
                                            <button 
                                                onClick={() => update("tasksTable", data.tasksTable.filter((_, i) => i !== idx))}
                                                className="text-rose-500 hover:text-rose-600 transition-colors p-1"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                        <input 
                                            type="text" 
                                            value={t.investigator}
                                            onChange={e => {
                                                const next = [...data.tasksTable];
                                                next[idx].investigator = e.target.value;
                                                update("tasksTable", next);
                                            }}
                                            placeholder="Investigator name"
                                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-xs" 
                                        />
                                        <input 
                                            type="text" 
                                            value={t.role}
                                            onChange={e => {
                                                const next = [...data.tasksTable];
                                                next[idx].role = e.target.value;
                                                update("tasksTable", next);
                                            }}
                                            placeholder="Role"
                                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-xs" 
                                        />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={t.tasks}
                                        onChange={e => {
                                            const next = [...data.tasksTable];
                                            next[idx].tasks = e.target.value;
                                            update("tasksTable", next);
                                        }}
                                        placeholder="Assigned tasks (e.g. data audit, smartphrase design)"
                                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-xs" 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case 8:
            return (
                <div className="space-y-6">
                    <div className="space-y-1 border-b border-slate-100 pb-4">
                        <h4 className="text-xl font-black text-slate-900">Section 8-14: Analysis & Dissemination</h4>
                        <p className="text-xs text-slate-500 font-semibold font-semibold font-semibold">Final statistical tool selections, funding details, and local conference mappings.</p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Statistical Software</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <CheckboxField label="Microsoft Excel" checked={data.excelAnalysis} onChange={v => update("excelAnalysis", v)} />
                            <CheckboxField label="Epic Reports" checked={data.epicAnalysis} onChange={v => update("epicAnalysis", v)} />
                            <CheckboxField label="R / Python" checked={data.pythonAnalysis} onChange={v => update("pythonAnalysis", v)} />
                            <CheckboxField label="Other Tool" checked={data.otherAnalysis} onChange={v => update("otherAnalysis", v)} />
                        </div>
                    </div>

                    <TextArea 
                        label="Analysis Plan (Descriptive/Comparative)" 
                        value={data.analysisPlan} 
                        onChange={v => update("analysisPlan", v)} 
                        placeholder="Detail NNT calculations, average deviations, and baseline vs. post comparative metrics."
                        onAsk={() => askAI("Analysis Methodology", "Help me compile a statistics analysis plan tailored for general medical wards using Excel run charts.")}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                        <TextArea label="Sustainability Plan (10.1)" value={data.sustainability} onChange={v => update("sustainability", v)} placeholder="How will standard workflows be owned by nurses/clinicians after project graduation?" />
                        <TextArea label="Dissemination Mappings" value={data.dissemination} onChange={v => update("dissemination", v)} placeholder="Describe posters, oral presentations, or quality symposium drafts." />
                    </div>

                    <div className="bg-slate-900/5 p-6 rounded-3xl border border-slate-200/40 space-y-4 text-center mt-6">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-advent-navy">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <h5 className="text-sm font-black text-slate-800 uppercase tracking-wider">Ready for Academic Peer Review</h5>
                            <p className="text-[11px] leading-relaxed text-slate-500 font-semibold px-4">
                                Excellent progress! By generating the protocol document below, all 14 official sections are compiled into a beautifully pre-formatted GME template, downloaded to your device, and saved to the OneDrive folders.
                            </p>
                        </div>
                    </div>
                </div>
            );

        default:
            return null;
    }
}

// Reusable micro-form components
function InputField({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-800 font-bold text-slate-700 transition-all text-xs shadow-3xs"
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
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-800 font-bold text-slate-700 transition-all appearance-none text-xs shadow-3xs"
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
                placeholder="Search database directory by name..."
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-800 font-bold text-slate-700 transition-all text-xs shadow-3xs"
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
                    <button onClick={onAsk} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-advent-navy bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-all border border-slate-200/50">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        AI Helper
                    </button>
                )}
            </div>
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-800 font-bold text-slate-700 transition-all text-xs shadow-3xs resize-none"
            />
        </div>
    );
}

function CheckboxField({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center gap-3 p-3 bg-white border border-slate-200/60 rounded-2xl cursor-pointer hover:border-slate-400 transition-all select-none shadow-3xs">
            <input 
                type="checkbox" 
                checked={checked} 
                onChange={e => onChange(e.target.checked)}
                className="w-4 h-4 rounded text-advent-navy focus:ring-advent-blue border-slate-300" 
            />
            <span className="text-[10.5px] font-bold text-slate-700">{label}</span>
        </label>
    );
}

// Renders the template's own guidance for the current section.
function SectionGuidance({ step }: { step: number }) {
    const g = PROTOCOL_GUIDANCE[step];
    if (!g) return null;
    return (
        <div className="bg-advent-navy/[0.03] border border-advent-navy/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-advent-navy shrink-0" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-advent-navy">{g.covers}</span>
            </div>
            <p className="text-xs font-bold text-slate-700 leading-relaxed">{g.intro}</p>
            {g.points.length > 0 && (
                <ul className="space-y-1.5">
                    {g.points.map((pt, i) => (
                        <li key={i} className="flex gap-2 text-[11px] font-medium text-slate-500 leading-relaxed">
                            <span className="text-advent-navy/40 shrink-0">&bull;</span>
                            <span>{pt}</span>
                        </li>
                    ))}
                </ul>
            )}
            {g.example && (
                <div className="bg-white border border-slate-200/70 rounded-xl p-3.5 space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">{g.example.label}</span>
                    <p className="text-[11px] font-medium text-slate-600 italic leading-relaxed">{g.example.body}</p>
                    {g.example.tips && (
                        <ul className="space-y-0.5 pt-1">
                            {g.example.tips.map((t, i) => (
                                <li key={i} className="text-[10px] font-bold text-slate-400">- {t}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

// The template's required submission checklist, evaluated against what has been
// filled in, so residents are not left self-assessing against a paper list.
function SubmissionChecklist({ data }: { data: any }) {
    const results = SUBMISSION_CHECKLIST.map(item => ({ label: item.label, met: item.isMet(data) }));
    const outstanding = results.filter(r => !r.met).length;
    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Submission checklist</h4>
                <span className={`text-[10px] font-black uppercase tracking-widest ${outstanding === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                    {outstanding === 0 ? "All requirements met" : `${outstanding} outstanding`}
                </span>
            </div>
            <ul className="space-y-2">
                {results.map(r => (
                    <li key={r.label} className="flex items-start gap-2.5">
                        <span className={`mt-0.5 w-4 h-4 rounded-md shrink-0 flex items-center justify-center text-[9px] font-black ${r.met ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-300 border border-slate-200"}`}>
                            {r.met ? "✓" : ""}
                        </span>
                        <span className={`text-xs font-semibold leading-snug ${r.met ? "text-slate-400 line-through decoration-slate-300" : "text-slate-700"}`}>
                            {r.label}
                        </span>
                    </li>
                ))}
            </ul>
            <p className="text-[10px] font-medium text-slate-400 italic">
                These are the template&apos;s required items. Your mentor still reviews the content itself.
            </p>
        </div>
    );
}

// Real multi-select for people.
//
// The previous control was a single <input list=...> with a hint reading
// "Separate multiple names with commas". Picking from a datalist REPLACES the
// input value, so a second selection wiped the first and the only way to enter
// several people was to type every name by hand, exactly.
//
// Stores a comma-separated string so the ProtocolData shape and the Word
// exporter are unchanged.
function DirectoryMultiSelect({ label, value, options, onChange }: {
    label: string;
    value: string;
    options: any[];
    onChange: (v: string) => void;
}) {
    const [query, setQuery] = useState("");
    const selected = value.split(",").map(v => v.trim()).filter(Boolean);

    const add = (name: string) => {
        const clean = name.trim();
        if (!clean || selected.some(s => s.toLowerCase() === clean.toLowerCase())) return;
        onChange([...selected, clean].join(", "));
        setQuery("");
    };
    const remove = (name: string) =>
        onChange(selected.filter(s => s !== name).join(", "));

    const q = query.trim().toLowerCase();
    const matches = q
        ? options
            .filter(o => (o.name || "").toLowerCase().includes(q))
            .filter(o => !selected.some(s => s.toLowerCase() === (o.name || "").toLowerCase()))
            .slice(0, 6)
        : [];

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>

            {selected.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selected.map(name => (
                        <span key={name} className="inline-flex items-center gap-1.5 bg-advent-navy/5 border border-advent-navy/15 text-advent-navy pl-3 pr-2 py-1.5 rounded-xl text-[11px] font-bold">
                            {name}
                            <button
                                type="button"
                                onClick={() => remove(name)}
                                aria-label={`Remove ${name}`}
                                className="text-advent-navy/40 hover:text-rose-600 transition-colors"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div className="relative">
                <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => {
                        // Enter adds a free-text name too, so people who are not in
                        // the directory can still be listed.
                        if (e.key === "Enter") { e.preventDefault(); add(query); }
                    }}
                    placeholder="Search the directory, or type a name and press Enter..."
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-800 font-bold text-slate-700 transition-all text-xs shadow-3xs"
                />
                {matches.length > 0 && (
                    <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                        {matches.map(o => (
                            <li key={o.email || o.name}>
                                <button
                                    type="button"
                                    onClick={() => add(o.name)}
                                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors"
                                >
                                    <span className="block text-xs font-bold text-slate-800">{o.name}</span>
                                    {o.email && <span className="block text-[10px] font-medium text-slate-400">{o.email}</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <p className="text-[9px] font-medium text-slate-400 italic ml-1">
                {selected.length === 0
                    ? "Add as many co-investigators as you need."
                    : `${selected.length} selected`}
            </p>
        </div>
    );
}

/**
 * Tells the faculty mentor a protocol is ready for them.
 *
 * Completing a protocol previously notified nobody: the resident saw an alert
 * and the mentor found out by chance. Resolves the mentor's stored address from
 * their profile - deliberately never guessing an address from their name, which
 * is how mentor emails used to reach uninvolved colleagues.
 */
async function notifyMentor(mentorName: string, projectTitle: string, residentName: string | null) {
    if (!mentorName?.trim()) return;
    try {
        const supabase = createClient();
        const { data: mentor } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .ilike("full_name", `%${mentorName.trim()}%`)
            .limit(1)
            .maybeSingle();

        if (!mentor?.email) {
            console.info(
                `No stored email for mentor "${mentorName}" - skipping notification. ` +
                `Link them from the directory to enable mentor emails.`
            );
            return;
        }

        const by = residentName ? `${residentName} has` : "A resident has";
        await sendEmail(TEMPLATES.PROTOCOL_APPROVED || TEMPLATES.MENTOR_ASSIGNED, {
            to_email: mentor.email,
            to_name: mentor.full_name || mentorName,
            project_title: projectTitle,
            message:
                `${by} completed the 14-section QI protocol for "${projectTitle}" and named you as faculty mentor. ` +
                `Please review it in the Athena registry and record your attestation when you are satisfied.`,
        });

        if (mentor.id) {
            await supabase.from("notifications").insert({
                user_id: mentor.id,
                type: "general",
                title: "Protocol ready for your review",
                message: `${by} completed the QI protocol for "${projectTitle}".`,
                is_read: false,
            });
        }
    } catch (err) {
        // Never block the save on a notification failure.
        console.error("Mentor notification failed:", err);
    }
}
