"use client"

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import {
    FileCheck,
    Award,
    AlertCircle,
    CheckCircle2,
    MessageSquare,
    FileText,
    Search,
    Loader2,
    ShieldAlert,
    Check,
    X,
    Filter,
    ArrowRight
} from "lucide-react";
import ProtocolReader from "@/components/ProtocolReader";

interface RegistrationRequest {
    id: string;
    title: string;
    category: string;
    subcategory: string;
    proponents: string[] | null;
    lead_proponents: string[] | null;
    proponent_ids: string[] | null;
    lead_proponent_ids: string[] | null;
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
    created_by: string;
    profiles?: { full_name: string } | null;
}

export default function ReviewBoard() {
    const [requests, setRequests] = useState<RegistrationRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTab, setFilterTab] = useState<'pending_audit' | 'all' | 'registered' | 'revisions'>('pending_audit');
    
    // Detailed SQUIRE Viewer State
    const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
    
    // Revision feedback states
    const [feedbackText, setFeedbackText] = useState("");
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackRequestId, setFeedbackRequestId] = useState<string | null>(null);

    // Action loaders
    const [actioningId, setActioningId] = useState<string | null>(null);
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

    const supabase = createClient();

    const fetchRequests = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('project_registration_requests')
            .select('*, profiles:created_by(full_name)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching registration requests:", error);
        } else if (data) {
            setRequests(data as unknown as RegistrationRequest[]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApproveRequest = async (request: RegistrationRequest) => {
        const isFacultyApproved = request.mentor_approval_status === 'approved';
        let confirmMsg = "Are you sure you want to approve and register this GME QI Protocol?";
        
        if (!isFacultyApproved) {
            confirmMsg += "\n\n⚠️ NOTE: The named Faculty Mentor has not sponsored this proposal yet. The project will remain in pending registration status until the faculty mentor signs off.";
        } else {
            confirmMsg += "\n\n🎉 Both approvals will be complete! This project will be automatically promoted to an ACTIVE project in the GME Tracker.";
        }

        if (!confirm(confirmMsg)) return;

        setActioningId(request.id);
        
        const { error } = await supabase
            .from('project_registration_requests')
            .update({
                gme_approval_status: 'approved',
                reviewed_by: (await supabase.auth.getUser()).data.user?.id,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', request.id);

        if (error) {
            console.error("Error approving request:", error);
            alert("Failed to approve and register the proposal. " + error.message);
        } else {
            alert(isFacultyApproved 
                ? "Project approved and successfully registered as ACTIVE! 🚀 The resident has been notified."
                : "Registry audit approved! Awaiting Faculty Mentor clinical sponsorship to complete activation."
            );
            fetchRequests();
        }
        setActioningId(null);
    };

    const handleRequestRevisions = async () => {
        if (!feedbackText.trim() || !feedbackRequestId) return;
        
        setIsSubmittingFeedback(true);
        
        const { error } = await supabase
            .from('project_registration_requests')
            .update({
                status: 'revisions_requested',
                gme_approval_status: 'rejected',
                reviewer_feedback: feedbackText,
                reviewed_by: (await supabase.auth.getUser()).data.user?.id,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', feedbackRequestId);

        if (error) {
            console.error("Error requesting revisions:", error);
            alert("Failed to request revisions. " + error.message);
        } else {
            alert("Revisions requested successfully! 📝 The resident has been notified with your structured feedback.");
            setShowFeedbackModal(false);
            setFeedbackText("");
            setFeedbackRequestId(null);
            fetchRequests();
        }
        setIsSubmittingFeedback(false);
    };

    const openFeedbackModal = (requestId: string) => {
        setFeedbackRequestId(requestId);
        setShowFeedbackModal(true);
    };

    // Filter Logic
    const filteredRequests = requests.filter(r => {
        // Search Term Filter
        const matchesSearch = 
            r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.faculty || '').toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        // Tab Filter
        switch (filterTab) {
            case 'pending_audit':
                return r.gme_approval_status === 'pending';
            case 'registered':
                return r.status === 'approved';
            case 'revisions':
                return r.status === 'revisions_requested';
            case 'all':
            default:
                return true;
        }
    });

    return (
        <div className="glass rounded-[2.5rem] overflow-hidden shadow-lg border border-slate-200/60 transition-all">
            {/* Header */}
            <div className="px-8 py-6 bg-gradient-to-r from-slate-900 via-slate-950 to-advent-navy text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 text-white p-2.5 rounded-2xl border border-emerald-600 shadow-3xs">
                        <FileCheck className="w-6 h-6 text-emerald-200" />
                    </div>
                    <div>
                        <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-slate-400">Registry Command Center</span>
                        <h2 className="text-xl font-serif italic font-bold text-white leading-none">
                            Chief Registry Review Board
                        </h2>
                    </div>
                </div>

                {/* Subtitle Telemetry */}
                <div className="flex gap-4 text-xs">
                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-center">
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Awaiting Chief Audit</span>
                        <span className="text-sm font-black text-emerald-400">
                            {requests.filter(r => r.gme_approval_status === 'pending').length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="px-8 py-4 bg-slate-50 border-b border-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/60 p-1 rounded-2xl border border-slate-300/40">
                    <button
                        onClick={() => setFilterTab('pending_audit')}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            filterTab === 'pending_audit' 
                                ? 'bg-white text-slate-900 shadow-3xs' 
                                : 'text-slate-500 hover:text-slate-850'
                        }`}
                    >
                        Pending Audit
                    </button>
                    <button
                        onClick={() => setFilterTab('registered')}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            filterTab === 'registered' 
                                ? 'bg-white text-slate-900 shadow-3xs' 
                                : 'text-slate-500 hover:text-slate-850'
                        }`}
                    >
                        Fully Registered
                    </button>
                    <button
                        onClick={() => setFilterTab('revisions')}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            filterTab === 'revisions' 
                                ? 'bg-white text-slate-900 shadow-3xs' 
                                : 'text-slate-500 hover:text-slate-850'
                        }`}
                    >
                        Revisions Requested
                    </button>
                    <button
                        onClick={() => setFilterTab('all')}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            filterTab === 'all' 
                                ? 'bg-white text-slate-900 shadow-3xs' 
                                : 'text-slate-500 hover:text-slate-850'
                        }`}
                    >
                        All Proposals
                    </button>
                </div>

                {/* Search input */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                    <input
                        type="text"
                        placeholder="Search proposals, residents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold focus:ring-2 focus:ring-advent-navy/10 outline-none w-full transition-all"
                    />
                </div>
            </div>

            {/* PHI Security Notice */}
            <div className="bg-amber-50/50 border-b border-amber-200/40 px-8 py-3 flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-[10px] text-amber-700 font-semibold leading-none">
                    <strong>GME Registry Standard Audit:</strong> Ensure no patient identifiers (MRN, Date of Birth, Name) are stored within the SQUIRE baseline narrative prior to final GME tracker activation.
                </span>
            </div>

            {/* Main Content List */}
            {isLoading ? (
                <div className="py-20 flex flex-col justify-center items-center gap-3 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Retrieving GME Proposal Ledger...</span>
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto" />
                    <p className="text-slate-400 font-serif italic text-sm">No project proposals found matching the selected status.</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100 bg-white">
                    {filteredRequests.map((request) => {
                        const isFacultyApproved = request.mentor_approval_status === 'approved';
                        const isChiefApproved = request.gme_approval_status === 'approved';
                        const isFullyRegistered = request.status === 'approved';

                        return (
                            <div key={request.id} className="p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:bg-slate-50/40 transition-colors">
                                {/* Left Info Block */}
                                <div className="space-y-2 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-slate-100 rounded-md text-slate-500 border border-slate-200">
                                            {request.category}
                                        </span>
                                        {request.subcategory && (
                                            <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-slate-100 rounded-md text-slate-500 border border-slate-200">
                                                {request.subcategory}
                                            </span>
                                        )}
                                        <span className="text-[10px] font-bold text-slate-400">
                                            Proposed by {request.profiles?.full_name || 'GME Resident'}
                                        </span>
                                    </div>
                                    
                                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                                        {request.title}
                                    </h3>

                                    {request.smart_aim && (
                                        <p className="text-xs text-slate-600 italic bg-slate-50/80 px-4 py-2.5 rounded-xl border border-slate-150/50 leading-relaxed font-semibold">
                                            <strong>SMART Aim:</strong> {request.smart_aim}
                                        </p>
                                    )}

                                    {request.reviewer_feedback && request.status === 'revisions_requested' && (
                                        <div className="bg-rose-50/50 border border-rose-200/50 p-3 rounded-xl flex items-start gap-2.5">
                                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="block text-[8px] font-black uppercase tracking-wider text-rose-700">Audit Feedback Notes</span>
                                                <p className="text-[11px] font-semibold text-rose-950 mt-0.5 italic">{request.reviewer_feedback}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Gate Status Badges */}
                                <div className="flex flex-row sm:flex-wrap items-center gap-3 shrink-0 py-2 lg:py-0 border-y lg:border-none border-slate-100 w-full lg:w-auto">
                                    {/* Faculty Mentor Approval Gate */}
                                    <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-center shrink-0 min-w-[120px]">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">1. Clinical Mentor</span>
                                        {isFacultyApproved ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                <Check className="w-2.5 h-2.5" />
                                                Sponsored
                                            </span>
                                        ) : request.mentor_approval_status === 'rejected' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                                                <X className="w-2.5 h-2.5" />
                                                Revisions Required
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                                                Pending Faculty
                                            </span>
                                        )}
                                        <span className="text-[8px] font-bold text-slate-450 mt-1 max-w-[100px] truncate leading-none">
                                            {request.faculty || "Faculty Mentor"}
                                        </span>
                                    </div>

                                    {/* GME Chief Registry Gate */}
                                    <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-center shrink-0 min-w-[120px]">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">2. Registry Audit</span>
                                        {isChiefApproved ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                <Check className="w-2.5 h-2.5" />
                                                Registered
                                            </span>
                                        ) : request.gme_approval_status === 'rejected' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                                                <X className="w-2.5 h-2.5" />
                                                Audited Revisions
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                                Pending Audit
                                            </span>
                                        )}
                                        <span className="text-[8px] font-bold text-slate-450 mt-1 leading-none">
                                            GME Chief Resident
                                        </span>
                                    </div>
                                </div>

                                {/* Review Actions */}
                                <div className="flex items-center gap-2.5 w-full lg:w-auto shrink-0 justify-end">
                                    <button
                                        onClick={() => setSelectedRequest(request)}
                                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-3xs"
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        Review SQUIRE
                                    </button>

                                    {request.gme_approval_status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => openFeedbackModal(request.id)}
                                                disabled={actioningId === request.id}
                                                className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-3xs border border-rose-200/50 disabled:opacity-50"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                Feedback
                                            </button>

                                            <button
                                                onClick={() => handleApproveRequest(request)}
                                                disabled={actioningId === request.id}
                                                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-2xs border border-emerald-700 disabled:opacity-50"
                                            >
                                                {actioningId === request.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Check className="w-3.5 h-3.5" />
                                                )}
                                                Approve
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Detailed SQUIRE Viewer Canvas Modal */}
            {selectedRequest && (
                <ProtocolReader
                    protocolData={selectedRequest.protocol_data}
                    isOpen={!!selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    showStamp={selectedRequest.status === 'approved'}
                />
            )}

            {/* Revision Feedback Drawer / Modal */}
            {showFeedbackModal && (
                <div className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
                            <h3 className="font-serif italic font-bold text-base flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-emerald-400" />
                                Request Audit Revisions
                            </h3>
                            <button 
                                onClick={() => setShowFeedbackModal(false)}
                                className="p-1 text-slate-400 hover:text-white rounded-lg transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                                Enter structured SQUIRE formatting feedback or corrective actions. The resident will be instantly notified with this guidance to revise their protocol.
                            </p>

                            <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                rows={4}
                                placeholder="E.g., Please specify your sampling frequency in Section 5 (Measures) and remove the direct patient MRN reference in baseline findings to remain PHI-compliant..."
                                className="w-full p-4 border border-slate-200 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 outline-none resize-none transition-all placeholder:text-slate-400"
                            />
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
                            <button
                                onClick={() => setShowFeedbackModal(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-slate-100 transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRequestRevisions}
                                disabled={isSubmittingFeedback || !feedbackText.trim()}
                                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-3xs disabled:opacity-50"
                            >
                                {isSubmittingFeedback ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <ArrowRight className="w-3 h-3" />
                                )}
                                Send Revision Notes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
