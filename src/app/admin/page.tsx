"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Profile, UserRole } from "@/types";
import { Shield, Users, Check, X, Loader2 } from "lucide-react";
import PHIWarning from "@/components/PHIWarning";
import ExecutiveReportCenter from "@/components/ExecutiveReportCenter";

export default function AdminPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function fetchAdminData() {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            // Verify Admin Status
            const { data: currentUserProfile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (currentUserProfile?.role !== "Admin") {
                router.push("/"); // Redirect non-admins
                return;
            }

            setCurrentUserRole("Admin");

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
            setIsLoading(false);
        }

        fetchAdminData();
    }, [supabase, router]);

    const toggleRole = async (profileId: string, currentRole: UserRole) => {
        if (updatingId) return; // Prevent double comments
        setUpdatingId(profileId);

        // Logic: Viewer -> Operator -> Viewer. Admin stays Admin (manually set in DB for safety)
        const newRole: UserRole = currentRole === "Viewer" ? "Operator" : "Viewer";

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
                    <p className="text-slate-500 font-medium">Manage user permissions and system access.</p>
                </div>
            </div>

            <ExecutiveReportCenter />
            <PHIWarning />

            <div className="glass rounded-2xl overflow-hidden shadow-lg border-0 ring-1 ring-slate-200/50">
                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="font-bold text-slate-700 flex items-center gap-2">
                        <Users className="w-5 h-5 text-advent-cobalt" />
                        Registered Users ({profiles.length})
                    </h2>
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
                            {profiles.map((profile) => (
                                <tr key={profile.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {(profile as any).email || profile.full_name || "Unknown User"}
                                        <div className="text-xs text-slate-400 font-normal mt-0.5">{profile.id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wide
                                            ${profile.role === 'Admin' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                profile.role === 'Operator' ? 'bg-advent-green/10 text-advent-green border border-advent-green/20' :
                                                    'bg-slate-100 text-slate-500 border border-slate-200'}
                                        `}>
                                            {profile.role}
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
                                                    profile.role === 'Viewer' ? 'Make Operator' : 'Revoke Access'
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
        </div>
    );
}
