"use client"

import { createClient } from "@/utils/supabase/client";
import { useState } from "react";
import { Project, ProjectCharter as ProjectCharterType } from "@/types";
import { FileCheck, ChevronDown, ChevronUp, Edit3, Save, X, Loader2 } from "lucide-react";

interface Props {
    project: Project;
}

const CHARTER_FIELDS: { key: keyof ProjectCharterType; label: string; placeholder: string }[] = [
    { key: "problemStatement", label: "Problem Statement", placeholder: "Describe the problem this project addresses..." },
    { key: "aimStatement", label: "Aim Statement (SMART)", placeholder: "By [date], we will improve [metric] from [baseline] to [target]..." },
    { key: "teamMembers", label: "Team Members & Roles", placeholder: "e.g., Lead: Dr. Smith, Mentor: Dr. Jones, Data: Resident A..." },
    { key: "scopeIn", label: "In Scope", placeholder: "What is included in this project..." },
    { key: "scopeOut", label: "Out of Scope", placeholder: "What is explicitly excluded..." },
    { key: "timeline", label: "Timeline / Milestones", placeholder: "e.g., Month 1: Baseline data, Month 3: Intervention, Month 6: Evaluation..." },
    { key: "resources", label: "Resources Required", placeholder: "Budget, IT systems, personnel time, etc..." },
    { key: "successMeasures", label: "Success Measures", placeholder: "How will you know this project succeeded?..." },
];

const EMPTY_CHARTER: ProjectCharterType = {
    problemStatement: "",
    aimStatement: "",
    teamMembers: "",
    scopeIn: "",
    scopeOut: "",
    timeline: "",
    resources: "",
    successMeasures: "",
};

export default function ProjectCharter({ project }: Props) {
    const [isExpanded, setIsExpanded] = useState(!!project.charter);
    const [isEditing, setIsEditing] = useState(!project.charter);
    const [isSaving, setIsSaving] = useState(false);
    const [charter, setCharter] = useState<ProjectCharterType>(
        project.charter || { ...EMPTY_CHARTER }
    );

    const completedFields = Object.values(charter).filter(v => v && v.trim().length > 0).length;
    const totalFields = CHARTER_FIELDS.length;
    const completionPct = Math.round((completedFields / totalFields) * 100);

    const handleSave = async () => {
        setIsSaving(true);
        const supabase = createClient();
        const { error } = await supabase
            .from("projects")
            .update({ charter })
            .eq("id", project.id);

        setIsSaving(false);
        if (error) {
            alert("Failed to save charter: " + error.message);
        } else {
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setCharter(project.charter || { ...EMPTY_CHARTER });
        setIsEditing(false);
    };

    return (
        <div className="rounded-[2rem] border border-slate-200 bg-white overflow-hidden shadow-sm">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-8 py-5 hover:bg-slate-50/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-advent-navy/5 rounded-xl flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-advent-navy" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                            Project Charter
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                            {completedFields}/{totalFields} sections complete
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* Progress bar */}
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${completionPct === 100 ? "bg-emerald-500" : completionPct > 50 ? "bg-advent-blue" : "bg-amber-400"}`}
                                style={{ width: `${completionPct}%` }}
                            />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${completionPct === 100 ? "text-emerald-600" : "text-slate-400"}`}>
                            {completionPct}%
                        </span>
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                </div>
            </button>

            {/* Body */}
            {isExpanded && (
                <div className="px-8 pb-8 border-t border-slate-100">
                    <div className="flex justify-end pt-4 mb-6">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-advent-blue bg-advent-blue/5 px-3 py-1.5 rounded-lg hover:bg-advent-blue/10 transition-all border border-advent-blue/10"
                            >
                                <Edit3 className="w-3 h-3" />
                                Edit Charter
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-all"
                                >
                                    <X className="w-3 h-3" />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white bg-advent-navy px-3 py-1.5 rounded-lg hover:bg-advent-cobalt transition-all disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    Save Charter
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {CHARTER_FIELDS.map(({ key, label, placeholder }) => (
                            <div key={key} className={key === "problemStatement" || key === "aimStatement" ? "md:col-span-2" : ""}>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">
                                    {label}
                                </label>
                                {isEditing ? (
                                    <textarea
                                        value={charter[key]}
                                        onChange={e => setCharter(prev => ({ ...prev, [key]: e.target.value }))}
                                        placeholder={placeholder}
                                        rows={3}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-800 font-medium text-sm transition-all resize-none placeholder:text-slate-300"
                                    />
                                ) : (
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 min-h-[80px]">
                                        {charter[key] ? (
                                            <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                                                {charter[key]}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-slate-300 font-medium italic">Not filled in yet</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
