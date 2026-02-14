"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Project, ProjectStatus } from "@/types";
import DashboardCharts from "@/components/DashboardCharts";
import { Download, ArrowLeft, Activity } from "lucide-react";
import Link from "next/link";
import { format, parseISO, startOfMonth } from "date-fns";
import PHIWarning from "@/components/PHIWarning";

export default function MetricsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function fetchMetricsData() {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            const { data, error } = await supabase
                .from("projects")
                .select("*")
                .order("created_at", { ascending: true }); // Order by creation for timeline

            if (error) {
                console.error(error);
            } else {
                setProjects((data || []) as Project[]);
            }
            setIsLoading(false);
        }

        fetchMetricsData();
    }, [supabase, router]);

    // Data Processing for Charts
    const statusCounts: Record<string, number> = {
        'Idea': 0, 'Pre-Intervention': 0, 'Intervention Ongoing': 0, 'Sustain the Gains': 0
    };

    const categoryCounts: Record<string, number> = {
        'Inpatient': 0, 'Outpatient': 0
    };

    // Timeline Data (Projects created per month)
    const timelineMap: Record<string, number> = {};

    projects.forEach(p => {
        // Status
        if (statusCounts[p.status] !== undefined) statusCounts[p.status]++;

        // Category
        const cat = p.category || 'Unspecified';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

        // Timeline (Cumulative Growth)
        // Use created_at or fallback to last_updated if null (shouldn't be)
        const dateStr = p.created_at || p.last_updated_date;
        if (dateStr) {
            const monthKey = format(startOfMonth(parseISO(dateStr)), 'MMM yyyy');
            timelineMap[monthKey] = (timelineMap[monthKey] || 0) + 1;
        }
    });

    const statusChartData = Object.entries(statusCounts)
        .map(([name, value]) => ({ name, value }))
        .filter(d => d.value > 0);

    const categoryChartData = Object.entries(categoryCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value); // Sort descending

    // Accumulate timeline data
    let cumulative = 0;
    const timelineChartData = Object.entries(timelineMap)
        .map(([name, count]) => {
            cumulative += count;
            return { name, value: cumulative };
        });

    // CSV Export Handler
    const handleExportCSV = () => {
        const headers = [
            "ID", "Title", "Status", "Category", "Subcategory",
            "Lead Proponent", "Faculty", "PDSA Cycle", "Last Updated", "Created At"
        ];

        const csvRows = [headers.join(",")];

        projects.forEach(p => {
            const row = [
                p.id,
                `"${p.title.replace(/"/g, '""')}"`, // Escape quotes
                p.status,
                p.category || "",
                p.subcategory || "",
                `"${(p.lead_proponents || []).join("; ")}"`,
                `"${p.faculty || ""}"`,
                p.pdsa_cycle,
                p.last_updated_date ? format(parseISO(p.last_updated_date), 'yyyy-MM-dd') : "",
                p.created_at ? format(parseISO(p.created_at), 'yyyy-MM-dd') : ""
            ];
            csvRows.push(row.join(","));
        });

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `qi_projects_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/projects" className="p-2 bg-white rounded-full text-slate-400 hover:text-advent-navy hover:bg-slate-100 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-advent-navy tracking-tight flex items-center gap-3">
                            <Activity className="w-8 h-8 text-advent-green" />
                            Program Metrics
                        </h1>
                        <p className="text-slate-500 font-medium">Real-time stats and data export.</p>
                    </div>
                </div>

                <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 bg-advent-navy text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-advent-navy/20 hover:bg-advent-cobalt transition-all active:scale-95 group"
                >
                    <Download className="w-4 h-4 group-hover:animate-bounce" />
                    <span>Download CSV Data</span>
                </button>
            </div>

            <PHIWarning />

            <div className="bg-gradient-to-r from-advent-navy to-advent-cobalt p-1 rounded-2xl shadow-xl">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6">
                    <DashboardCharts
                        statusData={statusChartData}
                        categoryData={categoryChartData}
                        timelineData={timelineChartData}
                    />
                </div>
            </div>

            <div className="glass p-8 rounded-2xl text-center">
                <h3 className="text-xl font-bold text-advent-navy mb-2">Need a custom report?</h3>
                <p className="text-slate-500 mb-6">Download the CSV above and open it in Excel for custom pivot tables and advanced analysis.</p>
                <button
                    onClick={handleExportCSV}
                    className="text-advent-cobalt font-bold hover:underline"
                >
                    Export Raw Data Now
                </button>
            </div>
        </div>
    );
}
