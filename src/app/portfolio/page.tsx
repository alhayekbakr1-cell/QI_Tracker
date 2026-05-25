"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Project } from "@/types";
import ProjectCard from "@/components/ProjectCard";
import {
    Award,
    CheckCircle2,
    Circle,
    FileText,
    ChevronRight,
    Trophy,
    GraduationCap,
    TrendingUp,
    Presentation,
    DollarSign,
    Users,
    ChevronDown
} from "lucide-react";
import Link from "next/link";
import { Skeleton, toast } from "@/components/ui/custom-ui";
import jsPDF from "jspdf";

export default function PortfolioPage() {
    const [myProjects, setMyProjects] = useState<Project[]>([]);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function fetchMyData() {
            let user: any = null;
            let profile: any = null;

            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                router.push("/login");
                return;
            }

            user = authUser;
            setUserEmail(user?.email ?? "Guest");

            if (user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                profile = profileData;
                setUserProfile(profile);
            }

            if (!user && !profile) {
                setIsLoading(false);
                return;
            }

            const userId = user?.id || profile?.id;
            const userFullName = profile?.full_name?.toLowerCase() || "";
            const emailPrefix = user?.email?.split('@')[0].toLowerCase() || "";
            const emailParts = emailPrefix.split('.');

            // Fetch projects where user is proponent, lead_proponent, OR faculty
            const { data: projects } = await supabase
                .from('projects')
                .select('*');

            if (projects) {
                const filtered = projects.filter(p => {
                    // Check ID linkage first
                    const isIdMatch =
                        (p.lead_proponent_ids && p.lead_proponent_ids.includes(userId)) ||
                        (p.proponent_ids && p.proponent_ids.includes(userId)) ||
                        (p.faculty_id === userId);

                    if (isIdMatch) return true;

                    // Fallback to name matching
                    const nameMatch = (name: string) => {
                        if (!name) return false;
                        const lowName = name.toLowerCase();
                        if (userFullName && lowName.includes(userFullName)) return true;
                        if (lowName.includes(emailPrefix)) return true;
                        return emailParts.every((part: string) => part.length > 2 ? lowName.includes(part) : true);
                    };

                    return (p.lead_proponents && p.lead_proponents.some(nameMatch)) ||
                        (p.proponents && p.proponents.some(nameMatch)) ||
                        (p.faculty && nameMatch(p.faculty));
                });
                setMyProjects(filtered as Project[]);
            }
            setIsLoading(false);
        }
        fetchMyData();
    }, [router, supabase]);

    if (isLoading) {
        return (
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
                <header className="mb-12 space-y-2">
                    <Skeleton className="h-10 w-80 rounded-xl" />
                    <Skeleton className="h-4 w-96 rounded-lg" />
                </header>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <Skeleton className="h-[320px] rounded-[2.5rem]" />
                        <Skeleton className="h-[120px] rounded-3xl" />
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-8 w-48 rounded-xl" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-44 rounded-[2rem]" />
                            <Skeleton className="h-44 rounded-[2rem]" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const downloadBoardLetter = () => {
        try {
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "pt",
                format: "letter"
            });

            // Set document metadata
            doc.setProperties({
                title: "GME QI Board Certification Letter",
                subject: "Quality Improvement Milestones Cleared",
                author: "AdventHealth Graduate Medical Education",
                creator: "QI Tracker Chief"
            });

            const residentName = userProfile?.full_name || userEmail?.split("@")[0].split(".").map((n: string) => n.charAt(0).toUpperCase() + n.slice(1)).join(" ") || "Resident Physician";
            
            // Branding colors
            const navy = [15, 44, 89]; // #0f2c59
            const teal = [0, 169, 224]; // #00a9e0
            const darkGrey = [60, 60, 60];

            // 1. Header Banner Background
            doc.setFillColor(navy[0], navy[1], navy[2]);
            doc.rect(0, 0, 612, 120, "F");

            // 2. Accent Bar
            doc.setFillColor(teal[0], teal[1], teal[2]);
            doc.rect(0, 120, 612, 5, "F");

            // 3. Header Text
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("ADVENTHEALTH GRADUATE MEDICAL EDUCATION", 54, 55);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(190, 210, 230);
            doc.text("QUALITY IMPROVEMENT & SCHOLARLY ACTIVITY TRACKER", 54, 75);
            
            doc.setFont("helvetica", "italic");
            doc.setFontSize(9);
            doc.text(`Verification Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 54, 92);

            // 4. Document Title
            doc.setTextColor(navy[0], navy[1], navy[2]);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.text("QI BOARD ELIGIBILITY CERTIFICATION", 54, 165);

            // 5. Divider Line
            doc.setDrawColor(220, 225, 230);
            doc.setLineWidth(1);
            doc.line(54, 175, 558, 175);

            // 6. Memo Metadata Block
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(navy[0], navy[1], navy[2]);
            doc.text("TO:", 54, 205);
            doc.text("FROM:", 54, 225);
            doc.text("DATE:", 54, 245);
            doc.text("RE:", 54, 265);
            doc.text("STATUS:", 54, 285);

            doc.setFont("helvetica", "normal");
            doc.setTextColor(darkGrey[0], darkGrey[1], darkGrey[2]);
            doc.text("Clinical Competency Committee (CCC) & Respective Specialty Board", 120, 205);
            doc.text("Office of Graduate Medical Education, Quality Improvement Division", 120, 225);
            doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 120, 245);
            
            doc.setFont("helvetica", "bold");
            doc.text(`Official QI Milestone Clearance - Dr. ${residentName}`, 120, 265);
            
            doc.setTextColor(16, 185, 129); // Green
            doc.text("BOARD-READY / COMPLIANT", 120, 285);

            // Divider Line
            doc.setDrawColor(220, 225, 230);
            doc.line(54, 305, 558, 305);

            // 7. Memo Body Text
            doc.setTextColor(darkGrey[0], darkGrey[1], darkGrey[2]);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10.5);
            
            const p1 = `This letter serves as official verification that Dr. ${residentName} has successfully completed all institutional Quality Improvement (QI) and Clinical Milestone requirements set forth by the Graduate Medical Education (GME) committee and ACGME Common Program Requirements.`;
            const splitP1 = doc.splitTextToSize(p1, 504);
            doc.text(splitP1, 54, 335);

            const p2 = `Through active engagement in continuous clinical improvement, Dr. ${residentName} has successfully designed, executed, and analyzed institutional scholarly projects using robust methodologies. The resident's portfolio has officially satisfied the three key GME scholarly milestones:`;
            const splitP2 = doc.splitTextToSize(p2, 504);
            doc.text(splitP2, 54, 390);

            // 8. Milestones Checklist Box
            const boxY = 460;
            doc.setFillColor(245, 247, 250);
            doc.rect(54, boxY, 504, 105, "F");
            doc.setDrawColor(226, 232, 240);
            doc.rect(54, boxY, 504, 105, "D");

            // Bullet points inside box
            doc.setFont("helvetica", "bold");
            doc.setTextColor(navy[0], navy[1], navy[2]);
            doc.text("Milestone", 74, boxY + 25);
            doc.text("Requirement Status", 300, boxY + 25);
            doc.text("Verification", 450, boxY + 25);

            doc.setDrawColor(226, 232, 240);
            doc.line(74, boxY + 32, 538, boxY + 32);

            doc.setFont("helvetica", "normal");
            doc.setTextColor(darkGrey[0], darkGrey[1], darkGrey[2]);
            doc.text("1. QI Protocol Approval", 74, boxY + 50);
            doc.setTextColor(16, 185, 129);
            doc.text("Completed", 300, boxY + 50);
            doc.text("Verified", 450, boxY + 50);

            doc.setTextColor(darkGrey[0], darkGrey[1], darkGrey[2]);
            doc.text("2. Iterative PDSA Testing", 74, boxY + 68);
            doc.setTextColor(16, 185, 129);
            doc.text(`Completed (${totalPDSAs} Cycles)`, 300, boxY + 68);
            doc.text("Verified", 450, boxY + 68);

            doc.setTextColor(darkGrey[0], darkGrey[1], darkGrey[2]);
            doc.text("3. Scholarly Dissemination", 74, boxY + 85);
            doc.setTextColor(16, 185, 129);
            doc.text("Completed", 300, boxY + 85);
            doc.text("Verified", 450, boxY + 85);

            // 9. Concluding paragraph
            doc.setTextColor(darkGrey[0], darkGrey[1], darkGrey[2]);
            doc.setFont("helvetica", "normal");
            const p3 = "Consequently, the GME Office clears the above-named physician as 'Board Ready' with respect to our Quality Improvement & Patient Safety curriculum requirements. We commend their dedication to enhancing patient safety, improving clinical pathways, and leading institutional research.";
            const splitP3 = doc.splitTextToSize(p3, 504);
            doc.text(splitP3, 54, boxY + 130);

            // 10. Signature Section
            const sigY = boxY + 210;
            doc.setDrawColor(200, 200, 200);
            doc.line(54, sigY, 220, sigY);
            doc.line(340, sigY, 506, sigY);

            doc.setFont("helvetica", "bold");
            doc.setTextColor(navy[0], navy[1], navy[2]);
            doc.text("GME QI Committee Chairperson", 54, sigY + 15);
            doc.text("Designated Institutional Official (DIO)", 340, sigY + 15);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(120, 120, 120);
            doc.text("AdventHealth Clinical Research & Education", 54, sigY + 28);
            doc.text("Office of Graduate Medical Education", 340, sigY + 28);

            // Footer Branding
            doc.setFont("helvetica", "italic");
            doc.setFontSize(8);
            doc.text("AdventHealth GME QI Tracker - Document Verification ID: AH-QI-" + Math.random().toString(36).substring(2, 10).toUpperCase(), 54, 730);

            // Save PDF
            doc.save(`QI_Board_Certification_Letter_${residentName.replace(/\s+/g, "_")}.pdf`);
            toast.success("Board certification letter generated successfully!");
        } catch (error) {
            console.error("PDF generation error:", error);
            toast.error("Failed to generate board certification letter.");
        }
    };

    // Graduation Requirements Logic
    const hasProtocol = myProjects.some(p => p.protocol_url);
    const hasPresentation = myProjects.some(p => p.presentation_url);
    const totalPDSAs = myProjects.reduce((sum, p) => sum + p.pdsa_cycle, 0);
    const pdsaProgress = Math.min((totalPDSAs / 2) * 100, 100);

    const requirements = [
        { label: "QI Protocol Approved", status: hasProtocol, icon: FileText },
        { label: "2+ PDSA Cycles Completed", status: totalPDSAs >= 2, icon: TrendingUp, sub: `${totalPDSAs}/2 Cycles` },
        { label: "Institutional Presentation", status: hasPresentation, icon: Presentation }
    ];

    const completedCount = requirements.filter(r => r.status).length;
    const progressPercent = Math.round((completedCount / requirements.length) * 100);

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <header className="mb-12">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">My Academic Portfolio</h1>
                <p className="text-slate-500 font-medium">Tracking Quality Improvement & Graduation Milestones for <span className="text-advent-navy font-bold">{userEmail}</span></p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Dynamic Tracker Card (Graduation vs Mentorship) */}
                <div className="lg:col-span-1 space-y-6">
                    {userProfile?.role === 'Operator' || userProfile?.role === 'Faculty' ? (
                        /* Faculty Mentorship Impact View */
                        <div className="bg-advent-navy text-white p-8 rounded-[2.5rem] shadow-2xl shadow-advent-navy/20 relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <Award className="w-32 h-32" />
                            </div>

                            <div className="relative z-10">
                                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/60 mb-2">Mentorship Impact</h2>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6">Academic CV Ready</h3>
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Projects Guided</p>
                                        <p className="text-3xl font-black">{myProjects.length}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">PDSAs Mentored</p>
                                        <p className="text-3xl font-black">{myProjects.reduce((sum, p) => sum + p.pdsa_cycle, 0)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Users className="w-4 h-4 text-blue-400" />
                                        <span className="text-xs font-bold">Total Patient Reach</span>
                                    </div>
                                    <span className="text-sm font-black">{myProjects.reduce((sum, p) => sum + (p.total_patients_impacted || 0), 0).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <DollarSign className="w-4 h-4 text-emerald-400" />
                                        <span className="text-xs font-bold">Escaped Costs Guided</span>
                                    </div>
                                    <span className="text-sm font-black">${myProjects.reduce((sum, p) => sum + (Number(p.estimated_cost_savings) || 0), 0).toLocaleString()}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => window.print()}
                                className="w-full mt-8 py-4 bg-white text-advent-navy rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-black/20 hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Export Mentorship Report for CV
                            </button>
                        </div>
                    ) : (
                        /* Resident Graduation Status View */
                        <div className="bg-advent-navy text-white p-8 rounded-[2.5rem] shadow-2xl shadow-advent-navy/20 relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <GraduationCap className="w-32 h-32" />
                            </div>

                            <div className="relative z-10">
                                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/60 mb-6">Graduation Status</h2>
                                <div className="flex items-end gap-2 mb-2">
                                    <span className="text-5xl font-black">{progressPercent}%</span>
                                    <span className="text-xs font-bold text-white/60 mb-2 uppercase tracking-widest">Complete</span>
                                </div>

                                <div className="w-full h-2 bg-white/10 rounded-full mt-4 overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-advent-green shadow-[0_0_15px_rgba(74,222,128,0.5)] transition-all duration-1000"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>

                                <div className="mt-8 space-y-4">
                                    {requirements.map((req, idx) => (
                                        <div key={idx} className="flex items-center justify-between group/item">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${req.status ? 'bg-advent-green/20 text-advent-green' : 'bg-white/5 text-white/30'}`}>
                                                    <req.icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-bold leading-none ${req.status ? 'text-white' : 'text-white/40'}`}>{req.label}</p>
                                                    {req.sub && <p className="text-[9px] font-black uppercase tracking-widest mt-1 text-white/30">{req.sub}</p>}
                                                </div>
                                            </div>
                                            {req.status ? <CheckCircle2 className="w-4 h-4 text-advent-green" /> : <Circle className="w-4 h-4 text-white/10" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-6 rounded-3xl border border-slate-200">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            Academic Achievements
                        </h3>
                        <div className="space-y-3">
                            {completedCount === requirements.length ? (
                                <div className="space-y-3">
                                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                                        <Award className="w-5 h-5 text-emerald-600 animate-pulse" />
                                        <div>
                                            <p className="text-xs font-bold text-emerald-800">Board Ready / QI Milestone Met</p>
                                            <p className="text-[10px] text-emerald-600 font-medium">All ACGME scholarly milestones fully satisfied.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={downloadBoardLetter}
                                        className="w-full py-3 bg-advent-green hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-advent-green/20 hover:shadow-emerald-600/30 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Award className="w-4 h-4" />
                                        Download Board Letter
                                    </button>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 italic px-2">Complete all milestones to unlock your QI Board Certification Letter.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Projects List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Participating Projects</h2>
                        <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {myProjects.length} Active
                        </span>
                    </div>

                    {myProjects.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {myProjects.map(project => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold mb-4">You aren't listed on any projects yet.</p>
                            <Link href="/projects/new" className="text-advent-navy font-black text-sm uppercase tracking-widest hover:underline flex items-center justify-center gap-1">
                                Start a New Project <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
