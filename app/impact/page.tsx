"use client"

import ImpactDashboard from '@/components/ImpactDashboard'
import { ArrowLeft, Download, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function InstitutionalImpactPage() {
    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-advent-blue mb-4 transition-colors text-sm font-semibold group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Overview
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Institutional Impact</h1>
                    <p className="text-slate-500 mt-2 font-medium max-w-2xl">
                        A real-time aggregate of Quality Improvement outcomes across all GME departments, showing institutional reached volume and value-based care outcomes.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-xs"
                    >
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-2xl border border-emerald-100">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Validated Data</span>
                    </div>
                </div>
            </div>

            <ImpactDashboard />

            <div className="mt-16 p-10 bg-white border border-slate-200 rounded-[3rem] text-center border-dashed">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">Board-Ready Reporting</h2>
                <p className="text-slate-500 font-medium max-w-xl mx-auto mb-8">
                    The data above is aggregated from active project metrics and verified milestone approvals. It represents the quantifiable value of the residency research program.
                </p>
                <div className="flex justify-center gap-4">
                    <div className="px-6 py-3 bg-slate-50 rounded-2xl text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Verified by Chief Residents</div>
                    <div className="px-6 py-3 bg-slate-50 rounded-2xl text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Validated by Faculty Mentors</div>
                </div>
            </div>
        </div>
    )
}
