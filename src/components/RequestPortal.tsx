"use client"

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
    FileText, CheckCircle2, AlertTriangle, Edit3, 
    User, Award, Loader2, ArrowRight, ClipboardList, Plus
} from "lucide-react";
import ProtocolReader from "./ProtocolReader";
import ProtocolWizard from "./ProtocolWizard";
import Link from "next/link";

interface RequestPortalProps {
    userId: string;
}

interface RegistrationRequest {
    id: string;
    title: string;
    category: string;
    subcategory: string;
    faculty: string | null;
    faculty_id: string | null;
    smart_aim: string | null;
    squire_rationale: string | null;
    protocol_data: any;
    mentor_approval_status: 'pending' | 'approved' | 'rejected';
    gme_approval_status: 'pending' | 'approved' | 'rejected';
    status: 'pending' | 'approved' | 'revisions_requested';
    reviewer_feedback: string | null;
    created_at: string;
}

export default function RequestPortal({ userId }: RequestPortalProps) {
    const [requests, setRequests] = useState<RegistrationRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
    const [activeWizardRequestId, setActiveWizardRequestId] = useState<string | null>(null);
    const [activeWizardTitle, setActiveWizardTitle] = useState<string>("");
    const supabase = createClient();

    const fetchRequests = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('project_registration_requests')
            .select('*')
            .eq('created_by', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching registration requests:", error);
        } else {
            setRequests((data || []) as RegistrationRequest[]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (userId) {
            fetchRequests();
        }
    }, [userId]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-advent-navy" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200/70 shadow-3xs">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-900 text-white p-2 rounded-lg border border-slate-800 shadow-3xs">
                        <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                        <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Resident Registry Hub</span>
                        <h2 className="text-sm font-serif italic font-bold text-slate-900">
                            My QI Project Registrations
                        </h2>
                    </div>
                </div>
                <Link
                    href="/projects/new"
                    className="flex items-center gap-1.5 bg-advent-navy text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-advent-cobalt transition-all shadow-sm active:scale-95"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New Proposal
                </Link>
            </div>

            {requests.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-400">
                        <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-700 text-sm">No QI Projects Registered Yet</h3>
                    <p className="text-slate-400 font-semibold text-xs mt-1 max-w-sm">
                        Residents must compile a 14-section QI Protocol to register an active project in the GME Tracker.
                    </p>
                    <Link
                        href="/projects/new"
                        className="mt-6 flex items-center gap-2 bg-emerald-500 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95"
                    >
                        Create Your First QI Proposal <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {requests.map((request) => {
                        const isApproved = request.status === 'approved';
                        const isRevisionRequested = request.status === 'revisions_requested';
                        
                        return (
                            <div 
                                key={request.id} 
                                className={`bg-white rounded-[2rem] border p-6 sm:p-8 shadow-xs flex flex-col gap-6 transition-all hover:border-slate-300 relative overflow-hidden ${
                                    isApproved ? 'ring-1 ring-emerald-500/10' : 
                                    isRevisionRequested ? 'ring-1 ring-amber-500/10 border-amber-200 bg-amber-50/5' : ''
                                }`}
                            >
                                {/* Background design cues */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full pointer-events-none -z-10" />

                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 rounded text-slate-500 border border-slate-200">
                                                {request.category}
                                            </span>
                                            {request.subcategory && (
                                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 rounded text-slate-500 border border-slate-200">
                                                    {request.subcategory}
                                                </span>
                                            )}
                                            <span className="text-[9px] font-bold text-slate-400">
                                                Submitted {new Date(request.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-serif font-bold text-slate-900 leading-snug">
                                            {request.title}
                                        </h3>
                                        {request.smart_aim && (
                                            <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50/50 p-3 rounded-xl border border-slate-100 font-medium">
                                                <strong>SMART Aim:</strong> {request.smart_aim}
                                            </p>
                                        )}
                                    </div>

                                    {/* Overall Status Badge */}
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 border
                                        ${isApproved 
                                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                            : isRevisionRequested 
                                            ? 'bg-amber-100 text-amber-700 border-amber-200' 
                                            : 'bg-blue-100 text-blue-700 border-blue-200'}
                                    `}>
                                        {isApproved ? 'Approved' : isRevisionRequested ? 'Revisions Requested' : 'Pending Audit'}
                                    </span>
                                </div>

                                {/* Revision Feedback Banner */}
                                {isRevisionRequested && request.reviewer_feedback && (
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-amber-500/10 border border-amber-500/20 text-amber-900 px-6 py-5 rounded-[2rem] text-xs font-semibold leading-relaxed shadow-3xs">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                                            <div className="space-y-1">
                                                <strong className="text-amber-800 uppercase tracking-widest text-[9px] font-black block">Revisions Requested by GME Chief Registry</strong>
                                                <p className="text-slate-700 font-bold">{request.reviewer_feedback}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setActiveWizardRequestId(request.id);
                                                setActiveWizardTitle(request.title);
                                            }}
                                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-amber-500/15 active:scale-95 shrink-0"
                                        >
                                            <Edit3 className="w-4 h-4 text-amber-200" />
                                            Edit & Resubmit
                                        </button>
                                    </div>
                                )}

                                {/* Sponsorship and Audit Checklist */}
                                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-150 flex flex-col sm:flex-row gap-6 justify-between">
                                    <div className="flex flex-col gap-1.5 justify-center">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Dual Sponsorship Checklist</span>
                                        <span className="text-[10px] font-bold text-slate-500">Registry approval requires clinical and administrative validation.</span>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center shrink-0">
                                        {/* Gate 1: Drafted */}
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                                            <span className="text-[10.5px] font-bold text-slate-700">1. SQUIRE Drafted</span>
                                        </div>

                                        <span className="hidden sm:inline text-slate-300">|</span>

                                        {/* Gate 2: Mentor Approval */}
                                        <div className="flex items-center gap-2">
                                            {request.mentor_approval_status === 'approved' ? (
                                                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                                            ) : request.mentor_approval_status === 'rejected' ? (
                                                <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                                            ) : (
                                                <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-300 border-dashed shrink-0" />
                                            )}
                                            <div className="flex flex-col">
                                                <span className={`text-[10.5px] font-bold ${
                                                    request.mentor_approval_status === 'approved' ? 'text-slate-800 font-extrabold' : 'text-slate-550'
                                                }`}>
                                                    2. Faculty Sponsored
                                                </span>
                                                {request.faculty && (
                                                    <span className="text-[8px] text-slate-450 font-bold -mt-0.5">
                                                        ({request.faculty})
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <span className="hidden sm:inline text-slate-300">|</span>

                                        {/* Gate 3: Chief Resident Registry Audit */}
                                        <div className="flex items-center gap-2">
                                            {request.gme_approval_status === 'approved' ? (
                                                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                                            ) : request.gme_approval_status === 'rejected' ? (
                                                <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                                            ) : (
                                                <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-300 border-dashed shrink-0" />
                                            )}
                                            <span className={`text-[10.5px] font-bold ${
                                                request.gme_approval_status === 'approved' ? 'text-slate-800 font-extrabold' : 'text-slate-550'
                                            }`}>
                                                3. Chief Resident Audited
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Actions */}
                                <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                                    <button
                                        onClick={() => setSelectedRequest(request)}
                                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-700 bg-slate-150 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-3xs"
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        View SQUIRE Draft
                                    </button>

                                    {isRevisionRequested ? (
                                        <button
                                            onClick={() => {
                                                setActiveWizardRequestId(request.id);
                                                setActiveWizardTitle(request.title);
                                            }}
                                            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            Edit & Resubmit Protocol
                                        </button>
                                    ) : !isApproved && (
                                        <button
                                            onClick={() => {
                                                setActiveWizardRequestId(request.id);
                                                setActiveWizardTitle(request.title);
                                            }}
                                            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white bg-advent-navy hover:bg-advent-cobalt px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            Edit Protocol Wizard
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Protocol Reader Modal */}
            {selectedRequest && (
                <ProtocolReader
                    protocolData={selectedRequest.protocol_data}
                    isOpen={!!selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    showStamp={selectedRequest.mentor_approval_status === 'approved' && selectedRequest.gme_approval_status === 'approved'}
                />
            )}

            {/* Protocol Wizard Modal */}
            {activeWizardRequestId && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-50 w-full max-w-6xl h-[90vh] rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
                        <ProtocolWizard
                            projectId={activeWizardRequestId}
                            projectTitle={activeWizardTitle}
                            isRegistrationRequest={true}
                            onClose={() => {
                                setActiveWizardRequestId(null);
                                setActiveWizardTitle("");
                            }}
                            onSaveSuccess={async () => {
                                await fetchRequests();
                                setActiveWizardRequestId(null);
                                setActiveWizardTitle("");
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
