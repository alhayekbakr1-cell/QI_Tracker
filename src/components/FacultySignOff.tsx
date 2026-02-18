"use client"

import React, { useState } from 'react';
import { CheckCircle2, Circle, ShieldCheck, Lock } from 'lucide-react';
import { Project, UserRole } from '@/types';
import { createClient } from '@/utils/supabase/client';
import { getProfileDetails, sendEmailNotification } from '@/utils/notifications';

interface FacultySignOffProps {
    project: Project;
    userRole: UserRole | null;
    onUpdate: (updatedProject: Project) => void;
}

export default function FacultySignOff({ project, userRole, onUpdate }: FacultySignOffProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const supabase = createClient();
    const canApprove = userRole === 'Faculty' || userRole === 'Admin';

    const toggleApproval = async (field: 'faculty_approved_protocol' | 'faculty_approved_pdsa') => {
        if (!canApprove || isUpdating) return;

        setIsUpdating(true);
        const newValue = !project[field];

        const { error } = await supabase
            .from('projects')
            .update({ [field]: newValue })
            .eq('id', project.id);

        if (!error) {
            onUpdate({ ...project, [field]: newValue });

            // TRIGGER NOTIFICATION ON APPROVAL
            if (newValue === true) {
                try {
                    const milestoneName = field === 'faculty_approved_protocol' ? 'QI Protocol' : 'PDSA Cycle Execution';
                    const recipientIds = project.lead_proponent_ids || [];

                    if (recipientIds.length > 0) {
                        const recipients = await getProfileDetails(recipientIds);
                        for (const recipient of recipients) {
                            await sendEmailNotification({
                                to_email: recipient.email,
                                to_name: recipient.name,
                                subject: `Milestone Approved: ${milestoneName}`,
                                message: `Your project milestone "${milestoneName}" has been officially reviewed and approved by faculty.`,
                                project_title: project.title,
                                action_url: `${window.location.origin}/projects/view?id=${project.id}`
                            });
                        }
                    }
                } catch (notifyError) {
                    console.error('Approval notification error:', notifyError);
                }
            }
        } else {
            console.error(`Error updating ${field}:`, error);
        }
        setIsUpdating(false);
    };

    return (
        <div className="bg-slate-50/50 rounded-3xl border border-slate-100 p-6 space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Faculty Oversight</h3>
            </div>

            <div className="space-y-4">
                {/* Protocol Approval */}
                <div
                    onClick={() => toggleApproval('faculty_approved_protocol')}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${project.faculty_approved_protocol
                        ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
                        : 'bg-white border-slate-100 text-slate-500'
                        } ${canApprove ? 'cursor-pointer hover:border-emerald-300' : 'cursor-not-allowed opacity-80'}`}
                >
                    <div className="flex items-center gap-3">
                        {project.faculty_approved_protocol ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                            <Circle className="w-5 h-5 text-slate-200" />
                        )}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest">Protocol Milestone</p>
                            <p className="text-xs font-bold">Scientific Methods Approved</p>
                        </div>
                    </div>
                    {!canApprove && !project.faculty_approved_protocol && (
                        <Lock className="w-3.5 h-3.5 text-slate-300" />
                    )}
                </div>

                {/* PDSA Approval */}
                <div
                    onClick={() => toggleApproval('faculty_approved_pdsa')}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${project.faculty_approved_pdsa
                        ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
                        : 'bg-white border-slate-100 text-slate-500'
                        } ${canApprove ? 'cursor-pointer hover:border-emerald-300' : 'cursor-not-allowed opacity-80'}`}
                >
                    <div className="flex items-center gap-3">
                        {project.faculty_approved_pdsa ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                            <Circle className="w-5 h-5 text-slate-200" />
                        )}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest">Execution Milestone</p>
                            <p className="text-xs font-bold">PDSA Cycle Review Complete</p>
                        </div>
                    </div>
                    {!canApprove && !project.faculty_approved_pdsa && (
                        <Lock className="w-3.5 h-3.5 text-slate-300" />
                    )}
                </div>
            </div>

            {canApprove && (
                <p className="text-[9px] text-slate-400 font-medium italic text-center">
                    Click to toggle milestone verification as Faculty/Admin.
                </p>
            )}
        </div>
    );
}
