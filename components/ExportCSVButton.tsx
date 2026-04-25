"use client"

import { Download } from "lucide-react";
import { Project } from "@/types";

export default function ExportCSVButton({ projects }: { projects: Project[] }) {
    const handleExport = () => {
        if (!projects || projects.length === 0) return;

        const headers = ["Title", "Status", "Category", "Subcategory", "Faculty", "Leads", "Proponents", "Primary Outcome", "Last Updated"];
        const rows = projects.map(p => [
            `"${(p.title || "").replace(/"/g, '""')}"`,
            p.status,
            p.category,
            p.subcategory || "",
            p.faculty || "",
            `"${(p.lead_proponents || []).join(", ").replace(/"/g, '""')}"`,
            `"${(p.proponents || []).join(", ").replace(/"/g, '""')}"`,
            `"${(p.primary_outcome || "").replace(/"/g, '""')}"`,
            p.last_updated_date
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", `QI_Projects_Export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all hover:border-advent-blue/30 active:scale-95 group"
        >
            <Download className="w-4 h-4 group-hover:text-advent-blue transition-colors" />
            <span>Export CSV</span>
        </button>
    );
}
