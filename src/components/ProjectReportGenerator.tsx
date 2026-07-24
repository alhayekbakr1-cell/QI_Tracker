"use client"

import React, { useRef } from 'react';
import { Project, Metric } from '@/types';
import { format } from 'date-fns';
import { Download, FileText, CheckCircle2, TrendingUp, Trophy, User, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { exportToSquireWord } from '@/utils/squireExporter';
import { toast } from '@/components/ui/custom-ui';

interface ProjectReportGeneratorProps {
    project: Project;
    metrics: Metric[];
}

export default function ProjectReportGenerator({ project, metrics }: ProjectReportGeneratorProps) {
    const reportRef = useRef<HTMLDivElement>(null);

    const handleDownload = async () => {
        if (!reportRef.current) return;

        // Briefly show the report for capture
        const element = reportRef.current;
        element.style.display = 'block';

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`QI_Report_${project.title.replace(/\s+/g, '_')}.pdf`);
            toast.success('Executive PDF report downloaded successfully!');
        } catch (error) {
            console.error('PDF Generation Error:', error);
            toast.error('Failed to generate PDF report.');
        } finally {
            element.style.display = 'none';
        }
    };

    const handleWordExport = async () => {
        try {
            await exportToSquireWord(project, metrics);
            toast.success('SQUIRE 2.0 manuscript draft exported successfully!');
        } catch (error) {
            console.error('Word Export Error:', error);
            toast.error('Failed to generate SQUIRE 2.0 Word draft.');
        }
    };

    return (
        <>
            <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 bg-advent-navy text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-advent-cobalt transition-all shadow-lg shadow-advent-navy/10 cursor-pointer"
                >
                    <Download className="w-4 h-4" />
                    Executive PDF
                </button>

                <button
                    onClick={handleWordExport}
                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
                >
                    <FileText className="w-4 h-4 text-advent-navy" />
                    SQUIRE 2.0 Word
                </button>
            </div>

            {/* Hidden Report Template (Rendered only for capture) */}
            <div
                ref={reportRef}
                style={{ display: 'none', width: '800px', padding: '60px', backgroundColor: 'white' }}
                className="font-sans text-slate-900"
            >
                {/* Institutional Header */}
                <div className="flex justify-between items-start border-b-4 border-advent-navy pb-8 mb-10">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-advent-navy">AdventHealth</h1>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Quality Improvement Briefing</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-black text-slate-900">{format(new Date(), 'MMMM d, yyyy')}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project ID: {project.id.slice(0, 8)}</p>
                    </div>
                </div>

                {/* Project Title Section */}
                <div className="mb-12">
                    <span className="inline-block px-3 py-1 bg-advent-navy text-white text-[10px] font-black uppercase tracking-widest rounded-md mb-4">
                        {project.status}
                    </span>
                    <h2 className="text-4xl font-black text-slate-900 leading-tight tracking-tight mb-4">
                        {project.title}
                    </h2>
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <User className="w-4 h-4" /> {project.faculty} (Mentor)
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <Calendar className="w-4 h-4" /> Updated {format(new Date(project.last_updated_date), 'MMM d, yyyy')}
                        </div>
                    </div>
                </div>

                {/* Main Focus: SMART Aim */}
                <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Primary Objective (SMART Aim)</h3>
                    </div>
                    <p className="text-xl font-medium text-slate-800 leading-relaxed italic">
                        "{project.primary_outcome || "Objective not yet defined."}"
                    </p>
                </div>

                {/* Summary & Barriers */}
                <div className="grid grid-cols-2 gap-10 mb-10">
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> Current Progress
                        </h3>
                        <p className="text-sm font-medium text-slate-700 leading-relaxed">
                            {project.updates_and_barriers || "No recent updates recorded."}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Personnel
                        </h3>
                        <div className="space-y-2">
                            {project.lead_proponents.map(lead => (
                                <div key={lead} className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-advent-blue" /> {lead}
                                </div>
                            ))}
                            {project.proponents.map(prop => (
                                <div key={prop} className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-slate-300" /> {prop}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* PDSA Cycle Info */}
                <div className="border-t border-slate-100 pt-10 mt-20">
                    <div className="flex justify-between items-center bg-advent-navy/5 p-6 rounded-2xl">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-advent-navy mb-1">Active Methodology</p>
                            <h4 className="text-lg font-black text-slate-900">PDSA Cycle {project.pdsa_cycle}</h4>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Institutional Category</p>
                            <p className="text-sm font-bold text-slate-800">{project.category}</p>
                        </div>
                    </div>
                </div>

                {/* Institutional Footer */}
                <div className="absolute bottom-10 left-15 right-15 flex justify-between border-t border-slate-100 pt-8 opacity-50">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Strictly Internal Use Only</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Athena Clinical Registry System</p>
                </div>
            </div>
        </>
    );
}
