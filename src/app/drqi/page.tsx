"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";
import { useEffect, useState } from "react";
import QIConsultantWorkspace from "@/components/QIConsultantWorkspace";

export default function DrQIPage() {
    const router = useRouter();
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function checkAuth() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
            } else {
                setIsLoading(false);
            }
        }
        checkAuth();
    }, [supabase, router]);

    if (isLoading) {
        return (
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center justify-center min-h-[400px] animate-pulse">
                <div className="bg-slate-200 w-12 h-12 rounded-full mb-4" />
                <div className="h-4 w-32 bg-slate-200 rounded" />
            </div>
        );
    }

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="mb-8">
                <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-slate-400">Interactive GME Mentor</span>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 font-sans mt-1">
                    <Bot className="w-8 h-8 text-advent-navy" />
                    Dr. QI Consultant
                </h1>
                <p className="text-slate-500 max-w-2xl mt-2 font-medium">
                    Your interactive senior academic Quality Improvement and research mentor. Outline aim statements, design process metrics, design PDSA rapid tests, or run an IRB determination pre-screening.
                </p>
            </div>
            
            {/* Branded Workspace Container */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 p-6 md:p-8 shadow-xs relative overflow-hidden animate-in fade-in duration-500">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-advent-navy via-advent-sky to-advent-green" />
                <QIConsultantWorkspace />
            </div>
        </div>
    );
}
