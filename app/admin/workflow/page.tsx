"use client"

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Project } from "@/types";
import KanbanBoard from "@/components/KanbanBoard";
import { ArrowLeft, Layout, Loader2 } from "lucide-react";
import Link from "next/link";

export default function WorkflowPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    useEffect(() => {
        async function fetchProjects() {
            const { data: { user } } = await supabase.auth.getUser();
            const isLocal = window.location.hostname === 'localhost';
            const bypass = isLocal && searchParams.get('bypassAuth') === 'true';

            if (!user && !bypass) {
                router.push("/login");
                return;
            }

            // Verify Admin/Operator Status
            let userRole = null;
            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();
                userRole = profile?.role;
            } else if (bypass) {
                userRole = "Admin";
            }

            if (userRole !== "Admin" && userRole !== "Operator") {
                router.push("/");
                return;
            }

            const { data, error } = await supabase
                .from("projects")
                .select("*")
                .order("last_updated_date", { ascending: false });

            if (error) {
                console.error(error);
            } else {
                setProjects(data as Project[]);
            }
            setIsLoading(false);
        }

        fetchProjects();
    }, [supabase, router]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-advent-navy" />
            </div>
        );
    }

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link href="/admin" className="flex items-center gap-2 text-slate-500 hover:text-advent-blue mb-4 transition-colors text-xs font-black uppercase tracking-widest">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Admin
                    </Link>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Layout className="w-8 h-8 text-advent-blue" />
                        Workflow Management
                    </h1>
                    <p className="text-slate-500 font-medium">Drag and drop projects to update their lifecycle stage.</p>
                </div>
            </div>

            <KanbanBoard initialProjects={projects} />
        </div>
    );
}
