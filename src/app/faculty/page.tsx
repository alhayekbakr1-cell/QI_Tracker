"use client"

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Project } from "@/types";
import ProjectCard from "@/components/ProjectCard";
import ProtocolReader from "@/components/ProtocolReader";
import {
    Users,
    CheckCircle2,
    AlertCircle,
    FileCheck,
    MessageSquare,
    ChevronRight,
    Search,
    Filter,
    Award,
    Check,
    X,
    FileText,
    ArrowRight,
    Loader2
} from "lucide-react";
import Link from "next/link";

// Robust fuzzy matching to resolve manual text entries of mentor names (e.g. Vernace matching James Vernace)
function isFacultyMatch(facultyStr: string | null, fullName: string | null): boolean {
    if (!facultyStr || !fullName) return false;
    const cleanFaculty = facultyStr.toLowerCase().replace(/dr\.?\s+/gi, '');
    const cleanFull = fullName.toLowerCase().replace(/dr\.?\s+/gi, '').replace(/\b(md|do)\b/gi, '');
    
    // Split into individual alphanumeric words, filtering out common words and short letters
    const facultyWords = cleanFaculty.split(/[^a-z0-9]+/i).filter(w => w.length > 2 && w !== 'and' && w !== 'md' && w !== 'do');
    const fullWords = cleanFull.split(/[^a-z0-9]+/i).filter(w => w.length > 2 && w !== 'and' && w !== 'md' && w !== 'do');
    
    return facultyWords.some(fw => fullWords.some(nw => nw === fw || nw.includes(fw) || fw.includes(nw)));
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
    created_by: string;
    profiles?: { full_name: string } | null;
}

export default function FacultyDashboard() {
    const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
    const [pendingSponsorships, setPendingSponsorships] = useState<RegistrationRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
    
    // Revision feedback states
    const [feedbackText, setFeedbackText] = useState("");
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackRequestId, setFeedbackRequestId] = useState<string | null>(null);
    
    // Loading states for actions
    const [isSponsoringId, setIsSponsoringId] = useState<string | null>(null);
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

    const supabase = createClient();

    const fetchFacultyData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch profile to verify role
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        setUserProfile(profile);

        // Fetch all projects for fuzzy client-side mentor filtering
        const { data: projects } = await supabase
            .from('projects')
            .select('*');

        if (projects) {
            const matchedProjects = projects.filter((p: any) => 
                p.faculty_id === user.id || 
                (profile?.full_name && isFacultyMatch(p.faculty, profile.full_name))
            );
            setAssignedProjects(matchedProjects as Project[]);
        }

        // Fetch all profiles to map creator names client-side
        const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name');

        if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
        }

        // Fetch pending project registration requests
        const { data: requests, error: rError } = await supabase
            .from('project_registration_requests')
            .select('*')
            .eq('mentor_approval_status', 'pending');

        if (rError) {
            console.error("Error fetching pending sponsorships:", rError);
        } else if (requests) {
            const matchedRequests = requests.filter((req: any) => 
                req.faculty_id === user.id || 
                (profile?.full_name && isFacultyMatch(req.faculty, profile.full_name))
            );

            // Map profiles in-memory client-side
            const mapped = matchedRequests.map((req: any) => {
                const creator = profilesData?.find(p => p.id === req.created_by);
                return {
                    ...req,
                    profiles: creator ? { full_name: creator.full_name } : null
                };
            });
            setPendingSponsorships(mapped as unknown as RegistrationRequest[]);
        }

        setIsLoading(false);
    };

    useEffect(() => {
        fetchFacultyData();
    }, [supabase]);

    const handleSponsorProject = async (requestId: string) => {
        if (!confirm("Confirm clinical validation sponsorship of this SQUIRE QI Protocol draft? This will advance the request to GME Chief Resident Registry Audit.")) return;
        
        setIsSponsoringId(requestId);
        const { error } = await supabase
            .from('project_registration_requests')
            .update({ 
                mentor_approval_status: 'approved'
            })
            .eq('id', requestId);

        if (error) {
            console.error("Error sponsoring project:", error);
            alert("Failed to sponsor project proposal. " + error.message);
        } else {
            setPendingSponsorships(prev => prev.filter(r => r.id !== requestId));
            alert("Project sponsored successfully! 🌟 Resident has been notified and GME Chief audit queued.");
        }
        setIsSponsoringId(null);
    };

    const handleRequestRevisions = async () => {
        if (!feedbackText.trim() || !feedbackRequestId) return;
        setIsSubmittingFeedback(true);
        const { error } = await supabase
            .from('project_registration_requests')
            .update({ 
                status: 'revisions_requested',
                mentor_approval_status: 'rejected',
                reviewer_feedback: feedbackText
            })
            .eq('id', feedbackRequestId);

        if (error) {
            console.error("Error requesting revisions:", error);
            alert("Failed to request revisions. " + error.message);
        } else {
            setPendingSponsorships(prev => prev.filter(r => r.id !== feedbackRequestId));
            alert("Revision feedback sent successfully! 📝 Creator has been notified to modify their SQUIRE protocol draft.");
            setShowFeedbackModal(false);
            setFeedbackText("");
            setFeedbackRequestId(null);
        }
        setIsSubmittingFeedback(false);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen">Loading Faculty Portal...</div>;
    }

    if (userProfile?.role !== 'Faculty' && userProfile?.role !== 'Admin' && userProfile?.role !== 'Operator') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center uppercase tracking-widest font-black text-slate-300">
                <AlertCircle className="w-16 h-16 mb-4 opacity-20" />
                <p>Access Restricted to Authorized Faculty Mentors</p>
                <Link href="/" className="mt-8 text-advent-navy hover:underline text-xs">Return to Dashboard</Link>
            </div>
        );
    }

    const pendingApprovals = assignedProjects.filter(p => !p.faculty_approved_protocol || !p.faculty_approved_pdsa).length;

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-advent-cobalt p-2.5 rounded-xl text-white">
                            <Users className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Faculty Mentor Portal</h1>
                    </div>
                    <p className="text-slate-500 font-medium">Monitoring QI progress for <span className="text-advent-navy font-bold">{userProfile?.full_name || 'Assigned Resident Projects'}</span></p>
                </div>

                <div className="flex gap-3">
                    <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Mentored Projects</p>
                            <p className="text-xl font-black text-slate-900 leading-none">{assignedProjects.length}</p>
                        </div>
                        <div className="h-8 w-px bg-slate-100" />
                        <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-450">Pending Sponsorships</p>
                            <p className="text-xl font-black text-rose-600 leading-none">{pendingSponsorships.length}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* NEW: Faculty Sponsorship Requests Panel */}
            {pendingSponsorships.length > 0 && (
                <section className="space-y-6 bg-gradient-to-br from-amber-50/20 via-white to-white p-6 sm:p-8 rounded-[2.5rem] border border-amber-250 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full pointer-events-none" />
                    
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-500 text-white p-2 rounded-xl border border-amber-600 shadow-3xs">
                            <Award className="w-5 h-5 text-yellow-250 animate-pulse" />
                        </div>
                        <div>
                            <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-amber-600">Clinical Validation Gatekeeper</span>
                            <h2 className="text-lg font-serif italic font-bold text-slate-950">
                                Pending Dual-Sponsorship Sign-offs
                            </h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {pendingSponsorships.map((request) => (
                            <div key={request.id} className="bg-white rounded-[2rem] border border-slate-200/80 p-6 flex flex-col md:flex-row justify-between gap-6 hover:shadow-xs hover:border-slate-350 transition-all relative overflow-hidden">
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
                                            Proposed by {request.profiles?.full_name || 'Resident'}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                                        {request.title}
                                    </h3>
                                    {request.smart_aim && (
                                        <p className="text-xs text-slate-650 leading-relaxed font-semibold italic bg-slate-50 p-3 rounded-xl border border-slate-150/70">
                                            <strong>SMART Aim:</strong> {request.smart_aim}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 self-center">
                                    <button
                                        onClick={() => setSelectedRequest(request)}
                                        className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-3xs"
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        Review SQUIRE
                                    </button>
                                    
                                    <button
                                        onClick={() => handleSponsorProject(request.id)}
                                        disabled={isSponsoringId === request.id}
                                        className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                                    >
                                        {isSponsoringId === request.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Check className="w-3.5 h-3.5 text-white" />
                                        )}
                                        Sponsor Project
                                    </button>

                                    <button
                                        onClick={() => {
                                            setFeedbackRequestId(request.id);
                                            setShowFeedbackModal(true);
                                        }}
                                        className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm active:scale-95"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5 text-white" />
                                        Request Revisions
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Quick Filters</h3>
                            <Filter className="w-4 h-4 text-slate-300" />
                        </div>
                        <div className="space-y-2">
                            <button className="w-full text-left px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:border-advent-navy transition-all">
                                All My Projects
                            </button>
                            <button className="w-full text-left px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-white hover:text-slate-700 transition-all">
                                Protocol Sign-off Needed
                            </button>
                            <button className="w-full text-left px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-white hover:text-slate-700 transition-all">
                                PDSA Approvals
                            </button>
                        </div>
                    </div>

                    <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-4 flex items-center gap-2">
                            <FileCheck className="w-4 h-4" />
                            Clinical Oversight
                        </h3>
                        <p className="text-[11px] leading-relaxed text-emerald-800 font-semibold">
                            Dual-Sponsorship Registry requires clinical faculty backing. By clicking Sponsor, you certify that the methodologically sound, HIPAA-compliant project is safe for clinical rollout.
                        </p>
                    </div>
                </div>

                {/* Projects Feed */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex items-center justify-between bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="bg-slate-900 text-white p-2 rounded-lg border border-slate-800 shadow-3xs">
                                <Users className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <div>
                                <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-slate-450">Active Clinical Tracker</span>
                                <h2 className="text-sm font-serif italic font-bold text-slate-900">
                                    My Mentored Projects ({assignedProjects.length})
                                </h2>
                            </div>
                        </div>
                    </div>

                    {assignedProjects.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {assignedProjects.map(project => (
                                <div key={project.id} className="group relative">
                                    <ProjectCard project={project} />

                                    {/* Faculty Overlay for pending actions */}
                                    {(!project.faculty_approved_protocol || !project.faculty_approved_pdsa) && (
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            {!project.faculty_approved_protocol && (
                                                <span className="bg-rose-100 text-rose-600 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-rose-200 shadow-sm animate-pulse">
                                                    Action Required: Protocol
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-2 flex items-center gap-4 px-4 overflow-hidden h-0 group-hover:h-8 transition-all duration-300">
                                        <Link
                                            href={`/projects/view?id=${project.id}`}
                                            className="text-[10px] font-black uppercase tracking-widest text-advent-navy hover:underline flex items-center gap-1"
                                        >
                                            Review Project <ChevronRight className="w-3 h-3" />
                                        </Link>
                                        <div className="h-3 w-px bg-slate-200" />
                                        <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-advent-navy transition-colors flex items-center gap-1">
                                            <MessageSquare className="w-3 h-3" /> Add Feedback
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                            <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-450 font-bold">You haven't been assigned as a mentor for any active projects yet.</p>
                            <p className="text-xs text-slate-400 mt-2 italic px-8">Ask residents to select you as their Faculty Mentor when launching a new initiative.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Protocol Reader Modal */}
            {selectedRequest && (
                <ProtocolReader
                    protocolData={selectedRequest.protocol_data}
                    isOpen={!!selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    showStamp={false} // Only stamped after dual-approval
                />
            )}

            {/* Feedback Modal for Revisions */}
            {showFeedbackModal && (
                <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-amber-500" />
                                Request Revisions
                            </h3>
                            <button onClick={() => setShowFeedbackModal(false)} className="text-slate-450 hover:text-slate-600 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest">Feedback & Revision Guidance</label>
                            <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Explain exactly what methodology changes, balancing measures, or SQUIRE expansions are required for approval..."
                                className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setShowFeedbackModal(false)}
                                className="px-4 py-2 bg-slate-100 text-slate-650 hover:bg-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRequestRevisions}
                                disabled={isSubmittingFeedback || !feedbackText.trim()}
                                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
                            >
                                {isSubmittingFeedback ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <SendFeedbackIcon />
                                )}
                                Send Feedback
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Small inline helper icon since Send/Share doesn't exist under exact imports
function SendFeedbackIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
        </svg>
    );
}

