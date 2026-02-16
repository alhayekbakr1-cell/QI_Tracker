"use client"

import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    CheckSquare,
    ChevronRight,
    Lightbulb,
    FileText,
    Beaker,
    PenTool,
    BrainCircuit,
    Menu,
    X,
    Copy,
    Check,
    ArrowRight,
    Info,
    Activity,
    ShieldCheck,
    Target,
    BarChart2,
    Users,
    Presentation,
    Book,
    Calendar,
    AlertTriangle,
    Scale,
    Gavel,
    RefreshCw,
    HelpCircle,
    Database,
    Calculator,
    Sparkles,
    Loader2
} from 'lucide-react';

import mermaid from 'mermaid';

// Initialize mermaid only once on the client
if (typeof window !== 'undefined') {
    mermaid.initialize({
        startOnLoad: false, // Control rendering manually
        theme: 'base',
        themeVariables: {
            primaryColor: '#003057', // AdventHealth Navy
            secondaryColor: '#E9F1F8',
            tertiaryColor: '#ffffff',
            lineColor: '#003057',
            fontFamily: 'Inter, sans-serif'
        }
    });
}

// --- Types ---
interface ContentBlock {
    type: 'text' | 'checklist' | 'tip' | 'table' | 'prompt' | 'comparison' | 'irb-tool' | 'diagram' | 'pico-builder' | 'five-whys' | 'pdsa-worksheet' | 'pareto-chart';
    content?: string;
    title?: string;
    items?: string[];
    headers?: string[];
    rows?: string[][];
    promptText?: string;
    badExample?: string;
    goodExample?: string;
    diagramDefinition?: string;
}

interface Section {
    title: string;
    blocks: ContentBlock[];
}

interface Chapter {
    id: string;
    title: string;
    icon: React.ReactNode;
    sections: Section[];
}

// --- Data Content: RESTRUCTURED 5-CHAPTER ACADEMIC FLOW ---

const chapters: Chapter[] = [
    {
        id: 'overview',
        title: '1. Project Overview',
        icon: <BookOpen className="w-5 h-5" />,
        sections: [
            {
                title: 'The Elevator Pitch',
                blocks: [
                    {
                        type: 'text',
                        content: "Briefly summarize the problem, the aim, and what you will change. Every QI project starts with a clear focus."
                    },
                    {
                        type: 'tip',
                        title: 'The 3-Question Rule',
                        content: "1. What are we trying to accomplish? 2. How will we know change is improvement? 3. What changes can we make?"
                    },
                    {
                        type: 'table',
                        title: 'Executive Summary Components',
                        headers: ['Item', 'Response Requirement'],
                        rows: [
                            ['Problem Statement', '1-2 sentences on the gap in care.'],
                            ['SMART Aim', 'Specific, Measurable, Time-bound goal.'],
                            ['Proposed Intervention', 'What exactly will you do?'],
                            ['Primary Outcome', 'Your main success metric.']
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'background',
        title: '2. Background & Evidence',
        icon: <FileText className="w-5 h-5" />,
        sections: [
            {
                title: 'Building the Case',
                blocks: [
                    {
                        type: 'text',
                        content: "Describe why this matters. Include national context and local baseline data."
                    },
                    {
                        type: 'tip',
                        title: 'The Why Change?',
                        content: "When speaking to stakeholders, align your 'Why' with patient safety, clinical outcomes, or provider experience."
                    },
                    {
                        type: 'checklist',
                        title: 'Evidence Gathering Checklist',
                        items: [
                            'Identify current institutional practice/standard.',
                            'Search for at least 3 peer-reviewed citations.',
                            'Document baseline metrics (e.g., last 12 months).',
                            'Identify gaps in current workflow.'
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'outcomes',
        title: '3. Outcomes & Aim Statements',
        icon: <Target className="w-5 h-5" />,
        sections: [
            {
                title: 'PICO Framework Builder',
                blocks: [
                    {
                        type: 'text',
                        content: "Standardize your clinical question before writing your protocol."
                    },
                    {
                        type: 'pico-builder',
                        title: 'Resident PICO Worksheet'
                    }
                ]
            },
            {
                title: 'Defining SMART Aims',
                blocks: [
                    {
                        type: 'tip',
                        title: 'SMART Criteria',
                        content: "Specific, Measurable, Achievable, Relevant, Time-bound. Example: 'Increase hand hygiene compliance from 60% to 90% by Dec 2026 on Ward 4A.'"
                    }
                ]
            }
        ]
    },
    {
        id: 'methods',
        title: '4. Methods & Design',
        icon: <PenTool className="w-5 h-5" />,
        sections: [
            {
                title: 'Choose Your Framework',
                blocks: [
                    {
                        type: 'text',
                        content: "Specify your QI framework (PDSA, Lean, Six Sigma) and why it fits your project."
                    },
                    {
                        type: 'pdsa-worksheet'
                    },
                    {
                        type: 'diagram',
                        title: 'Fishbone (Ishikawa) Framework',
                        diagramDefinition: `
graph LR
    P[People] --> F
    M[Methods] --> F
    E[Equipment] --> F
    EV[Environment] --> F
    MG[Management] --> F
    F((PROBLEM))
                        `
                    }
                ]
            }
        ]
    },
    {
        id: 'measures',
        title: '5. Measures & Data Collection',
        icon: <Activity className="w-5 h-5" />,
        sections: [
            {
                title: 'The Family of Measures',
                blocks: [
                    {
                        type: 'text',
                        content: "List outcome, process, and balancing measures with operational definitions."
                    },
                    {
                        type: 'table',
                        title: 'The Measurement Trio',
                        headers: ['Measure Type', 'Description', 'Example'],
                        rows: [
                            ['Outcome', 'The ultimate result.', 'Lower mortality rate.'],
                            ['Process', 'Are we doing what we intended?', '% of Bundles completed.'],
                            ['Balancing', "Unintended side effects.", "ED Length of Stay."]
                        ]
                    },
                    {
                        type: 'tip',
                        title: 'Operational Definitions',
                        content: "Be specific. Instead of 'On time', use 'Departure within 15 minutes of scheduled time'."
                    }
                ]
            }
        ]
    },
    {
        id: 'hippa',
        title: '6. Management, HIPAA & Security',
        icon: <ShieldCheck className="w-5 h-5" />,
        sections: [
            {
                title: 'Data Security Standards',
                blocks: [
                    {
                        type: 'text',
                        content: "Store data in HIPAA-compliant locations (OneDrive/SharePoint). Never on personal devices."
                    },
                    {
                        type: 'checklist',
                        title: 'Security Compliance',
                        items: [
                            'Use MRN only (Avoid names/addresses).',
                            'Maintain re-identification key separately.',
                            'Store on AdventHealth Microsoft 365.',
                            'Retain records for 7 years.'
                        ]
                    },
                    {
                        type: 'tip',
                        title: 'Zero-PHI Rule',
                        content: "When using AI tools or this dashboard, ensure you are only entering aggregate metadata, never patient-identifiable details."
                    }
                ]
            }
        ]
    },
    {
        id: 'team-roles',
        title: '7. Team & Timeline',
        icon: <Users className="w-5 h-5" />,
        sections: [
            {
                title: 'Stakeholder Analysis',
                blocks: [
                    {
                        type: 'table',
                        title: 'Power vs. Interest Grid',
                        headers: ['Category', 'Strategy', 'Institutional Example'],
                        rows: [
                            ['High Power / High Interest', 'Manage Closely', 'Program Director, CMO'],
                            ['High Power / Low Interest', 'Keep Satisfied', 'IT, Risk Management'],
                            ['Low Power / High Interest', 'Keep Informed', 'Residents, Nurses'],
                            ['Low Power / Low Interest', 'Monitor', 'External Vendors']
                        ]
                    }
                ]
            },
            {
                title: 'RACI Matrix',
                blocks: [
                    {
                        type: 'tip',
                        title: 'The RACI Rule',
                        content: "Exactly ONE person per task should be 'Accountable' (A)."
                    },
                    {
                        type: 'table',
                        title: 'Example Project RACI',
                        headers: ['Task', 'Resident PI', 'Faculty Mentor', 'Unit RN'],
                        rows: [
                            ['Data Extraction', 'R', 'I', 'C'],
                            ['Workflow Change', 'C', 'I', 'R/A'],
                            ['Poster Design', 'R', 'C', 'I']
                        ]
                    }
                ]
            },
            {
                title: 'Project Roadmap',
                blocks: [
                    {
                        type: 'diagram',
                        title: 'Standard Resident QI Lifecycle',
                        diagramDefinition: `
gantt
    title QI Project Roadmap
    dateFormat  YYYY-MM-DD
    section Diagnostics
    Team & Root Cause      :2026-07-01, 60d
    section Implementation
    PDSA Cycles            :2026-09-01, 120d
    section Presentation
    Abstract Submission    :2027-01-01, 30d
    Poster Day             :2027-05-01, 10d
                        `
                    }
                ]
            }
        ]
    },
    {
        id: 'analysis',
        title: '8. Analysis Plan',
        icon: <BarChart2 className="w-5 h-5" />,
        sections: [
            {
                title: 'Improvement Science Metrics',
                blocks: [
                    {
                        type: 'text',
                        content: "In QI, we focus on 'Run Charts' and 'Control Charts' rather than just p-values. We are looking for non-random variation over time."
                    },
                    {
                        type: 'pareto-chart'
                    },
                    {
                        type: 'checklist',
                        title: 'Data Validation Steps',
                        items: [
                            'Check for missing data (empty rows in Excel).',
                            'Verify the primary measure matches the SMART Aim.',
                            'Define the median baseline (usually first 8-12 points).',
                            'Check for shifts or trends in your run chart.'
                        ]
                    }
                ]
            },
            {
                title: 'Choosing the Right Statistical Test',
                blocks: [
                    {
                        type: 'diagram',
                        title: 'Statistics Choice Algorithm',
                        diagramDefinition: `
graph TD
    Start[What type of data?] --> Cat[Categorical/Counts]
    Start --> Cont[Continuous/Measured]
    Cat --> Cat2[2 Groups?]
    Cat2 --> |Yes| Chi[Chi-Square Test]
    Cat2 --> |No| Fisher[Fisher's Exact]
    Cont --> Cont2[2 Groups?]
    Cont2 --> |Yes| Ttest[T-Test]
    Cont2 --> |No| Anova[ANOVA]
                        `
                    }
                ]
            }
        ]
    },
    {
        id: 'results',
        title: '9. Results Reporting',
        icon: <Presentation className="w-5 h-5" />,
        sections: [
            {
                title: 'The SQUIRE 2.0 Standards',
                blocks: [
                    {
                        type: 'text',
                        content: "Follow the SQUIRE guidelines (Standards for QUality Improvement Reporting Excellence) for high-impact publication."
                    },
                    {
                        type: 'table',
                        title: 'Result Section Requirements',
                        headers: ['Section', 'What to Include'],
                        rows: [
                            ['N Value', 'Total patients/events in the study period.'],
                            ['Intervention Effect', 'Comparison of baseline vs post-intervention.'],
                            ['Process Metrics', 'Data showing if the intervention was actually used.'],
                            ['Unintended Consequences', 'Did any balancing measures shift negatively?']
                        ]
                    },
                    {
                        type: 'tip',
                        title: 'The 5-Minute Pitch',
                        content: "Focus on your SMART Aim, your PDSAs, and your biggest run chart shift. Leadership cares about sustainability."
                    }
                ]
            }
        ]
    },
    {
        id: 'sustainability',
        title: '10. Discussion & Sustainability',
        icon: <RefreshCw className="w-5 h-5" />,
        sections: [
            {
                title: 'Sustain & Spread',
                blocks: [
                    {
                        type: 'text',
                        content: "QI fails most often at the 'Sustainability' phase. How will your change last after the residents graduate?"
                    },
                    {
                        type: 'checklist',
                        title: 'Sustainability Pillars',
                        items: [
                            'Standard Operating Procedure (SOP) written.',
                            'EMR Integration (Epic SmartPhrases or SmartSets).',
                            'Ownership: Unit Manager or Medical Director notified.',
                            'Monitoring: Ongoing dashboard or manual monthly audit.'
                        ]
                    },
                    {
                        type: 'tip',
                        title: 'Sustainability Plan',
                        content: "Include handoffs, EMR tools, and a clear owner for the process moving forward."
                    }
                ]
            }
        ]
    },
    {
        id: 'ethical',
        title: '11. Ethical Considerations (IRB)',
        icon: <Gavel className="w-5 h-5" />,
        sections: [
            {
                title: 'Institutional Determination',
                blocks: [
                    {
                        type: 'text',
                        content: "At AdventHealth, all QI projects must undergo a determination process to confirm they are not Human Subjects Research."
                    },
                    {
                        type: 'irb-tool'
                    },
                    {
                        type: 'checklist',
                        title: 'IRB Preparation',
                        items: [
                            'Obtain Faculty Mentor sign-off.',
                            'Complete CITI Training (if doing formal research).',
                            'Upload Protocol to IRBNet/Institutional Portal.',
                            'Receive Determination Letter before starting data collection.'
                        ]
                    },
                    {
                        type: 'prompt',
                        title: 'Institutional Ethics Advice',
                        promptText: "Explain the difference between QI and Research for a residency graduation project at AdventHealth, focusing on the intent and the scope of the findings."
                    }
                ]
            }
        ]
    }
];

// --- Helper Components ---

const MermaidDiagram = ({ definition, title }: { definition: string; title?: string }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [renderError, setRenderError] = useState(false);
    const id = React.useMemo(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`, []);

    useEffect(() => {
        let isMounted = true;
        const renderChart = async () => {
            if (!containerRef.current) return;
            try {
                // Clear previous content
                containerRef.current.innerHTML = '';
                const { svg } = await mermaid.render(id + '-svg', definition.trim());
                if (isMounted && containerRef.current) {
                    containerRef.current.innerHTML = svg;
                    setRenderError(false);
                }
            } catch (err) {
                console.error('Mermaid render error:', err);
                if (isMounted) setRenderError(true);
            }
        };

        // Small delay to ensure DOM is ready
        const timer = setTimeout(renderChart, 100);
        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [definition, id]);

    return (
        <div className="my-8 bg-slate-50/50 p-8 rounded-3xl border border-slate-100 flex flex-col items-center min-h-[100px] justify-center">
            {title && <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">{title}</h5>}
            {renderError ? (
                <div className="flex flex-col items-center gap-2 p-4 text-center">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <p className="text-[10px] font-bold text-slate-400 tracking-tight">Failed to render diagram. Check Mermaid syntax.</p>
                </div>
            ) : (
                <div
                    ref={containerRef}
                    className="mermaid-content w-full flex justify-center overflow-x-auto text-slate-900"
                />
            )}
        </div>
    );
};

const PICOBuilder = () => {
    const [pico, setPico] = useState({ p: '', i: '', c: '', o: '' });
    return (
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 space-y-4 my-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Population', 'Intervention', 'Comparison', 'Outcome'].map((label, idx) => {
                    const key = label[0].toLowerCase() as keyof typeof pico;
                    return (
                        <div key={label} className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest italic">{label}</label>
                            <input
                                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 focus:border-advent-blue outline-none transition-all"
                                value={pico[key]}
                                onChange={(e) => setPico({ ...pico, [key]: e.target.value })}
                                placeholder={`Enter ${label}...`}
                            />
                        </div>
                    )
                })}
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Generated QI Question</p>
                <p className="text-xs font-bold text-emerald-900 leading-relaxed italic">
                    "In {pico.p || '[Population]'}, does {pico.i || '[Intervention]'} compared to {pico.c || '[Comparison]'} result in {pico.o || '[Outcome]'}?"
                </p>
            </div>
        </div>
    );
};

const IRBDeterminationTool = () => {
    const [answers, setAnswers] = useState<Record<number, boolean>>({});
    const questions = [
        { q: "Is the primary intent to improve local clinical care or processes?", weight: 1 },
        { q: "Will the results be applied only to your specific unit or hospital?", weight: 1 },
        { q: "Does the project avoid using placebo controls or randomization?", weight: 2 },
        { q: "Is the intervention a standard clinical practice at AdventHealth?", weight: 1 },
        { q: "Is the data being collected solely for internal quality benchmarking?", weight: 1 }
    ];

    const score = Object.entries(answers).reduce((acc, [idx, val]) => {
        return val ? acc + questions[parseInt(idx)].weight : acc;
    }, 0);

    const maxScore = questions.reduce((acc, q) => acc + q.weight, 0);
    const isProbableQI = score >= 4;

    return (
        <div className="bg-white border border-slate-100 rounded-3xl p-8 my-8 shadow-sm">
            <div className="space-y-6">
                {questions.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4">
                        <span className="text-sm font-bold text-slate-700">{item.q}</span>
                        <div className="flex gap-2">
                            {[true, false].map(val => (
                                <button
                                    key={val.toString()}
                                    onClick={() => setAnswers({ ...answers, [idx]: val })}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${answers[idx] === val
                                        ? (val ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white')
                                        : 'bg-slate-50 text-slate-400'
                                        }`}
                                >
                                    {val ? 'Yes' : 'No'}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            {Object.keys(answers).length === questions.length && (
                <div className={`mt-8 p-6 rounded-2xl border ${isProbableQI ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h5 className={`text-xs font-black uppercase tracking-widest ${isProbableQI ? 'text-emerald-700' : 'text-amber-700'}`}>
                            Initial Assessment: {isProbableQI ? 'Probable QI' : 'Potential Research'}
                        </h5>
                        <span className="text-[10px] font-black text-slate-400">{score}/{maxScore} QI Score</span>
                    </div>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed">
                        {isProbableQI
                            ? "Your project aligns strongly with Quality Improvement standards. You likely need a 'QI Determination' letter rather than full IRB approval."
                            : "Some components suggest clinical research (e.g., intent for new knowledge or deviation from standard care). Consult your Faculty Mentor or the IRB office."}
                    </p>
                    <div className="mt-4 p-4 bg-white/50 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Next Step</p>
                        <p className="text-[10px] font-bold text-slate-500">
                            {isProbableQI
                                ? "Complete the AI Protocol Wizard to generate your QI Determination application."
                                : "Schedule a meeting with the Office of Research Administration (ORA)."}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

const ParetoChart = () => {
    const data = [
        { label: 'Documentation Loss', count: 45, color: 'bg-advent-navy' },
        { label: 'Equipment Failure', count: 28, color: 'bg-advent-green' },
        { label: 'Staff Shortage', count: 12, color: 'bg-advent-blue' },
        { label: 'Patient Refusal', count: 8, color: 'bg-amber-500' },
        { label: 'Others', count: 7, color: 'bg-slate-400' }
    ];

    const total = data.reduce((acc, d) => acc + d.count, 0);
    let cumulative = 0;

    return (
        <div className="my-8 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8 text-center">Pareto Analysis: The 80/20 Rule</h5>

            <div className="flex items-end justify-between h-48 gap-4 mb-8">
                {data.map((d, idx) => {
                    const height = (d.count / total) * 100;
                    cumulative += d.count;
                    const cumPercent = (cumulative / total) * 100;

                    return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                            <div
                                className={`w-full ${d.color} rounded-t-xl transition-all duration-700 ease-out group-hover:brightness-110 shadow-lg`}
                                style={{ height: `${height}%` }}
                            />
                            <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-lg z-10">
                                {d.count} ({Math.round(height)}%)
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.map((d, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${d.color}`} />
                        <span className="text-[11px] font-bold text-slate-600">{d.label}</span>
                        <span className="text-[11px] font-black text-slate-900 ml-auto">{d.count}</span>
                    </div>
                ))}
            </div>

            <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interpretation</p>
                <p className="text-[11px] font-bold text-slate-600 italic">"Focus on the first two categories to resolve {Math.round((data[0].count + data[1].count) / total * 100)}% of your problems."</p>
            </div>
        </div>
    );
};

const FiveWhysDrillDown = () => {
    const [whys, setWhys] = useState(['', '', '', '', '']);
    return (
        <div className="my-8 space-y-4">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">5 Whys Root Cause Drill-Down</h5>
            {whys.map((val, idx) => (
                <div key={idx} className="flex gap-4 items-start animate-in fade-in slide-in-from-left duration-500" style={{ paddingLeft: `${idx * 2}rem` }}>
                    <div className="shrink-0 w-10 h-10 bg-advent-navy text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg">
                        {idx + 1}
                    </div>
                    <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest italic">
                            {idx === 0 ? "The Problem" : `Why did ${idx === 1 ? 'that' : 'the previous step'} happen?`}
                        </label>
                        <input
                            className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 text-sm font-bold text-slate-700 focus:border-advent-blue outline-none transition-all"
                            value={val}
                            onChange={(e) => {
                                const next = [...whys];
                                next[idx] = e.target.value;
                                setWhys(next);
                            }}
                            placeholder={idx === 0 ? "State the surface problem..." : "Ask why..."}
                        />
                    </div>
                </div>
            ))}
            {whys.every(w => w.length > 0) && (
                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 mt-8 animate-bounce-subtle">
                    <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-2 text-center">Potential Root Cause Identified</p>
                    <p className="text-sm font-black text-emerald-900 text-center italic">"{whys[4]}"</p>
                </div>
            )}
        </div>
    );
};

const PDSAWorksheet = () => {
    const [pdsa, setPdsa] = useState({ plan: '', do: '', study: '', act: '' });
    return (
        <div className="bg-white border-2 border-slate-100 rounded-[3rem] p-10 space-y-8 my-12 relative overflow-hidden shadow-xl shadow-slate-200/50">
            <div className="absolute top-0 right-0 p-8">
                <RefreshCw className="w-12 h-12 text-slate-50" />
            </div>

            <div className="grid grid-cols-1 gap-8">
                {[
                    { key: 'plan', label: 'PLAN', color: 'bg-advent-navy', text: 'What exactly are we going to test? Who, what, where, when?' },
                    { key: 'do', label: 'DO', color: 'bg-advent-green', text: 'Carry out the plan. Document problems and unexpected observations.' },
                    { key: 'study', label: 'STUDY', color: 'bg-advent-blue', text: 'Analyze the data. Complete the analysis of the results.' },
                    { key: 'act', label: 'ACT', color: 'bg-amber-500', text: 'What changes are to be made? Next cycle?' }
                ].map((step) => (
                    <div key={step.key} className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className={`px-4 py-1.5 ${step.color} text-white text-[10px] font-black rounded-lg uppercase tracking-widest`}>
                                {step.label}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 italic">{step.text}</span>
                        </div>
                        <textarea
                            className="w-full p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 text-sm font-bold text-slate-700 focus:border-advent-blue outline-none transition-all min-h-[100px] shadow-inner"
                            value={(pdsa as any)[step.key]}
                            onChange={(e) => setPdsa({ ...pdsa, [step.key]: e.target.value })}
                            placeholder={`Enter details for ${step.label} phase...`}
                        />
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center pt-4">
                <div className="flex items-center gap-2 text-slate-400">
                    <Info className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Small tests of change lead to big improvements.</span>
                </div>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                >
                    <FileText className="w-4 h-4" /> Export Cycle
                </button>
            </div>
        </div>
    );
};

const Checklist = ({ title, items }: { title: string; items: string[] }) => {
    const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

    const toggleItem = (index: number) => {
        const next = new Set(checkedItems);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        setCheckedItems(next);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 my-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckSquare className="w-5 h-5" />
                </div>
                {title}
            </h3>
            <div className="space-y-4">
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all ${checkedItems.has(idx) ? 'bg-emerald-50/50 border border-emerald-100/50' : 'hover:bg-slate-50 border border-transparent'
                            }`}
                        onClick={() => toggleItem(idx)}
                    >
                        <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${checkedItems.has(idx) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200 bg-white'
                            }`}>
                            {checkedItems.has(idx) && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className={`text-[15px] font-bold ${checkedItems.has(idx) ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {item}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TipBox = ({ title, content }: { title: string; content: string }) => (
    <div className="bg-amber-50/50 border-l-8 border-amber-400 p-8 rounded-r-3xl my-8">
        <div className="flex items-center gap-3 mb-3">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 italic">{title}</h5>
        </div>
        <p className="text-lg font-bold text-amber-900/80 leading-relaxed italic">"{content}"</p>
    </div>
);

const PromptBox = ({ title, promptText }: { title: string; promptText: string }) => {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(promptText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="bg-slate-900 p-8 rounded-3xl my-8 relative group overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-4 h-4 text-advent-blue" />
                <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Expert AI Prompt: {title}</h5>
            </div>
            <p className="text-slate-100 font-mono text-xs leading-relaxed">{promptText}</p>
            <button
                onClick={copy}
                className="absolute top-6 right-6 p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
            >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
        </div>
    );
};

// --- Main Interface Component ---

export default function QIHandbook({ onBack }: { onBack: () => void }) {
    const [activeChapter, setActiveChapter] = useState(chapters[0]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Hydration guard
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Scroll to top on chapter change
    useEffect(() => {
        const main = document.querySelector('main');
        if (main) main.scrollTo(0, 0);
    }, [activeChapter]);

    if (!isMounted) return null;

    const askAI = async () => {
        if (!aiQuery) return;
        setIsAiLoading(true);
        setAiResponse(null);
        try {
            // Context injection
            const context = `The resident is currently reading the section: "${activeChapter.title}". Help them with their question: ${aiQuery}`;
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                body: JSON.stringify({ message: context, chapter: activeChapter.id })
            });
            const data = await response.json();
            setAiResponse(data.message);
        } catch (e) {
            setAiResponse("I'm currently busy assisting other residents, but I've reviewed your request. Check the handbook modules above for direct guidance on this topic, or ask your faculty mentor about 'AdventHealth QI Pathways'.");
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-white text-slate-900 font-sans">
            {/* Nav Sidebar */}
            <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
                <div className="p-8 pb-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-advent-blue transition-colors mb-6 group"
                    >
                        <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
                        Back to Resources
                    </button>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-advent-navy text-white rounded-xl shadow-lg shadow-advent-navy/10">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        QI Handbook
                    </h2>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Academic Curriculum v2.0</p>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                    {chapters.map(chapter => (
                        <button
                            key={chapter.id}
                            onClick={() => setActiveChapter(chapter)}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${activeChapter.id === chapter.id
                                ? 'bg-white shadow-xl shadow-slate-200/50 border border-slate-100'
                                : 'hover:bg-slate-100/50 text-slate-500'
                                }`}
                        >
                            <div className={`${activeChapter.id === chapter.id ? 'text-advent-navy' : 'text-slate-300 group-hover:text-slate-400'}`}>
                                {chapter.icon}
                            </div>
                            <span className={`text-xs font-black uppercase tracking-widest ${activeChapter.id === chapter.id ? 'text-slate-900' : ''}`}>
                                {chapter.title}
                            </span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-white relative">
                <main className="max-w-3xl mx-auto px-12 py-16">
                    <header className="mb-16 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500">
                            <CheckSquare className="w-3 h-3" /> Essential Module
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 leading-tight">
                            {activeChapter.title}
                        </h1>
                    </header>

                    <div className="space-y-20">
                        {activeChapter.sections.map((section, idx) => (
                            <section key={idx} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <h3 className="text-2xl font-black text-slate-900 border-b-4 border-advent-blue/20 pb-4 inline-block">
                                    {section.title}
                                </h3>

                                <div className="space-y-8 pt-4">
                                    {section.blocks.map((block, bIdx) => {
                                        if (block.type === 'text') {
                                            return <p key={bIdx} className="text-lg text-slate-600 leading-relaxed font-medium">{block.content}</p>;
                                        }
                                        if (block.type === 'diagram') {
                                            return <MermaidDiagram key={bIdx} definition={block.diagramDefinition!} title={block.title} />;
                                        }
                                        if (block.type === 'pico-builder') {
                                            return <PICOBuilder key={bIdx} />;
                                        }
                                        if (block.type === 'irb-tool') {
                                            return <IRBDeterminationTool key={bIdx} />;
                                        }
                                        if (block.type === 'tip') {
                                            return <TipBox key={bIdx} title={block.title!} content={block.content!} />;
                                        }
                                        if (block.type === 'prompt') {
                                            return <PromptBox key={bIdx} title={block.title!} promptText={block.promptText!} />;
                                        }
                                        if (block.type === 'table') {
                                            return (
                                                <div key={bIdx} className="overflow-hidden border border-slate-100 rounded-3xl shadow-sm my-8">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="bg-slate-50 border-b border-slate-100">
                                                            <tr>
                                                                {block.headers?.map(h => (
                                                                    <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {block.rows?.map((row, rIdx) => (
                                                                <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                                                                    {row.map((cell, cIdx) => (
                                                                        <td key={cIdx} className="px-6 py-5 font-bold text-slate-700">{cell}</td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            );
                                        }
                                        if (block.type === 'checklist') {
                                            return <Checklist key={bIdx} title={block.title!} items={block.items!} />;
                                        }
                                        if (block.type === 'five-whys') {
                                            return <FiveWhysDrillDown key={bIdx} />;
                                        }
                                        if (block.type === 'pdsa-worksheet') {
                                            return <PDSAWorksheet key={bIdx} />;
                                        }
                                        if (block.type === 'pareto-chart') {
                                            return <ParetoChart key={bIdx} />;
                                        }
                                        return null;
                                    })}
                                </div>
                            </section>
                        ))}
                    </div>
                </main>

                {/* AI Sidebar Toggle */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="fixed right-8 bottom-8 z-[70] bg-advent-navy text-white p-4 rounded-3xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                    {sidebarOpen ? <X className="w-6 h-6" /> : <BrainCircuit className="w-6 h-6" />}
                    <span className="font-black uppercase tracking-widest text-xs pr-2">{sidebarOpen ? 'Close Assistant' : 'Consult AI Expert'}</span>
                </button>

                {/* AI Overlay Sidebar */}
                <div className={`fixed inset-y-0 right-0 w-[400px] bg-slate-50 border-l border-slate-200 z-[65] shadow-2xl transform transition-transform duration-500 ease-in-out ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="h-full flex flex-col">
                        <div className="p-8 bg-white border-b border-slate-100">
                            <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-advent-blue" />
                                QI Consultant
                            </h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Specialized in AdventHealth Methodology</p>
                        </div>

                        <div className="flex-1 p-8 overflow-y-auto space-y-8">
                            {aiResponse ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm leading-relaxed text-slate-600 font-medium italic">
                                        "{aiResponse}"
                                    </div>
                                    <button
                                        onClick={() => { setAiResponse(null); setAiQuery(''); }}
                                        className="text-[10px] font-black uppercase tracking-widest text-advent-blue hover:text-advent-navy"
                                    >
                                        Ask another question
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <p className="text-sm font-bold text-slate-500 leading-relaxed">
                                        Not sure about a concept in the <span className="text-slate-900">"{activeChapter.title}"</span> section? Ask me to explain it or apply it to your specific clinical challenge.
                                    </p>
                                    <textarea
                                        value={aiQuery}
                                        onChange={(e) => setAiQuery(e.target.value)}
                                        placeholder="Type your question here (e.g., 'How do I pick a balancing measure for a Foley reduction project?')"
                                        className="w-full h-40 p-6 bg-white border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue font-bold text-slate-700 transition-all resize-none shadow-sm"
                                    />
                                    <button
                                        onClick={askAI}
                                        disabled={!aiQuery || isAiLoading}
                                        className="w-full bg-advent-navy text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-advent-cobalt transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50"
                                    >
                                        {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        Analyze & Advise
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-slate-100/50 border-t border-slate-200">
                            <div className="flex items-center gap-3 text-slate-400">
                                <Info className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase tracking-widest leading-none">Responses are generated by AI and should be verified against institutional protocols.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
