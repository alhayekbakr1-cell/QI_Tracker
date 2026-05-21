"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Project } from "@/types";
import DashboardCharts from "@/components/DashboardCharts";
import { Download, ArrowLeft, Activity } from "lucide-react";
import Link from "next/link";
import { format, parseISO, startOfMonth, subDays, isBefore } from "date-fns";
import PHIWarning from "@/components/PHIWarning";
import { Skeleton } from "@/components/ui/custom-ui";

export default function MetricsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState<"all" | "30" | "90" | "365">("all");
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

    if (isLoading) {
        return (
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48 rounded-xl" />
                            <Skeleton className="h-4 w-32 rounded-lg" />
                        </div>
                    </div>
                    <Skeleton className="h-12 w-48 rounded-xl" />
                </div>
                <Skeleton className="h-16 w-full rounded-3xl" />
                <Skeleton className="h-20 w-full rounded-3xl" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-80 rounded-[2rem]" />
                    <Skeleton className="h-80 rounded-[2rem]" />
                    <Skeleton className="h-80 rounded-[2rem]" />
                </div>
            </div>
        );
    }

    // Filter projects based on date range selection
    const filteredProjects = projects.filter(p => {
        if (dateRange === "all") return true;
        const lastUpdate = new Date(p.last_updated_date);
        const cutoff = subDays(new Date(), parseInt(dateRange));
        return isBefore(cutoff, lastUpdate);
    });

    // Data Processing for Charts
    const statusCounts: Record<string, number> = {
        'Idea': 0, 
        'Pre-Intervention': 0, 
        'Intervention Ongoing': 0, 
        'Sustain the Gains': 0,
        'Impacted (Completed)': 0
    };

    const categoryCounts: Record<string, number> = {
        'Inpatient': 0, 
        'Outpatient': 0
    };

    // Timeline Data (Projects created per month)
    const timelineMap: Record<string, number> = {};

    filteredProjects.forEach(p => {
        // Status
        if (statusCounts[p.status] !== undefined) {
            statusCounts[p.status]++;
        } else {
            statusCounts[p.status] = 1;
        }

        // Category
        const cat = p.category || 'Unspecified';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

        // Timeline (Cumulative Growth)
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

        filteredProjects.forEach(p => {
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

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/projects" className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-advent-navy hover:bg-slate-50 transition-all rounded-full shadow-sm">
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
                    className="flex items-center gap-2 bg-advent-navy text-white px-5 py-3 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-advent-navy/20 hover:bg-advent-cobalt transition-all active:scale-[0.98] group text-xs"
                >
                    <Download className="w-4 h-4 group-hover:animate-bounce" />
                    <span>Download CSV Data</span>
                </button>
            </div>

            <PHIWarning />

            {/* Interactive Period Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-100/30">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Analysis Period</span>
                <div className="flex flex-wrap gap-1.5">
                    {(["all", "30", "90", "365"] as const).map((range) => {
                        const labels = { all: "All Time", "30": "Last 30 Days", "90": "Last 90 Days", "365": "Last Year" };
                        const active = dateRange === range;
                        return (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                                    active
                                        ? "bg-advent-navy text-white shadow-md shadow-advent-navy/15"
                                        : "bg-slate-50 text-slate-500 border border-slate-200/60 hover:bg-slate-100/60"
                                }`}
                            >
                                {labels[range]}
                            </button>
                        );
                    })}
                </div>
            </div>

            {filteredProjects.length === 0 ? (
                <div className="py-24 text-center bg-white rounded-[2.5rem] border border-slate-200/80 shadow-xl shadow-slate-100/30 p-8 space-y-4">
                    <p className="text-slate-400 font-black text-lg">No initiatives found in this time range.</p>
                    <p className="text-slate-300 text-xs font-black uppercase tracking-wider max-w-md mx-auto leading-relaxed">
                        Adjust your time filter or register new metrics to populate real-time dashboards.
                    </p>
                    <button
                        onClick={() => setDateRange("all")}
                        className="px-5 py-3 bg-advent-navy text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-advent-navy/10 hover:bg-advent-cobalt transition-all active:scale-[0.98]"
                    >
                        Reset to All Time
                    </button>
                </div>
            ) : (
                <div className="bg-gradient-to-r from-advent-navy to-advent-cobalt p-1 rounded-[2.5rem] shadow-2xl">
                    <div className="bg-white/95 backdrop-blur-sm rounded-[2.3rem] p-6 sm:p-8">
                        <DashboardCharts
                            statusData={statusChartData}
                            categoryData={categoryChartData}
                            timelineData={timelineChartData}
                        />
                    </div>
                </div>
            )}

            <div className="bg-slate-50 p-8 rounded-[2.5rem] text-center border border-slate-200 border-dashed">
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Need a custom report?</h3>
                <p className="text-slate-500 font-medium mb-6 text-sm">Download the CSV above and open it in Excel for custom pivot tables and advanced analysis.</p>
                <button
                    onClick={handleExportCSV}
                    className="text-advent-navy font-black text-xs uppercase tracking-widest hover:text-advent-cobalt transition-colors"
                >
                    Export Raw Data Now &rarr;
                </button>
            </div>
        </div>
    );
}
