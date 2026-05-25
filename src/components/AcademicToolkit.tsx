"use client"

import React, { useState, useEffect } from 'react'
import {
    FileText, Sparkles, CheckCircle, Clipboard,
    ArrowRight, RefreshCw, BarChart2, Users, Save, HelpCircle,
    UserCheck, ShieldAlert, Copy, Plus, Trash2
} from 'lucide-react'

// Types for components
type RACIRole = 'R' | 'A' | 'C' | 'I' | '-'

export default function AcademicToolkit() {
    const [activeTab, setActiveTab] = useState<'irb' | 'runchart' | 'squire' | 'raci' | 'sustainability' | 'fishbone' | 'epicticket'>('irb')

    return (
        <div className="academic-card p-6 sm:p-8 space-y-6">
            {/* Header Block */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 pb-5">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <span className="w-5 h-px bg-slate-350" /> GME Scholarly Resources
                    </div>
                    <h2 className="text-2xl font-serif italic font-bold text-slate-900 tracking-tight">
                        Academic QI <span className="font-sans not-italic text-advent-navy font-black">Toolkit</span>
                    </h2>
                    <p className="text-slate-400 text-xs font-semibold">
                        Pre-vetted clinical resources, run chart analyzers, and abstract compilers for residency portfolios.
                    </p>
                </div>

                {/* Tab selector menu */}
                <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/50">
                    {(['irb', 'runchart', 'squire', 'raci', 'sustainability', 'fishbone', 'epicticket'] as const).map((tab) => {
                        const labels = {
                            irb: 'IRB QA Wizard',
                            runchart: 'Run-Chart Builder',
                            squire: 'SQUIRE Helper',
                            raci: 'RACI Matrix',
                            sustainability: 'Spread Ledger',
                            fishbone: 'Fishbone SVG',
                            epicticket: 'Epic EMR Ticket'
                        }
                        const icons = {
                            irb: HelpCircle,
                            runchart: BarChart2,
                            squire: FileText,
                            raci: Users,
                            sustainability: UserCheck,
                            fishbone: Sparkles,
                            epicticket: Clipboard
                        }
                        const Icon = icons[tab]
                        const isActive = activeTab === tab

                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
                                    isActive
                                        ? 'bg-white text-advent-navy border border-slate-200/80 shadow-3xs'
                                        : 'text-slate-500 hover:text-slate-800 border border-transparent'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{labels[tab]}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Tab Contents */}
            <div className="pt-2 animate-in fade-in duration-300">
                {activeTab === 'irb' && <IRBWizard />}
                {activeTab === 'runchart' && <RunChartBuilder />}
                {activeTab === 'squire' && <SquireHelper />}
                {activeTab === 'raci' && <RaciPlanner />}
                {activeTab === 'sustainability' && <SustainabilityLedger />}
                {activeTab === 'fishbone' && <FishboneBuilder />}
                {activeTab === 'epicticket' && <EpicTicketGenerator />}
            </div>
        </div>
    )
}

/* ==========================================
   1. IRB QA DETERMINATION WIZARD
   ========================================== */
function IRBWizard() {
    const [step, setStep] = useState(1)
    const [title, setTitle] = useState("Hand Hygiene Protocol in the MICU")
    const [q1, setQ1] = useState<boolean | null>(null) // Local clinical improvement?
    const [q2, setQ2] = useState<boolean | null>(null) // Intent to generalize?
    const [q3, setQ3] = useState<boolean | null>(null) // Direct intervention on patients outside standard?
    const [q4, setQ4] = useState<boolean | null>(null) // PHI exposure?
    const [copied, setCopied] = useState(false)

    const handleReset = () => {
        setStep(1)
        setQ1(null)
        setQ2(null)
        setQ3(null)
        setQ4(null)
        setCopied(false)
    }

    const isQI = q1 === true && q2 === false && q3 === false && q4 === false

    const determinationMemo = `AH-GME CLINICAL QUALITY IMPROVEMENT DETERMINATION REGISTRY
Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Project Title: ${title || "Clinical Registry Initiative"}
Evaluation Standard: DHHS Human Subjects Research Guidelines (45 CFR 46.102)

DETERMINATION: QUALITY IMPROVEMENT (Not Human Subjects Research)
This GME initiative constitutes Quality Improvement (QI). The primary aim is local practice modification and standard-of-care optimization within AdventHealth clinical settings. This activity does not meet the federal regulatory definition of research as a "systematic investigation designed to develop or contribute to generalizable knowledge." 

Institutional Review Board (IRB) approval is not required. Investigators must adhere strictly to GME guidelines and avoid releasing Patient Identifiable Health Information (PHI) in external summaries.`

    const copyToClipboard = () => {
        navigator.clipboard.writeText(determinationMemo)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-slate-650 text-xs font-semibold leading-relaxed">
                <ShieldAlert className="w-5 h-5 text-advent-navy shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-serif italic font-bold text-slate-800 text-sm mb-1">GME Ethics Gatekeeper</h4>
                    Use this wizard to verify if your proposed clinical project constitutes standard Quality Improvement (not requiring IRB review) or if it constitutes Human Subjects Research.
                </div>
            </div>

            {step === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project Working Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter project focus area..."
                            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200/60 rounded-xl text-xs font-semibold outline-none focus:border-advent-navy focus:bg-white transition-all"
                        />
                    </div>

                    <div className="bg-slate-50/30 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                        <p className="text-xs font-bold text-slate-700">1. Is the primary intent of this project to evaluate and improve local healthcare delivery or outcomes within an AdventHealth department?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setQ1(true)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    q1 === true
                                        ? 'bg-advent-navy text-white shadow-3xs'
                                        : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-500'
                                }`}
                            >
                                Yes (QI Intent)
                            </button>
                            <button
                                onClick={() => setQ1(false)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    q1 === false
                                        ? 'bg-rose-500 text-white shadow-3xs'
                                        : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-500'
                                }`}
                            >
                                No (Research Intent)
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            disabled={q1 === null}
                            onClick={() => setStep(2)}
                            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                            Continue <ArrowRight className="w-3.5 h-3.5 text-advent-green" />
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-5 animate-in slide-in-from-right duration-200">
                    <div className="bg-slate-50/30 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                        <p className="text-xs font-bold text-slate-700">2. Do you intend to publish/present this work with the goal of generalizing results to other institutions beyond AdventHealth (e.g. testing a novel biological hypothesis)?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setQ2(true)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    q2 === true
                                        ? 'bg-rose-500 text-white shadow-3xs'
                                        : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-500'
                                }`}
                            >
                                Yes (HSR Intent)
                            </button>
                            <button
                                onClick={() => setQ2(false)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    q2 === false
                                        ? 'bg-advent-navy text-white shadow-3xs'
                                        : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-500'
                                }`}
                            >
                                No (Local Scope)
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-50/30 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                        <p className="text-xs font-bold text-slate-700">3. Does this project involve introducing unapproved or experimental clinical procedures/devices outside of clinical standards?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setQ3(true)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    q3 === true
                                        ? 'bg-rose-500 text-white shadow-3xs'
                                        : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-500'
                                }`}
                            >
                                Yes (Clinical Trial)
                            </button>
                            <button
                                onClick={() => setQ3(false)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    q3 === false
                                        ? 'bg-advent-navy text-white shadow-3xs'
                                        : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-500'
                                }`}
                            >
                                No (Standard Care)
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between pt-2">
                        <button
                            onClick={() => setStep(1)}
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                            Back
                        </button>
                        <button
                            disabled={q2 === null || q3 === null}
                            onClick={() => setStep(3)}
                            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                            Continue <ArrowRight className="w-3.5 h-3.5 text-advent-green" />
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-5 animate-in slide-in-from-right duration-200">
                    <div className="bg-slate-50/30 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                        <p className="text-xs font-bold text-slate-700">4. Will patient-identifiable healthcare information (PHI) be disclosed outside of standard clinical systems or the GME secure OneDrive vault?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setQ4(true)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    q4 === true
                                        ? 'bg-rose-500 text-white shadow-3xs'
                                        : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-500'
                                }`}
                            >
                                Yes (Exposes PHI)
                            </button>
                            <button
                                onClick={() => setQ4(false)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    q4 === false
                                        ? 'bg-advent-navy text-white shadow-3xs'
                                        : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-500'
                                }`}
                            >
                                No (Zero-PHI Compliance)
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between pt-2">
                        <button
                            onClick={() => setStep(2)}
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                            Back
                        </button>
                        <button
                            disabled={q4 === null}
                            onClick={() => setStep(4)}
                            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                            Get Determination <ArrowRight className="w-3.5 h-3.5 text-advent-green" />
                        </button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="space-y-6 animate-in zoom-in-95 duration-300">
                    {isQI ? (
                        <div className="space-y-4">
                            <div className="p-5 bg-emerald-500/5 border border-emerald-200 rounded-2xl flex gap-3.5">
                                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-serif italic font-bold text-emerald-950 text-base">Registry Pre-Determination: QI Initiative</h4>
                                    <p className="text-emerald-700 text-xs font-semibold mt-1">
                                        Congratulations! Your project meets the official GME criteria for standard Quality Improvement. No standard IRB research protocol submission is required.
                                    </p>
                                </div>
                            </div>

                            <div className="relative">
                                <pre className="w-full bg-slate-950 text-slate-250 p-6 rounded-2xl text-[10px] font-mono leading-relaxed whitespace-pre-wrap border border-slate-800 shadow-lg select-all">
                                    {determinationMemo}
                                </pre>
                                <button
                                    onClick={copyToClipboard}
                                    className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg border border-white/10 transition-all flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest"
                                    title="Copy Memo to Clipboard"
                                >
                                    <Clipboard className="w-3.5 h-3.5 text-advent-green" />
                                    <span>{copied ? 'Copied!' : 'Copy Memo'}</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 bg-rose-500/5 border border-rose-200 rounded-2xl flex gap-4">
                            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
                            <div className="space-y-2">
                                <h4 className="font-serif italic font-bold text-rose-950 text-base">IRB Review Formally Indicated</h4>
                                <p className="text-rose-700 text-xs font-semibold leading-relaxed">
                                    Based on your answers, this initiative includes research-centric intents, exposures, or experimental parameters. This project meets the DHHS criteria for Human Subjects Research and requires formal submission to the AdventHealth IRB.
                                </p>
                                <div className="pt-2">
                                    <a
                                        href="https://irb.adventhealth.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block bg-slate-900 text-white px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
                                    >
                                        Visit AdventHealth IRB Portal
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Restart Evaluation
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ==========================================
   2. PDSA RUN-CHART BUILDER
   ========================================== */
function RunChartBuilder() {
    const [baselineStr, setBaselineStr] = useState("45, 48, 42, 50, 47")
    const [interventionStr, setInterventionStr] = useState("65, 72, 70, 78, 82")
    const [baselineData, setBaselineData] = useState<number[]>([45, 48, 42, 50, 47])
    const [interventionData, setInterventionData] = useState<number[]>([65, 72, 70, 78, 82])
    const [median, setMedian] = useState(48)
    const [alerts, setAlerts] = useState<string[]>([])

    // Parse data when input strings change
    const handleRecalculate = () => {
        const parseNums = (str: string) =>
            str.split(',')
                .map(n => parseFloat(n.trim()))
                .filter(n => !isNaN(n))

        const base = parseNums(baselineStr)
        const interv = parseNums(interventionStr)

        if (base.length === 0) return

        setBaselineData(base)
        setInterventionData(interv)

        // Calculate combined baseline median
        const sortedBase = [...base].sort((a, b) => a - b)
        const mid = Math.floor(sortedBase.length / 2)
        const medValue = sortedBase.length % 2 !== 0 ? sortedBase[mid] : (sortedBase[mid - 1] + sortedBase[mid]) / 2
        setMedian(medValue)

        // IHI Run-Chart Rules Analysis
        const combined = [...base, ...interv]
        const computedAlerts: string[] = []

        // Rule 1: Shift (6 or more consecutive points either all above or all below the median)
        let consecutiveAbove = 0
        let consecutiveBelow = 0
        let maxShiftAbove = 0
        let maxShiftBelow = 0

        combined.forEach(p => {
            if (p > medValue) {
                consecutiveAbove++
                consecutiveBelow = 0
                maxShiftAbove = Math.max(maxShiftAbove, consecutiveAbove)
            } else if (p < medValue) {
                consecutiveBelow++
                consecutiveAbove = 0
                maxShiftBelow = Math.max(maxShiftBelow, consecutiveBelow)
            } else {
                // Points exactly on the median do not count for shifts
                consecutiveAbove = 0
                consecutiveBelow = 0
            }
        })

        if (maxShiftAbove >= 6 || maxShiftBelow >= 6) {
            computedAlerts.push(`✓ SHIFT DETECTED: A run of ${Math.max(maxShiftAbove, maxShiftBelow)} consecutive points sits entirely on one side of the median, indicating a statistically significant clinical change.`)
        }

        // Rule 2: Trend (5 or more consecutive points continuously increasing or continuously decreasing)
        let incCount = 1
        let decCount = 1
        let maxInc = 1
        let maxDec = 1

        for (let i = 1; i < combined.length; i++) {
            if (combined[i] > combined[i - 1]) {
                incCount++
                decCount = 1
                maxInc = Math.max(maxInc, incCount)
            } else if (combined[i] < combined[i - 1]) {
                decCount++
                incCount = 1
                maxDec = Math.max(maxDec, decCount)
            } else {
                incCount = 1
                decCount = 1
            }
        }

        if (maxInc >= 5 || maxDec >= 5) {
            computedAlerts.push(`✓ TREND DETECTED: Runc-chart indicates ${Math.max(maxInc, maxDec)} consecutive points steadily ${maxInc >= 5 ? 'increasing' : 'decreasing'}. This establishes a non-random trend pattern.`)
        }

        if (computedAlerts.length === 0) {
            computedAlerts.push("No specific run-chart rule violations (shifts or trends) detected. Continue tracking standard PDSA cycles to accumulate sufficient data.")
        }

        setAlerts(computedAlerts)
    }

    useEffect(() => {
        handleRecalculate()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // SVG coordinates computation helper
    const combinedData = [...baselineData, ...interventionData]
    const maxVal = Math.max(...combinedData, median) * 1.15
    const minVal = Math.min(...combinedData, median) * 0.85
    const padding = 40
    const chartHeight = 220
    const chartWidth = 500

    const getX = (idx: number) => padding + (idx * (chartWidth - padding * 2)) / (combinedData.length - 1 || 1)
    const getY = (val: number) => chartHeight - padding - ((val - minVal) * (chartHeight - padding * 2)) / (maxVal - minVal || 1)

    return (
        <div className="space-y-6">
            <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-slate-650 text-xs font-semibold leading-relaxed">
                <BarChart2 className="w-5 h-5 text-advent-navy shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-serif italic font-bold text-slate-800 text-sm mb-1">Analytical Run-Chart Engine</h4>
                    Academic QI publishes run charts rather than simple bar charts. Enter comma-separated metric points to automatically generate clean, publication-ready SVG run charts with standard IHI rule verification.
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Data Input Fields */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Baseline Metrics (e.g. pre-PDSA)</label>
                        <input
                            type="text"
                            value={baselineStr}
                            onChange={(e) => setBaselineStr(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200/60 rounded-xl text-xs font-semibold outline-none focus:border-advent-navy focus:bg-white transition-all font-mono"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Post-Intervention Metrics (e.g. post-PDSA)</label>
                        <input
                            type="text"
                            value={interventionStr}
                            onChange={(e) => setInterventionStr(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200/60 rounded-xl text-xs font-semibold outline-none focus:border-advent-navy focus:bg-white transition-all font-mono"
                        />
                    </div>

                    <button
                        onClick={handleRecalculate}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3 px-4 rounded-xl text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-transparent shadow-xs"
                    >
                        <RefreshCw className="w-3.5 h-3.5 text-advent-green" />
                        Calculate Median & Analyze Rules
                    </button>

                    {/* Quality Rules Report Box */}
                    <div className="bg-slate-50/40 border border-slate-200/60 rounded-2xl p-4 space-y-3">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">IHI Rule Verification</span>
                        <div className="space-y-2">
                            {alerts.map((al, idx) => (
                                <p
                                    key={idx}
                                    className={`text-[10px] font-semibold leading-relaxed ${
                                        al.startsWith('✓') ? 'text-emerald-700' : 'text-slate-550'
                                    }`}
                                >
                                    {al}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Live SVG Graph Canvas */}
                <div className="bg-white border border-slate-200/60 rounded-3xl p-4 flex flex-col justify-between shadow-2xs">
                    <div className="flex justify-between items-center px-2 mb-2">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Interactive SVG Visualizer</span>
                        <div className="flex gap-3 text-[8px] font-black uppercase tracking-widest">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400" /> Baseline</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-advent-navy" /> Intervention</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t border-dashed border-rose-500" /> Median ({median})</span>
                        </div>
                    </div>

                    <div className="relative w-full overflow-hidden flex items-center justify-center">
                        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                            {/* Gridlines */}
                            <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#F1F5F9" strokeWidth="1" />
                            <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#F1F5F9" strokeWidth="1" />

                            {/* Median dashed reference line */}
                            <line
                                x1={padding}
                                y1={getY(median)}
                                x2={chartWidth - padding}
                                y2={getY(median)}
                                stroke="#EF4444"
                                strokeWidth="1.5"
                                strokeDasharray="4 4"
                            />
                            <text x={chartWidth - padding + 5} y={getY(median) + 4} fill="#EF4444" fontSize="8" fontWeight="bold" fontFamily="monospace">
                                MEDIAN
                            </text>

                            {/* Plotted points line for Baseline */}
                            {baselineData.map((val, idx) => {
                                if (idx === 0) return null
                                return (
                                    <line
                                        key={`bl-l-${idx}`}
                                        x1={getX(idx - 1)}
                                        y1={getY(baselineData[idx - 1])}
                                        x2={getX(idx)}
                                        y2={getY(val)}
                                        stroke="#94A3B8"
                                        strokeWidth="2.5"
                                    />
                                )
                            })}

                            {/* Connector baseline -> intervention */}
                            {interventionData.length > 0 && (
                                <line
                                    x1={getX(baselineData.length - 1)}
                                    y1={getY(baselineData[baselineData.length - 1])}
                                    x2={getX(baselineData.length)}
                                    y2={getY(interventionData[0])}
                                    stroke="#CBD5E1"
                                    strokeWidth="1.5"
                                    strokeDasharray="2 2"
                                />
                            )}

                            {/* Plotted points line for Intervention */}
                            {interventionData.map((val, idx) => {
                                if (idx === 0) return null
                                const globalIdx = baselineData.length + idx
                                return (
                                    <line
                                        key={`int-l-${idx}`}
                                        x1={getX(globalIdx - 1)}
                                        y1={getY(interventionData[idx - 1])}
                                        x2={getX(globalIdx)}
                                        y2={getY(val)}
                                        stroke="#004F9F"
                                        strokeWidth="3"
                                    />
                                )
                            })}

                            {/* Node markers (dots) for Baseline */}
                            {baselineData.map((val, idx) => (
                                <g key={`bl-p-${idx}`}>
                                    <circle cx={getX(idx)} cy={getY(val)} r="4.5" fill="#FFFFFF" stroke="#64748B" strokeWidth="2.5" />
                                    <text x={getX(idx) - 6} y={getY(val) - 8} fill="#64748B" fontSize="7" fontWeight="black" fontFamily="sans-serif">
                                        {val}
                                    </text>
                                    <text x={getX(idx) - 6} y={chartHeight - 15} fill="#94A3B8" fontSize="6.5" fontWeight="bold">
                                        M{idx + 1}
                                    </text>
                                </g>
                            ))}

                            {/* Node markers (dots) for Intervention */}
                            {interventionData.map((val, idx) => {
                                const globalIdx = baselineData.length + idx
                                return (
                                    <g key={`int-p-${idx}`}>
                                        <circle cx={getX(globalIdx)} cy={getY(val)} r="5" fill="#7AB800" stroke="#003057" strokeWidth="2.5" />
                                        <text x={getX(globalIdx) - 6} y={getY(val) - 8} fill="#003057" fontSize="7.5" fontWeight="black" fontFamily="sans-serif">
                                            {val}
                                        </text>
                                        <text x={getX(globalIdx) - 6} y={chartHeight - 15} fill="#004F9F" fontSize="6.5" fontWeight="bold">
                                            P{idx + 1}
                                        </text>
                                    </g>
                                )
                            })}
                        </svg>
                    </div>

                    <div className="pt-2 text-center text-[7.5px] text-slate-450 uppercase font-black tracking-widest border-t border-slate-100">
                        Baseline phase: standard care (months 1-5) | Intervention phase: PDSA Cycle implementation (months 6-10)
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ==========================================
   3. SQUIRE 2.0 ABSTRACT HELPER
   ========================================== */
function SquireHelper() {
    const [title, setTitle] = useState("Reduction of Post-Operative Urinary Tract Infections (UTIs) in ICU Units")
    const [aim, setAim] = useState("We aimed to reduce catheter-associated UTIs by 30% inside 6 months using an updated GME nurse checklist protocol.")
    const [methods, setMethods] = useState("Designed multi-disciplinary baseline checklists, trained GME resident champions, and monitored insertion guidelines weekly.")
    const [results, setResults] = useState("CAUTI rates fell from a median baseline of 8.5/1000 device days to 4.2/1000 device days, exceeding our initial aim.")
    const [conclusions, setConclusions] = useState("Checklist-driven bedside audits effectively secure clinical gains. Hand-off protocols will guide the upcoming ICU resident rotations.")
    const [copied, setCopied] = useState(false)

    const squireDraft = `SQUIRE 2.0 COMPLIANT CLINICAL ABSTRACT
Title: ${title}
--------------------------------------------------------------------------------
INTRODUCTION / BACKGROUND:
Continuous quality assessment is a critical component of institutional patient safety. System gaps frequently disrupt clinical guidelines, impacting standard residency protocols.

SPECIFIC AIMS:
${aim}

METHODS / INTERVENTIONS:
${methods}

RESULTS:
${results}

CONCLUSIONS / DISCUSSION:
${conclusions}`

    const handleCopy = () => {
        navigator.clipboard.writeText(squireDraft)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-slate-650 text-xs font-semibold leading-relaxed">
                <FileText className="w-5 h-5 text-advent-navy shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-serif italic font-bold text-slate-800 text-sm mb-1">SQUIRE 2.0 Academic Publisher</h4>
                    GME conferences require abstract submissions structured according to **SQUIRE 2.0 (Standards for Quality Improvement Reporting Excellence)** guidelines. Edit the fields below to compile a compliant draft.
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Fields */}
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">Initiative Title</label>
                            <span className="text-[7.5px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded">SQUIRE 1a</span>
                        </div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200/60 rounded-xl text-xs font-semibold outline-none focus:border-advent-navy focus:bg-white transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">Specific Aim Statement (SMART Aim)</label>
                            <span className="text-[7.5px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded">SQUIRE 5</span>
                        </div>
                        <textarea
                            value={aim}
                            onChange={(e) => setAim(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200/60 rounded-xl text-xs font-semibold outline-none focus:border-advent-navy focus:bg-white transition-all resize-none"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">Clinical Interventions</label>
                            <span className="text-[7.5px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded">SQUIRE 8</span>
                        </div>
                        <textarea
                            value={methods}
                            onChange={(e) => setMethods(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200/60 rounded-xl text-xs font-semibold outline-none focus:border-advent-navy focus:bg-white transition-all resize-none"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">Measures & Quantitative Results</label>
                            <span className="text-[7.5px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded">SQUIRE 13</span>
                        </div>
                        <textarea
                            value={results}
                            onChange={(e) => setResults(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200/60 rounded-xl text-xs font-semibold outline-none focus:border-advent-navy focus:bg-white transition-all resize-none"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">Discussion & Conclusions</label>
                            <span className="text-[7.5px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded">SQUIRE 17</span>
                        </div>
                        <textarea
                            value={conclusions}
                            onChange={(e) => setConclusions(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200/60 rounded-xl text-xs font-semibold outline-none focus:border-advent-navy focus:bg-white transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Live Compiled Abstract Draft Output */}
                <div className="bg-slate-950 text-slate-300 rounded-3xl p-5 flex flex-col justify-between border border-slate-800 shadow-lg relative min-h-[350px]">
                    <div>
                        <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-4">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Live Compiled SQUIRE Abstract</span>
                            <span className="text-[7px] text-advent-green font-black uppercase tracking-widest">GME Scholarly Export</span>
                        </div>
                        <div className="text-[10px] font-mono leading-relaxed whitespace-pre-wrap select-all max-h-[320px] overflow-y-auto">
                            {squireDraft}
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-850 flex justify-between items-center">
                        <span className="text-[7.5px] font-black uppercase tracking-widest text-slate-500">
                            Meets institutional abstract criteria
                        </span>
                        <button
                            onClick={handleCopy}
                            className="bg-white hover:bg-slate-100 text-slate-900 px-4 py-2.5 rounded-xl text-[8.5px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-sm"
                        >
                            <Clipboard className="w-3.5 h-3.5 text-advent-navy" />
                            {copied ? 'Copied to Clipboard' : 'Copy Abstract'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ==========================================
   4. RACI MATRIX & STAKEHOLDER PLANNER
   ========================================== */
interface RACIMatrix {
    task: string;
    roles: Record<string, RACIRole>;
}

function RaciPlanner() {
    const stakeholders = [
        'GME Resident',
        'Faculty Mentor',
        'Chief Resident',
        'Nurse Manager',
        'QI Director',
        'Residency PD'
    ]

    const [matrix, setMatrix] = useState<RACIMatrix[]>([
        {
            task: "Clinical PDSA Protocol Design",
            roles: {
                'GME Resident': 'R',
                'Faculty Mentor': 'A',
                'Chief Resident': 'C',
                'Nurse Manager': 'C',
                'QI Director': 'I',
                'Residency PD': 'I'
            }
        },
        {
            task: "Baseline Outcome Measurement",
            roles: {
                'GME Resident': 'R',
                'Faculty Mentor': 'C',
                'Chief Resident': 'I',
                'Nurse Manager': 'R',
                'QI Director': 'A',
                'Residency PD': 'I'
            }
        },
        {
            task: "Standard Bedside Intervention",
            roles: {
                'GME Resident': 'R',
                'Faculty Mentor': 'I',
                'Chief Resident': 'C',
                'Nurse Manager': 'A',
                'QI Director': 'C',
                'Residency PD': 'I'
            }
        },
        {
            task: "Monthly Run-Chart Ledger Logs",
            roles: {
                'GME Resident': 'R',
                'Faculty Mentor': 'I',
                'Chief Resident': 'A',
                'Nurse Manager': 'I',
                'QI Director': 'C',
                'Residency PD': 'I'
            }
        },
        {
            task: "SQUIRE Write-up Draft",
            roles: {
                'GME Resident': 'R',
                'Faculty Mentor': 'A',
                'Chief Resident': 'C',
                'Nurse Manager': 'I',
                'QI Director': 'I',
                'Residency PD': 'C'
            }
        }
    ])

    const cycleRole = (taskIdx: number, stakeholder: string) => {
        const rolesOrder: RACIRole[] = ['-', 'R', 'A', 'C', 'I']
        const currentRole = matrix[taskIdx].roles[stakeholder] || '-'
        const nextIdx = (rolesOrder.indexOf(currentRole) + 1) % rolesOrder.length
        const nextRole = rolesOrder[nextIdx]

        setMatrix(prev => {
            const updated = [...prev]
            updated[taskIdx].roles = {
                ...updated[taskIdx].roles,
                [stakeholder]: nextRole
            }
            return updated
        })
    }

    const getRoleColor = (role: RACIRole) => {
        switch (role) {
            case 'R': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'A': return 'bg-violet-100 text-violet-800 border-violet-200 font-bold'
            case 'C': return 'bg-amber-100 text-amber-800 border-amber-200'
            case 'I': return 'bg-slate-100 text-slate-600 border-slate-200'
            default: return 'bg-slate-50 text-slate-350 border-slate-150'
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-slate-650 text-xs font-semibold leading-relaxed">
                <Users className="w-5 h-5 text-advent-navy shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-serif italic font-bold text-slate-800 text-sm mb-1">RACI Stakeholder Matrix</h4>
                    Organizing interdisciplinary responsibilities secures project success. Click the cells below to map quality stakeholders to their respective roles: **Responsible (R)**, **Accountable (A)**, **Consulted (C)**, or **Informed (I)**.
                </div>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-200/60 bg-white shadow-2xs">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-250/20">
                            <th className="py-4 px-5 text-[9px] font-black uppercase tracking-widest text-slate-500">Initiative / Project Tasks</th>
                            {stakeholders.map(st => (
                                <th key={st} className="py-4 px-3 text-center text-[8.5px] font-black uppercase tracking-widest text-slate-500 min-w-[90px]">
                                    {st}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150/60 text-xs">
                        {matrix.map((row, taskIdx) => (
                            <tr key={taskIdx} className="hover:bg-slate-50/30 transition-colors">
                                <td className="py-4 px-5 font-serif italic font-bold text-slate-800 max-w-[200px]">
                                    {row.task}
                                </td>
                                {stakeholders.map(st => {
                                    const role = row.roles[st] || '-'
                                    return (
                                        <td key={st} className="py-3 px-3 text-center">
                                            <button
                                                onClick={() => cycleRole(taskIdx, st)}
                                                className={`w-9 h-9 rounded-xl border flex items-center justify-center mx-auto text-[10px] font-black tracking-normal transition-all hover:scale-105 active:scale-95 ${getRoleColor(role)}`}
                                                title={`Click to cycle role for ${st}`}
                                            >
                                                {role}
                                            </button>
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-[9px] font-black uppercase tracking-widest text-slate-500 justify-center">
                <span>R: Responsible (does work)</span>
                <span className="text-slate-300">|</span>
                <span>A: Accountable (owns approval)</span>
                <span className="text-slate-300">|</span>
                <span>C: Consulted (gives input)</span>
                <span className="text-slate-300">|</span>
                <span>I: Informed (receives updates)</span>
            </div>
        </div>
    )
}

/* ==========================================
   5. SUSTAINABILITY & SPREAD LEDGER
   ========================================== */
interface LedgerItem {
    id: number;
    label: string;
    checked: boolean;
    points: number;
    advice: string;
}

function SustainabilityLedger() {
    const [checklist, setChecklist] = useState<LedgerItem[]>([
        {
            id: 1,
            label: "Write Standard Operating Procedure (SOP) & clinical workflow guide.",
            checked: true,
            points: 20,
            advice: "Guarantees procedural repeatability across varying nursing and physician shifts."
        },
        {
            id: 2,
            label: "Conduct formal hand-off to incoming resident quality cohorts.",
            checked: false,
            points: 25,
            advice: "Necessary for continuous tracking as clinical rotations transfer annually in July."
        },
        {
            id: 3,
            label: "Establish Monthly audit schedules (Chief Resident / Attending overseen).",
            checked: false,
            points: 20,
            advice: "Systematic monthly spot-checks keep clinical teams fully compliant."
        },
        {
            id: 4,
            label: "Appoint localized nurse champions to monitor compliance daily.",
            checked: true,
            points: 15,
            advice: "Secures organic bedside tracking compliance outside standard GME reporting."
        },
        {
            id: 5,
            label: "Integrate change directly into hospital department onboarding manuals.",
            checked: false,
            points: 20,
            advice: "Solidifies permanent compliance, locking the improvement gains in perpetuity."
        }
    ])

    const toggleItem = (id: number) => {
        setChecklist(prev => prev.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        ))
    }

    const readinessScore = checklist.reduce((acc, curr) => curr.checked ? acc + curr.points : acc, 0)

    const getScoreStatus = (score: number) => {
        if (score >= 80) return { label: 'Secured/Institutional Spread Approval', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
        if (score >= 50) return { label: 'Intermediate Handoff Staged', color: 'text-amber-700 bg-amber-50 border-amber-200' }
        return { label: 'Fragile: Immediate Attrition Risk', color: 'text-rose-700 bg-rose-50 border-rose-200' }
    }

    const status = getScoreStatus(readinessScore)

    return (
        <div className="space-y-6">
            <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-slate-650 text-xs font-semibold leading-relaxed">
                <UserCheck className="w-5 h-5 text-advent-navy shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-serif italic font-bold text-slate-800 text-sm mb-1">Spread & Handoff Audit Checklist</h4>
                    Most QI gains collapse when residents graduate. Complete this transition ledger to secure the long-term sustainability of your quality initiative.
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Ledger Checklist */}
                <div className="md:col-span-2 space-y-3">
                    {checklist.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex gap-3.5 items-start ${
                                item.checked
                                    ? 'bg-slate-50/50 border-slate-250/60 text-slate-800'
                                    : 'bg-white border-slate-200 text-slate-450 hover:bg-slate-50/20'
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={item.checked}
                                readOnly
                                className="w-4 h-4 mt-0.5 accent-advent-navy shrink-0 cursor-pointer"
                            />
                            <div className="space-y-1">
                                <p className={`text-xs font-bold ${item.checked ? 'text-slate-850' : 'text-slate-500'}`}>
                                    {item.label}
                                </p>
                                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                                    {item.advice}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Score Summary Panel */}
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 flex flex-col justify-between shadow-2xs">
                    <div className="space-y-4">
                        <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">Sustainability Score</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-serif italic font-semibold text-slate-900">{readinessScore}</span>
                            <span className="text-xl font-bold text-slate-400">/ 100</span>
                        </div>

                        <div className={`p-4 rounded-xl border text-[9px] font-black uppercase tracking-widest text-center ${status.color}`}>
                            {status.label}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-3">
                        <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                            GME requirements stipulate a Sustainability Score of **80+** to formalize permanent project completion in the resident registry.
                        </p>
                        <div className="flex gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-advent-navy mt-1 shrink-0" />
                            <span className="text-[9px] font-bold text-slate-400">Locked entries compile directly to MS-Word portfolios.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
    return (
        <div className="space-y-6">
            <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-slate-650 text-xs font-semibold leading-relaxed">
                <UserCheck className="w-5 h-5 text-advent-navy shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-serif italic font-bold text-slate-800 text-sm mb-1">Spread & Handoff Audit Checklist</h4>
                    Most QI gains collapse when residents graduate. Complete this transition ledger to secure the long-term sustainability of your quality initiative.
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Ledger Checklist */}
                <div className="md:col-span-2 space-y-3">
                    {checklist.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex gap-3.5 items-start ${
                                item.checked
                                    ? 'bg-slate-50/50 border-slate-250/60 text-slate-800'
                                    : 'bg-white border-slate-200 text-slate-450 hover:bg-slate-50/20'
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={item.checked}
                                readOnly
                                className="w-4 h-4 mt-0.5 accent-advent-navy shrink-0 cursor-pointer"
                            />
                            <div className="space-y-1">
                                <p className={`text-xs font-bold ${item.checked ? 'text-slate-850' : 'text-slate-500'}`}>
                                    {item.label}
                                </p>
                                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                                    {item.advice}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Score Summary Panel */}
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 flex flex-col justify-between shadow-2xs">
                    <div className="space-y-4">
                        <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">Sustainability Score</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-serif italic font-semibold text-slate-900">{readinessScore}</span>
                            <span className="text-xl font-bold text-slate-400">/ 100</span>
                        </div>

                        <div className={`p-4 rounded-xl border text-[9px] font-black uppercase tracking-widest text-center ${status.color}`}>
                            {status.label}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-3">
                        <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                            GME requirements stipulate a Sustainability Score of **80+** to formalize permanent project completion in the resident registry.
                        </p>
                        <div className="flex gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-advent-navy mt-1 shrink-0" />
                            <span className="text-[9px] font-bold text-slate-400">Locked entries compile directly to MS-Word portfolios.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ==========================================
   6. INTERACTIVE FISHBONE (ISHIKAWA) BUILDER
   ========================================== */
function FishboneBuilder() {
    const [problem, setProblem] = useState("Low Pneumococcal Vaccination Rates in Senior Ward")
    
    const [categories, setCategories] = useState<{
        people: string[];
        process: string[];
        equipment: string[];
        materials: string[];
        environment: string[];
        management: string[];
    }>({
        people: ["Lack of resident awareness", "Nurse shifts changeover gaps", "Patient refusal / vaccine hesitancy"],
        process: ["No automatic electronic trigger", "Consent form is too long", "Discharge order set omissions"],
        equipment: ["EMR alerts frequently bypassed", "Slow vaccine fridge access log", "No dedicated printer for forms"],
        materials: ["Out of stock vaccines in pharmacy", "Lack of patient education brochures", "Missing clinical checklist sheets"],
        environment: ["Busy, noisy clinical floor", "High patient turnover rate", "Dispersed computer workstations"],
        management: ["No dedicated quality coordinator", "Inconsistent clinician audits", "Understaffed weekend nursing shifts"]
    })

    const [newCause, setNewCause] = useState<Record<string, string>>({
        people: "",
        process: "",
        equipment: "",
        materials: "",
        environment: "",
        management: ""
    })

    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
    const [copied, setCopied] = useState(false)

    const handleAddCause = (cat: keyof typeof categories) => {
        if (!newCause[cat].trim()) return;
        setCategories(prev => ({
            ...prev,
            [cat]: [...prev[cat], newCause[cat].trim()]
        }))
        setNewCause(prev => ({ ...prev, [cat]: "" }))
    }

    const handleRemoveCause = (cat: keyof typeof categories, index: number) => {
        setCategories(prev => ({
            ...prev,
            [cat]: prev[cat].filter((_, idx) => idx !== index)
        }))
    }

    // Helper to generate coordinates for rib cause lines and text
    const renderRibCauses = (
        ribStart: { x: number; y: number },
        ribEnd: { x: number; y: number },
        causes: string[],
        isTop: boolean
    ) => {
        return causes.map((cause, idx) => {
            // Find points along the rib line
            const t = 0.25 + 0.22 * idx; // Parametric spacing along rib
            if (t > 0.95) return null; // Avoid drawing too close to spine
            
            const px = ribStart.x + (ribEnd.x - ribStart.x) * t;
            const py = ribStart.y + (ribEnd.y - ribStart.y) * t;

            // Draw horizontal cause line
            const length = 75;
            const cx1 = px;
            const cx2 = px - length; // Draw leftwards
            const cy = py;

            const textX = cx2 + 5;
            const textY = cy - 4;

            return (
                <g key={idx}>
                    <line 
                        x1={cx1} 
                        y1={cy} 
                        x2={cx2} 
                        y2={cy} 
                        stroke="#94A3B8" 
                        strokeWidth="1.5" 
                        strokeDasharray="2,2"
                    />
                    <text 
                        x={textX} 
                        y={textY} 
                        fill="#334155" 
                        fontSize="9.5" 
                        fontWeight="600"
                        className="font-sans"
                    >
                        {cause.length > 25 ? cause.substring(0, 22) + "..." : cause}
                    </text>
                </g>
            )
        })
    }

    // Dynamic SVG String for clipboard copying
    const getSvgString = () => {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500" width="100%" height="100%" style="background-color: #FFFFFF; font-family: sans-serif;">
  <style>
    .spine { stroke: #003057; stroke-width: 4; fill: none; }
    .rib { stroke: #004F9F; stroke-width: 2.5; fill: none; }
    .cause-line { stroke: #94A3B8; stroke-width: 1.5; stroke-dasharray: 2 2; fill: none; }
    .category-box { fill: #F1F5F9; stroke: #CBD5E1; stroke-width: 1.5; rx: 8; ry: 8; }
    .category-text { fill: #003057; font-weight: bold; font-size: 11px; text-anchor: middle; }
    .problem-box { fill: #003057; rx: 12; ry: 12; }
    .cause-text { fill: #334155; font-size: 9.5px; font-weight: 600; }
  </style>
  
  <rect x="10" y="10" width="980" height="480" rx="16" ry="16" fill="none" stroke="#E2E8F0" stroke-width="2"/>
  <line x1="50" y1="250" x2="800" y2="250" class="spine"/>
  <polygon points="800,240 820,250 800,260" fill="#003057"/>

  <rect x="820" y="200" width="165" height="100" class="problem-box" />
  <foreignObject x="825" y="205" width="155" height="90">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #FFFFFF; font-weight: bold; font-size: 11px; text-align: center; height: 100%; display: flex; align-items: center; justify-content: center; padding: 2px;">
      \${problem}
    </div>
  </foreignObject>

  <!-- TOP RIBS -->
  <rect x="220" y="20" width="100" height="30" class="category-box"/>
  <text x="270" y="38" class="category-text">PEOPLE</text>
  <line x1="270" y1="50" x2="350" y2="250" class="rib"/>
  \${categories.people.map((cause, idx) => {
      const t = 0.25 + 0.22 * idx; if (t > 0.95) return "";
      const px = 270 + (350 - 270) * t; const py = 50 + (250 - 50) * t;
      return \`<line x1="\${px}" y1="\${py}" x2="\${px - 75}" y2="\${py}" class="cause-line"/>
  <text x="\${px - 70}" y="\${py - 4}" class="cause-text">\${cause.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>\`;
  }).join('\\n')}

  <rect x="420" y="20" width="100" height="30" class="category-box"/>
  <text x="470" y="38" class="category-text">PROCESS</text>
  <line x1="470" y1="50" x2="550" y2="250" class="rib"/>
  \${categories.process.map((cause, idx) => {
      const t = 0.25 + 0.22 * idx; if (t > 0.95) return "";
      const px = 470 + (550 - 470) * t; const py = 50 + (250 - 50) * t;
      return \`<line x1="\${px}" y1="\${py}" x2="\${px - 75}" y2="\${py}" class="cause-line"/>
  <text x="\${px - 70}" y="\${py - 4}" class="cause-text">\${cause.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>\`;
  }).join('\\n')}

  <rect x="620" y="20" width="100" height="30" class="category-box"/>
  <text x="670" y="38" class="category-text">EQUIPMENT</text>
  <line x1="670" y1="50" x2="750" y2="250" class="rib"/>
  \${categories.equipment.map((cause, idx) => {
      const t = 0.25 + 0.22 * idx; if (t > 0.95) return "";
      const px = 670 + (750 - 670) * t; const py = 50 + (250 - 50) * t;
      return \`<line x1="\${px}" y1="\${py}" x2="\${px - 75}" y2="\${py}" class="cause-line"/>
  <text x="\${px - 70}" y="\${py - 4}" class="cause-text">\${cause.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>\`;
  }).join('\\n')}

  <!-- BOTTOM RIBS -->
  <rect x="220" y="450" width="100" height="30" class="category-box"/>
  <text x="270" y="468" class="category-text">MATERIALS</text>
  <line x1="270" y1="450" x2="350" y2="250" class="rib"/>
  \${categories.materials.map((cause, idx) => {
      const t = 0.25 + 0.22 * idx; if (t > 0.95) return "";
      const px = 270 + (350 - 270) * t; const py = 450 + (250 - 450) * t;
      return \`<line x1="\${px}" y1="\${py}" x2="\${px - 75}" y2="\${py}" class="cause-line"/>
  <text x="\${px - 70}" y="\${py - 4}" class="cause-text">\${cause.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>\`;
  }).join('\\n')}

  <rect x="420" y="450" width="100" height="30" class="category-box"/>
  <text x="470" y="468" class="category-text">ENVIRONMENT</text>
  <line x1="470" y1="450" x2="550" y2="250" class="rib"/>
  \${categories.environment.map((cause, idx) => {
      const t = 0.25 + 0.22 * idx; if (t > 0.95) return "";
      const px = 470 + (550 - 470) * t; const py = 450 + (250 - 450) * t;
      return \`<line x1="\${px}" y1="\${py}" x2="\${px - 75}" y2="\${py}" class="cause-line"/>
  <text x="\${px - 70}" y="\${py - 4}" class="cause-text">\${cause.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>\`;
  }).join('\\n')}

  <rect x="620" y="450" width="100" height="30" class="category-box"/>
  <text x="670" y="468" class="category-text">MANAGEMENT</text>
  <line x1="670" y1="450" x2="750" y2="250" class="rib"/>
  \${categories.management.map((cause, idx) => {
      const t = 0.25 + 0.22 * idx; if (t > 0.95) return "";
      const px = 670 + (750 - 670) * t; const py = 450 + (250 - 450) * t;
      return \`<line x1="\${px}" y1="\${py}" x2="\${px - 75}" y2="\${py}" class="cause-line"/>
  <text x="\${px - 70}" y="\${py - 4}" class="cause-text">\${cause.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>\`;
  }).join('\\n')}
</svg>`;
    }

    const copySvgXml = () => {
        navigator.clipboard.writeText(getSvgString())
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-slate-650 text-xs font-semibold leading-relaxed">
                <Sparkles className="w-5 h-5 text-advent-navy shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-serif italic font-bold text-slate-800 text-sm mb-1">Root Cause Fishbone SVG Builder</h4>
                    Visualizing cause-and-effect relationships is mandatory for SQUIRE project reports. Enter causes below, see the diagram update dynamically, and export it directly for slide decks or research posters.
                </div>
            </div>

            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('edit')}
                    className={`pb-2.5 px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 \${
                        activeTab === 'edit'
                            ? 'border-advent-navy text-advent-navy'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    1. Input Causes
                </button>
                <button
                    onClick={() => setActiveTab('preview')}
                    className={`pb-2.5 px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 \${
                        activeTab === 'preview'
                            ? 'border-advent-navy text-advent-navy'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    2. Dynamic SVG Preview
                </button>
            </div>

            {activeTab === 'edit' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Problem (Central Effect)</label>
                        <input
                            type="text"
                            value={problem}
                            onChange={(e) => setProblem(e.target.value)}
                            placeholder="Enter the primary quality gap..."
                            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200/60 rounded-xl text-xs font-semibold outline-none focus:border-advent-navy focus:bg-white transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(Object.keys(categories) as Array<keyof typeof categories>).map((cat) => {
                            const labels = {
                                people: 'People (Staff, Patients)',
                                process: 'Process (Workflows)',
                                equipment: 'Equipment (EMR, Tech)',
                                materials: 'Materials (Supplies)',
                                environment: 'Environment (Floor Layout)',
                                management: 'Management (Policies)'
                            }
                            return (
                                <div key={cat} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-3xs space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-700">{labels[cat]}</h4>
                                    
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newCause[cat]}
                                            onChange={(e) => setNewCause(prev => ({ ...prev, [cat]: e.target.value }))}
                                            placeholder="Add specific cause..."
                                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-advent-navy transition-all"
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddCause(cat) }}
                                        />
                                        <button
                                            onClick={() => handleAddCause(cat)}
                                            className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all"
                                        >
                                            <Plus className="w-4 h-4 text-advent-green" />
                                        </button>
                                    </div>

                                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                                        {categories[cat].map((cause, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-150 group">
                                                <span className="text-[10.5px] font-semibold text-slate-650 truncate mr-2">{cause}</span>
                                                <button
                                                    onClick={() => handleRemoveCause(cat, idx)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-rose-600"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        {categories[cat].length === 0 && (
                                            <p className="text-[9px] text-slate-400 italic">No causes registered.</p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={() => setActiveTab('preview')}
                            className="flex items-center gap-2 bg-advent-navy text-white px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-advent-cobalt transition-all shadow-md"
                        >
                            Generate SVG Diagram <ArrowRight className="w-3.5 h-3.5 text-advent-green" />
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'preview' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live SVG Canvas</span>
                        <button
                            onClick={copySvgXml}
                            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                            <Copy className="w-3.5 h-3.5 text-advent-green" />
                            <span>{copied ? "Copied XML!" : "Copy SVG XML"}</span>
                        </button>
                    </div>

                    <div className="bg-white border border-slate-250 rounded-3xl p-4 shadow-sm flex items-center justify-center overflow-x-auto min-h-[400px]">
                        <div className="w-full max-w-4xl aspect-[2/1] min-w-[750px]">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500" className="w-full h-full">
                                <line x1="50" y1="250" x2="800" y2="250" stroke="#003057" strokeWidth="4" />
                                <polygon points="800,240 820,250 800,260" fill="#003057"/>

                                <rect x="820" y="200" width="165" height="100" fill="#003057" rx="12" ry="12" />
                                <foreignObject x="825" y="205" width="155" height="90">
                                    <div className="text-white font-serif italic font-bold text-[11px] text-center h-full flex items-center justify-center p-2 leading-relaxed">
                                        {problem}
                                    </div>
                                </foreignObject>

                                {/* TOP RIBS */}
                                <rect x="220" y="20" width="100" height="30" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" rx="8" ry="8" />
                                <text x="270" y="38" fill="#003057" fontWeight="bold" fontSize="11" textAnchor="middle">PEOPLE</text>
                                <line x1="270" y1="50" x2="350" y2="250" stroke="#004F9F" strokeWidth="2.5" />
                                {renderRibCauses({ x: 270, y: 50 }, { x: 350, y: 250 }, categories.people, true)}

                                <rect x="420" y="20" width="100" height="30" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" rx="8" ry="8" />
                                <text x="470" y="38" fill="#003057" fontWeight="bold" fontSize="11" textAnchor="middle">PROCESS</text>
                                <line x1="470" y1="50" x2="550" y2="250" stroke="#004F9F" strokeWidth="2.5" />
                                {renderRibCauses({ x: 470, y: 50 }, { x: 550, y: 250 }, categories.process, true)}

                                <rect x="620" y="20" width="100" height="30" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" rx="8" ry="8" />
                                <text x="670" y="38" fill="#003057" fontWeight="bold" fontSize="11" textAnchor="middle">EQUIPMENT</text>
                                <line x1="670" y1="50" x2="750" y2="250" stroke="#004F9F" strokeWidth="2.5" />
                                {renderRibCauses({ x: 670, y: 50 }, { x: 750, y: 250 }, categories.equipment, true)}

                                {/* BOTTOM RIBS */}
                                <rect x="220" y="450" width="100" height="30" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" rx="8" ry="8" />
                                <text x="270" y="468" fill="#003057" fontWeight="bold" fontSize="11" textAnchor="middle">MATERIALS</text>
                                <line x1="270" y1="450" x2="350" y2="250" stroke="#004F9F" strokeWidth="2.5" />
                                {renderRibCauses({ x: 270, y: 450 }, { x: 350, y: 250 }, categories.materials, false)}

                                <rect x="420" y="450" width="100" height="30" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" rx="8" ry="8" />
                                <text x="470" y="468" fill="#003057" fontWeight="bold" fontSize="11" textAnchor="middle">ENVIRONMENT</text>
                                <line x1="470" y1="450" x2="550" y2="250" stroke="#004F9F" strokeWidth="2.5" />
                                {renderRibCauses({ x: 470, y: 450 }, { x: 550, y: 250 }, categories.environment, false)}

                                <rect x="620" y="450" width="100" height="30" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" rx="8" ry="8" />
                                <text x="670" y="468" fill="#003057" fontWeight="bold" fontSize="11" textAnchor="middle">MANAGEMENT</text>
                                <line x1="670" y1="450" x2="750" y2="250" stroke="#004F9F" strokeWidth="2.5" />
                                {renderRibCauses({ x: 670, y: 450 }, { x: 750, y: 250 }, categories.management, false)}
                            </svg>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ==========================================
   7. EPIC EMR BPA & IT TICKET GENERATOR
   ========================================== */
function EpicTicketGenerator() {
    const [formData, setFormData] = useState({
        title: "Sepsis BPA & Lactate Order Trigger",
        urgency: "Medium",
        audience: "ED Providers, ICU Nurses, IM Residents",
        timing: "Trigger on patient chart open OR when a new lactate order is requested",
        inclusion: "SIRS criteria met (Temp > 100.4F OR < 96.8F AND HR > 90 AND RR > 20 AND WBC > 12k OR < 4k) WITH a suspected source of infection.",
        exclusion: "Patient already enrolled in Sepsis Order Set, Hospice or Comfort Care designation, Pediatric patients (< 18 years old).",
        actionText: "WARNING: This patient meets criteria for Severe Sepsis. Please review early resuscitation parameters.",
        actionButtons: "1. Open Severe Sepsis Order Set (.SEPSISORDERSET)\\n2. Order Serial Lactates (.LACSUSP)\\n3. Acknowledge Alert (Enter reason)",
        rationale: "Improves standard-of-care resuscitation compliance in the emergency and medical wards by 25%. Aligns with the 2021 Surviving Sepsis Campaign clinical guidelines.",
        notes: "Requesting a custom SmartPhrase (.AHGME_SEPSIS_RESUS) containing active links to sepsis ledger tables."
    })

    const [copied, setCopied] = useState(false)

    const compiledTicket = `======================================================================
ADVENTHEALTH CLINICAL INFORMATICS & IT BUILD REQUEST TICKET
======================================================================
[REQUEST TYPE]  Epic Best Practice Advisory (BPA) & Clinical Order Set
[SUBMITTED BY]  GME Quality Improvement & Scholarly Registry
[DATE GENERATED] \${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
[PRIORITY/URGENCY] \${formData.urgency}

----------------------------------------------------------------------
1. SYSTEM SPECIFICATIONS
----------------------------------------------------------------------
* Request Name: \${formData.title}
* Target Audience: \${formData.audience}
* Trigger Timing: \${formData.timing}

----------------------------------------------------------------------
2. LOGIC CRITERIA
----------------------------------------------------------------------
* Inclusion (Trigger Logic):
  \${formData.inclusion}

* Exclusion (Silencer Logic):
  \${formData.exclusion}

----------------------------------------------------------------------
3. ALERT USER INTERFACE & DISRUPTIVE ACTIONS
----------------------------------------------------------------------
* Alert Visual Text:
  "\${formData.actionText}"

* Available Quick Actions / Buttons:
  \${formData.actionButtons.split('\\n').map(b => \`  [Button] \${b}\`).join('\\n')}

----------------------------------------------------------------------
4. CLINICAL RATIONALE & EVIDENCE (For Analyst Approval)
----------------------------------------------------------------------
* Evidence / Goal:
  \${formData.rationale}

* SmartPhrases & Additional Informatics Notes:
  \${formData.notes}

======================================================================
* Instructions for Resident: Copy this ticket, navigate to the 
  AdventHealth ServiceNow portal, select "Request Epic Build Change", 
  and paste this into the Request Description block.
======================================================================`

    const copyTicket = () => {
        navigator.clipboard.writeText(compiledTicket)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-slate-650 text-xs font-semibold leading-relaxed">
                <Clipboard className="w-5 h-5 text-advent-navy shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-serif italic font-bold text-slate-800 text-sm mb-1">Epic EMR Build Ticket Generator</h4>
                    Implementing clinical changes (like BPAs, SmartPhrases, or order sets) requires technical IT translation. Fill out this guided clinical spec sheet to generate a copyable IT analyst ticket.
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Request Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-advent-navy focus:bg-white transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Analyst Urgency</label>
                            <select
                                value={formData.urgency}
                                onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-advent-navy focus:bg-white transition-all"
                            >
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High (Institutional Mandate)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Target Clinical Audience</label>
                        <input
                            type="text"
                            value={formData.audience}
                            onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-advent-navy focus:bg-white transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Trigger Event & Timing</label>
                        <textarea
                            value={formData.timing}
                            onChange={(e) => setFormData(prev => ({ ...prev, timing: e.target.value }))}
                            rows={2}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-advent-navy focus:bg-white transition-all resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Inclusion Logic (Trigger Rules)</label>
                        <textarea
                            value={formData.inclusion}
                            onChange={(e) => setFormData(prev => ({ ...prev, inclusion: e.target.value }))}
                            rows={2}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-advent-navy focus:bg-white transition-all resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Exclusion Logic (Silencers)</label>
                        <textarea
                            value={formData.exclusion}
                            onChange={(e) => setFormData(prev => ({ ...prev, exclusion: e.target.value }))}
                            rows={2}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-advent-navy focus:bg-white transition-all resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Alert Text (Visual Alert)</label>
                        <textarea
                            value={formData.actionText}
                            onChange={(e) => setFormData(prev => ({ ...prev, actionText: e.target.value }))}
                            rows={2}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-advent-navy focus:bg-white transition-all resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Alert Buttons & Actions (One per line)</label>
                        <textarea
                            value={formData.actionButtons}
                            onChange={(e) => setFormData(prev => ({ ...prev, actionButtons: e.target.value }))}
                            rows={3}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-advent-navy focus:bg-white transition-all resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Evidence & Clinical Rationale</label>
                        <textarea
                            value={formData.rationale}
                            onChange={(e) => setFormData(prev => ({ ...prev, rationale: e.target.value }))}
                            rows={2}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-advent-navy focus:bg-white transition-all resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">SmartPhrases & Informatics Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            rows={2}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-advent-navy focus:bg-white transition-all resize-none"
                        />
                    </div>
                </div>

                <div className="flex flex-col h-full justify-between bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg text-white">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">ServiceNow Epic Build Request</span>
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-advent-green opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-advent-green"></span>
                            </span>
                        </div>
                        
                        <pre className="text-[10px] leading-relaxed font-mono overflow-auto max-h-[360px] whitespace-pre bg-slate-950 p-4 rounded-xl border border-slate-800 scrollbar-thin text-slate-300">
                            {compiledTicket}
                        </pre>
                    </div>

                    <div className="pt-6 border-t border-slate-850 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-[9px] text-slate-400 text-center sm:text-left leading-relaxed">
                            Click copy and submit to the IT analyst via the ServiceNow registry link.
                        </p>
                        <button
                            onClick={copyTicket}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-br from-advent-green to-emerald-600 hover:scale-102 transition-all text-white px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg"
                        >
                            <Copy className="w-3.5 h-3.5 text-white" />
                            <span>{copied ? "Copied Ticket!" : "Copy Ticket"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
