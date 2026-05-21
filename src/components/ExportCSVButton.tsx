"use client"

import { Download, Printer } from "lucide-react";
import { Project } from "@/types";

export default function ExportCSVButton({ projects }: { projects: Project[] }) {
    const handleExport = () => {
        if (!projects || projects.length === 0) return;

        const headers = [
            "Title", 
            "Status", 
            "Category", 
            "Subcategory", 
            "Faculty Mentor", 
            "Leads", 
            "Proponents", 
            "Primary Outcome", 
            "PDSA Cycle", 
            "Estimated Cost Savings ($)", 
            "Total Patients Impacted", 
            "Last Updated"
        ];
        
        const rows = projects.map(p => [
            `"${(p.title || "").replace(/"/g, '""')}"`,
            p.status,
            p.category || "",
            p.subcategory || "",
            p.faculty || "",
            `"${(p.lead_proponents || []).join(", ").replace(/"/g, '""')}"`,
            `"${(p.proponents || []).join(", ").replace(/"/g, '""')}"`,
            `"${(p.primary_outcome || "").replace(/"/g, '""')}"`,
            p.pdsa_cycle !== undefined ? p.pdsa_cycle : 0,
            p.estimated_cost_savings !== null && p.estimated_cost_savings !== undefined ? p.estimated_cost_savings : "",
            p.total_patients_impacted !== null && p.total_patients_impacted !== undefined ? p.total_patients_impacted : "",
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

    const handlePrintPDF = () => {
        // Inject a print-specific style sheet dynamically
        const style = document.createElement('style');
        style.id = 'print-pdf-style';
        style.innerHTML = `
            @media print {
                /* Hide everything except the main content */
                nav, header, footer, .no-print, button, select, input, form, 
                .flex-col.md\\:flex-row.justify-between, [role="navigation"] {
                    display: none !important;
                }
                
                body {
                    background: white !important;
                    color: black !important;
                    font-size: 11px !important;
                    padding: 0 !important;
                    margin: 0 !important;
                }
                
                .max-w-7xl {
                    max-width: 100% !important;
                    width: 100% !important;
                    padding: 0 !important;
                    margin: 0 !important;
                }
                
                /* Keep table visible and styled for print */
                table {
                    width: 100% !important;
                    border-collapse: collapse !important;
                    page-break-inside: auto !important;
                }
                
                tr {
                    page-break-inside: avoid !important;
                    page-break-after: auto !important;
                }
                
                thead {
                    display: table-header-group !important;
                }
                
                th, td {
                    border: 1px solid #e2e8f0 !important;
                    padding: 6px 8px !important;
                    text-align: left !important;
                }
                
                th {
                    background-color: #f8fafc !important;
                    font-weight: bold !important;
                }
                
                /* Show staleness indicators clearly in print */
                .bg-red-50\\/60 {
                    background-color: #fef2f2 !important;
                }
                .bg-amber-50\\/60 {
                    background-color: #fffbeb !important;
                }
            }
        `;
        document.head.appendChild(style);

        // Open print dialogue
        window.print();

        // Cleanup style after print dialog is closed
        setTimeout(() => {
            const el = document.getElementById('print-pdf-style');
            if (el) el.remove();
        }, 1000);
    };

    return (
        <div className="flex items-center gap-2 no-print">
            <button
                onClick={handlePrintPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all hover:border-advent-blue/30 active:scale-95 group"
            >
                <Printer className="w-4 h-4 group-hover:text-advent-blue transition-colors" />
                <span>Print PDF</span>
            </button>
            <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all hover:border-advent-blue/30 active:scale-95 group"
            >
                <Download className="w-4 h-4 group-hover:text-advent-blue transition-colors" />
                <span>Export CSV</span>
            </button>
        </div>
    );
}
