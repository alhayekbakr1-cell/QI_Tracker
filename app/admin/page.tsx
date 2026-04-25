"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Profile, UserRole } from "@/types";
import { Users, FileText, BarChart3, Settings, Shield, Plus, Upload, Trash2, Edit, Save, Trash, AlertCircle, RefreshCw, Loader2, Search, Layout } from 'lucide-react';
import PHIWarning from "@/components/PHIWarning";
import ExecutiveReportCenter from "@/components/ExecutiveReportCenter";
import BulkPersonnelImport from "@/components/BulkPersonnelImport";
import BulkProjectImport from "@/components/BulkProjectImport";
import ErrorMonitor from "@/components/Admin/ErrorMonitor";
import Link from "next/link";
import { DEFAULT_CONFERENCES, fetchRegistry, Conference } from "@/constants/conferences";
import LiveConferenceVerify from "@/components/LiveConferenceVerify";
import { runRegistryScout } from "@/utils/scout";

export default function AdminPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [registry, setRegistry] = useState<Conference[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    useEffect(() => {
        async function fetchAdminData() {
            const { data: { user } } = await supabase.auth.getUser();
            const isLocal = window.location.hostname === 'localhost';
            const bypass = isLocal && searchParams.get('bypassAuth') === 'true';

            if (!user && !bypass) {
                router.push("/login");
                return;
            }

            let profileData = null;
            if (user) {
                const { data } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();
                profileData = data;
            } else if (bypass) {
                profileData = { role: "Admin" }; // Assume Admin if bypassed
            }

            if (profileData?.role !== "Admin") {
                router.push("/"); // Redirect non-admins
                return;
            }

            setCurrentUserRole(profileData.role as UserRole);

            // Fetch All Profiles
            const { data: allProfiles, error } = await supabase
                .from("profiles")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching profiles:", error);
            } else {
                setProfiles((allProfiles || []) as Profile[]);
            }

            // Fetch Conference Registry
            const registryData = await fetchRegistry();
            setRegistry(registryData);

            setIsLoading(false);
        }

        fetchAdminData();
    }, [supabase, router]);

    const handleSyncRegistry = async () => {
        if (!confirm("This will trigger the AI to search the web for every conference in the registry. It may take 1-2 minutes. Proceed?")) return;

        setIsSyncing(true);
        try {
            await runRegistryScout();
            const updated = await fetchRegistry();
            setRegistry(updated);
            alert("Registry sync complete!");
        } catch (err) {
            console.error(err);
            alert("Failed to sync registry. See console.");
        } finally {
            setIsSyncing(false);
        }
    };

    const toggleRole = async (profileId: string, currentRole: UserRole) => {
        if (updatingId) return;
        setUpdatingId(profileId);

        // Rotation: Viewer -> Operator -> Faculty -> Viewer
        let newRole: UserRole = "Viewer";
        if (currentRole === "Viewer") newRole = "Operator";
        else if (currentRole === "Operator") newRole = "Faculty";
        else if (currentRole === "Faculty") newRole = "Viewer";

        if (currentRole === "Admin") {
            alert("Cannot demote Admin via UI for safety.");
            setUpdatingId(null);
            return;
        }

        const { error } = await supabase
            .from("profiles")
            .update({ role: newRole })
            .eq("id", profileId);

        if (error) {
            alert("Failed to update role. Check permissions.");
            console.error(error);
        } else {
            setProfiles(profiles.map(p =>
                p.id === profileId ? { ...p, role: newRole } : p
            ));
        }
        setUpdatingId(null);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-advent-navy" />
            </div>
        );
    }

    if (currentUserRole !== "Admin") return null; // Should have redirected

    const filteredProfiles = profiles.filter(p =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p as any).email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
                <div className="p-3 bg-red-100 rounded-xl text-red-600">
                    <Shield className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-advent-navy tracking-tight">
                        Admin Console
                    </h1>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-slate-500 font-medium">Manage user permissions and system access.</p>
                        <Link href="/admin/workflow" className="flex items-center gap-2 bg-advent-blue/10 text-advent-blue px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-advent-blue hover:text-white transition-all">
                            <Layout className="w-3.5 h-3.5" />
                            Workflow Board
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <ExecutiveReportCenter />
                    <ErrorMonitor />
                </div>
                <div>
                    <div className="space-y-8">
                        <BulkPersonnelImport />
                        <BulkProjectImport />
                    </div>
                </div>
            </div>
            <PHIWarning />

            {/* Conference Registry Live Check */}
            <div className="glass rounded-2xl overflow-hidden shadow-lg border-0 ring-1 ring-slate-200/50">
                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-slate-700 flex items-center gap-2">
                            <Layout className="w-5 h-5 text-amber-500" />
                            Conference Registry Live Intelligence
                        </h2>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">Cross-check academic deadlines with web-searching AI</p>
                    </div>
                    <button
                        onClick={handleSyncRegistry}
                        disabled={isSyncing}
                        className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50"
                    >
                        {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        {isSyncing ? "Syncing All..." : "Sync All via AI"}
                    </button>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(registry.length > 0 ? registry : DEFAULT_CONFERENCES).map((conf) => (
                            <div key={conf.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-3 group hover:border-amber-200 transition-all">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xs font-black text-advent-navy uppercase tracking-tight">{conf.name}</h3>
                                        <p className="text-[9px] text-slate-400 font-medium line-clamp-1">{conf.fullName}</p>
                                    </div>
                                    <div className="p-1.5 bg-slate-50 rounded-lg text-slate-300">
                                        <RefreshCw className="w-3 h-3" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-500">Registry: Annual</span>
                                        {conf.last_ai_check && (
                                            <span className="text-[8px] text-slate-400 italic">Last Sync: {new Date(conf.last_ai_check).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                    <LiveConferenceVerify conferenceName={conf.name} currentDeadline="Annual Rollover" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="glass rounded-2xl overflow-hidden shadow-lg border-0 ring-1 ring-slate-200/50">
                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="font-bold text-slate-700 flex items-center gap-2">
                        <Users className="w-5 h-5 text-advent-cobalt" />
                        Registered Users ({filteredProfiles.length})
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search names or emails..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-advent-navy/10 outline-none w-64 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-black text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProfiles.map((profile) => (
                                <tr key={profile.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {(profile as any).email || profile.full_name || "Unknown User"}
                                        {profile.full_name && (profile as any).email && (
                                            <div className="text-[10px] text-slate-400 font-normal mt-0.5">{profile.full_name}</div>
                                        )}
                                        {!profile.full_name && (
                                            <div className="text-[10px] text-slate-400 font-normal mt-0.5 italic">Name not synced from directory</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wide
                                            ${profile.role === 'Admin' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                profile.role === 'Faculty' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                                    profile.role === 'Operator' ? 'bg-advent-green/10 text-advent-green border border-advent-green/20' :
                                                        'bg-slate-100 text-slate-500 border border-slate-200'}
                                        `}>
                                            {profile.role === 'Admin' ? 'Overseer' : profile.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                        {new Date(profile.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {profile.role !== 'Admin' && (
                                            <button
                                                onClick={() => toggleRole(profile.id, profile.role)}
                                                disabled={!!updatingId}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all
                                                    ${profile.role === 'Viewer'
                                                        ? 'bg-advent-navy text-white hover:bg-advent-cobalt shadow-sm'
                                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-600'}
                                                    ${updatingId === profile.id ? 'opacity-50 cursor-not-allowed' : ''}
                                                `}
                                            >
                                                {updatingId === profile.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                                                ) : (
                                                    profile.role === 'Viewer' ? 'Promote to Op' :
                                                        profile.role === 'Operator' ? 'Promote to Faculty' : 'Reset to Viewer'
                                                )}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}
