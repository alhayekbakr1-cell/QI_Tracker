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
    Loader2,
    Search,
    Filter
} from 'lucide-react';

import { createClient } from '@/utils/supabase/client';
import { draftProtocol, getQIAdvice } from '@/utils/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    type: 'text' | 'checklist' | 'tip' | 'table' | 'prompt' | 'comparison' | 'irb-tool' | 'diagram' | 'pico-builder' | 'five-whys' | 'pdsa-worksheet' | 'pareto-chart' | 'idea-selector';
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
    },
    {
        id: 'ideas-bank',
        title: '12. High-Impact QI Ideas',
        icon: <Lightbulb className="w-5 h-5" />,
        sections: [
            {
                title: 'High-Impact QI Project Registry',
                blocks: [
                    {
                        type: 'text',
                        content: "Struggling to find a residency graduation project? These pre-vetted templates align with AdventHealth clinical priorities and are designed to easily yield abstracts for national GME, ACP, and SHM research days. Explore and tailor them directly using the interactive bank below."
                    },
                    {
                        type: 'idea-selector'
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
    const [isDrafting, setIsDrafting] = useState(false);
    const [protocolDraft, setProtocolDraft] = useState<string | null>(null);

    const handleDraft = async () => {
        if (!pico.p || !pico.i || !pico.o) {
            alert("Please fill in at least Population, Intervention, and Outcome first.");
            return;
        }
        setIsDrafting(true);
        try {
            const draft = await draftProtocol(pico);
            setProtocolDraft(draft);
        } catch (e) {
            console.error("Drafting error:", e);
            alert("Failed to draft protocol. Ensure PICO fields are meaningful.");
        } finally {
            setIsDrafting(false);
        }
    };

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

            <div className="pt-2">
                <button
                    onClick={handleDraft}
                    disabled={isDrafting}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-advent-blue bg-advent-blue/5 px-4 py-2 rounded-xl hover:bg-advent-blue/10 transition-all border border-advent-blue/10 disabled:opacity-50"
                >
                    {isDrafting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Draft AI Protocol (300 Words)
                </button>
            </div>

            {protocolDraft && (
                <div className="mt-4 p-6 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Protocol Draft</p>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(protocolDraft);
                                alert("Copied to clipboard!");
                            }}
                            className="text-[9px] font-black uppercase tracking-widest text-advent-blue hover:underline"
                        >
                            Copy to Clipboard
                        </button>
                    </div>
                    <div className="text-xs text-slate-700 font-bold whitespace-pre-wrap leading-relaxed prose prose-slate max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {protocolDraft}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
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

// --- Interactive Project Idea Selector ---
const ProjectIdeaSelector = ({ onSelectIdea }: { onSelectIdea?: (query: string) => void }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const categories = ['All', 'Quality & Safety', 'Operational & Transitions', 'High Value & Ethics', 'Outpatient'];

    const ideas = [
        {
            id: 1,
            title: "Inpatient Hypoglycemia Safety",
            category: "Quality & Safety",
            gap: "Inappropriate sliding-scale insulin monotherapy and excessive basal dosing lead to severe inpatient hypoglycemia, prolonging hospital stays and increasing mortality.",
            aim: "Decrease the incidence of inpatient hypoglycemia (blood glucose <70 mg/dL) on General Medicine Wards by 35% within 6 months of intervention.",
            intervention: "Remove 'sliding-scale only' order templates from admission sets; implement automated EMR weight-based basal-bolus calculators; standardize immediate nurse rescue dextrose protocols.",
            outcome: "Number of blood glucose readings <70 mg/dL per 1,000 patient-days.",
            process: "Percentage of diabetic admissions ordered on weight-based basal-bolus therapy vs. sliding-scale alone.",
            balancing: "Rate of severe hyperglycemia (>250 mg/dL) resulting in acute clinical escalations or DKA.",
            emr: "Epic SmartPhrase checklist `.glycemicrounds` to document daily necessity of insulin adjustments.",
            venue: "ACP Quality Care Symposium, SHM Converge, local GME Research Day."
        },
        {
            id: 2,
            title: "First-Day Discharge Optimization",
            category: "Operational & Transitions",
            gap: "Inpatient discharge delays prevent bed turn-around, causing Emergency Department boarding. Most discharges occur late in the afternoon despite patients being clinically stable in the morning.",
            aim: "Increase the proportion of patients discharged from the General Internal Medicine service before 12:00 PM from a baseline of 15% to 45% by June 2027.",
            intervention: "Mandate a 4:00 PM 'Pre-Discharge huddle with pharmacy, nursing, and case management; implement a 'Pending Discharge' EMR flag to prioritize morning medication reconciliations.",
            outcome: "Percentage of discharges executed before 12:00 PM.",
            process: "Percentage of discharge summaries signed and ready by 9:00 AM on the day of discharge.",
            balancing: "30-day all-cause readmission rate (ensuring patients are not discharged prematurely).",
            emr: "Epic smart flag showing 'Ready for Morning Discharge' to alert transportation teams.",
            venue: "SHM Converge (Hospital Medicine), IHI National Forum."
        },
        {
            id: 3,
            title: "Geriatric Preventive Vaccination",
            category: "Outpatient",
            gap: "High-risk geriatric patients often miss opportunities to receive pneumococcal and influenza vaccines due to short outpatient appointment times and high physician cognitive load.",
            aim: "Achieve a 90% compliance rate for pneumococcal vaccination among patients aged >= 65 seen at resident continuity clinics by December 2026.",
            intervention: "Establish Medical Assistant (MA)-driven immunization screening at intake huddle; create standing EMR order sets allowing MAs to prepare and administer vaccines directly.",
            outcome: "Percentage of clinic patients >= 65 with documented up-to-date vaccine compliance.",
            process: "Percentage of encounters where the MA completed the vaccination screening checklist.",
            balancing: "Patient clinic throughput time (ensuring vaccine administration steps do not stall patient flow).",
            emr: "Epic Health Maintenance utility configuration for active alert triggers.",
            venue: "SGIM Annual Meeting, AAIM Academy."
        },
        {
            id: 4,
            title: "Lab Reduction & High-Value Care",
            category: "High Value & Ethics",
            gap: "Repetitive daily lab draws (CBC/BMP) on stable inpatients lead to hospital-acquired anemia, patient discomfort, and excessive costs without changing clinical management.",
            aim: "Reduce routine daily CBC and BMP lab draws on General Medicine Wards by 30% within 4 months of program launch.",
            intervention: "Remove 'recurring daily' checkboxes from standard admission templates, requiring daily active order entry; distribute weekly resident team audit scorecards.",
            outcome: "Average number of CBC and BMP lab draws per patient-day on participating units.",
            process: "Percentage of resident orders utilizing recurring 'daily' options.",
            balancing: "Readmission or rapid response activation rates due to delayed diagnosis of severe anemia or electrolyte fluctuations.",
            emr: "Incorporate 'Choosing Wisely' clinical decision alerts in Epic when ordering labs.",
            venue: "ACP Internal Medicine Meeting, Lown Institute Conference."
        },
        {
            id: 5,
            title: "COPD Care Bundle Adherence",
            category: "Operational & Transitions",
            gap: "Inadequate transition planning and inhaler technique instruction for COPD patients lead to high early post-discharge exacerbation and readmission rates.",
            aim: "Decrease 30-day all-cause readmissions for patients admitted with acute COPD exacerbation by 20% by October 2026.",
            intervention: "Deliver a standardized pre-discharge teaching bundle including pharmacist-led inhaler technique checks; schedule nurse practitioner follow-up phone calls within 48 hours.",
            outcome: "30-day all-cause COPD readmission rates.",
            process: "Percentage of discharged COPD patients who received the complete pre-discharge teaching bundle.",
            balancing: "Emergency Department visits for COPD within 7 days of discharge.",
            emr: "Epic COPD smart discharge order set containing automated post-acute referrals.",
            venue: "ATS International Conference, CHEST Annual Meeting."
        },
        {
            id: 6,
            title: "Inpatient Code Status Clarification",
            category: "High Value & Ethics",
            gap: "Lack of early goals-of-care discussions results in code status mismatch, exposing terminally ill patients to undesired invasive interventions and causing family distress.",
            aim: "Achieve 100% documentation of code status within the first 12 hours of admission for all General Medicine patients by December 2026.",
            intervention: "Mandate an admission note EMR checkbox linked to mandatory code status field entry; hold interactive resident workshops on conducting high-quality goals-of-care conversations.",
            outcome: "Percentage of admissions with documented code status within 12 hours.",
            process: "Percentage of admission notes utilizing the standardized goals-of-care checklist.",
            balancing: "Patient/family satisfaction scores on communication; time to palliative care consultation.",
            emr: "Epic SmartSet checkpoint blocking order signature until code status field is updated.",
            venue: "AAHPM Annual Assembly, local Bioethics Symposium."
        },
        {
            id: 7,
            title: "Foley Necessity & CAUTI Prevention",
            category: "Quality & Safety",
            gap: "Indwelling urinary catheters are frequently left in place without clear medical indications, directly causing hospital-acquired CAUTIs and increasing patient discomfort.",
            aim: "Reduce the rate of CAUTIs on inpatient medical wards by 40% and catheter-days by 25% within 6 months.",
            intervention: "Implement daily nurse-led Foley necessity assessments during multidisciplinary rounds; enforce strict standardized aseptic insertion bundle kits.",
            outcome: "Catheter-associated UTI rate per 1,000 device-days; total catheter-days.",
            process: "Percentage of patient huddles where Foley necessity was actively discussed and documented.",
            balancing: "Rate of emergency recatheterization within 24 hours of catheter removal.",
            emr: "Automated daily Epic alert asking physician to justify catheter retention or order removal.",
            venue: "IDWeek (Infectious Diseases), APIC Annual Conference."
        },
        {
            id: 8,
            title: "Sepsis 3-Hour Bundle Execution",
            category: "Quality & Safety",
            gap: "Delays in early fluid resuscitation and antibiotic administration for patients in severe sepsis increase progression to septic shock and elevate hospital mortality.",
            aim: "Increase compliance with the CMS Sepsis 3-hour bundle in the Emergency Department and Medical Wards from 62% to 85% by June 2027.",
            intervention: "Deploy an EMR real-time alert trigger based on systemic inflammatory response criteria; implement a nurse-driven rapid sepsis protocol kit (pre-packaged blood culture vials and IV fluids).",
            outcome: "CMS Sepsis 3-Hour Bundle compliance rate; inpatient sepsis-related mortality.",
            process: "Time from arrival to antibiotic administration (minutes).",
            balancing: "Rates of fluid overload or urgent ICU escalations in patients with congestive heart failure or severe CKD.",
            emr: "Best Practice Advisory (BPA) alert in Epic prompting rapid order set execution.",
            venue: "SCCM Critical Care Congress, Society of Hospital Medicine."
        },
        {
            id: 9,
            title: "Inpatient Telemetry Stewardship",
            category: "High Value & Ethics",
            gap: "Repetitive, non-indicated telemetry monitoring in low-risk ward patients leads to alarm fatigue, patient sleep disruption, and increased healthcare costs without clinical benefit.",
            aim: "Reduce non-clinically indicated telemetry patient-days on general medicine wards by 35% within 5 months of implementation.",
            intervention: "Remove 'indefinite' telemetry orders, implementing an automated 48-hour hard-stop in the EMR unless explicitly renewed; introduce nurse-led daily telemetry necessity checks during multidisciplinary rounds.",
            outcome: "Total telemetry-days per 1,000 patient-days on participating medical units.",
            process: "Percentage of telemetry orders with an active, documented clinical indication at 24 hours.",
            balancing: "Rate of undetected clinically significant arrhythmia events or rapid response/ICU escalations within 24 hours of telemetry discontinuation.",
            emr: "EMR automated prompt triggering at 48 hours requiring clinical justification to renew telemetry.",
            venue: "Lown Institute Conference, Society of Hospital Medicine (SHM) Converge."
        },
        {
            id: 10,
            title: "Transition of Care Clinic Referrals",
            category: "Operational & Transitions",
            gap: "Poorly coordinated discharge transitions for high-readmission-risk patients (CHF, COPD, End-Stage Renal Disease) lead to rapid outpatient decompensation and high 30-day hospital readmission rates.",
            aim: "Ensure 80% of high-readmission-risk patients discharged from the General Medicine service have a booked outpatient Transition of Care Clinic (TCC) appointment within 7-10 days of discharge by September 2026.",
            intervention: "Enforce a mandatory case-manager checklist during discharge planning; integrate direct EMR booking slots for TCC appointments into the resident discharge workflow.",
            outcome: "30-day all-cause readmission rate for high-risk patients discharged from participating medicine teams.",
            process: "Percentage of eligible high-risk patients discharged with a scheduled TCC appointment booked prior to departure.",
            balancing: "Rate of post-discharge emergency department visits within 7 days of discharge (ensuring TCC visits do not just shift readmissions to ED visits).",
            emr: "Automated EMR sidebar alert flagging high LACE-index scores and prompt direct-scheduling booking link.",
            venue: "IHI National Forum, AAIM Academic Internal Medicine Week."
        },
        {
            id: 11,
            title: "CIWA Protocol Optimization",
            category: "Quality & Safety",
            gap: "Non-standardized administration of benzodiazepines and inconsistent Clinical Institute Withdrawal Assessment for Alcohol (CIWA) scoring lead to either severe withdrawal progression (delirium tremens) or excessive over-sedation.",
            aim: "Decrease the rate of severe alcohol withdrawal complications and ICU escalations by 40% within 6 months.",
            intervention: "Implement a symptom-triggered CIWA-Ar order set; mandating standard nurse scoring certification; institute a clinical pathway for dexmedetomidine or phenobarbital adjunctive therapy.",
            outcome: "Rate of ICU transfers for acute alcohol withdrawal; average hospital length of stay for patients on CIWA protocol.",
            process: "Percentage of CIWA score assessments completed within 15 minutes of the ordered assessment intervals.",
            balancing: "Rates of severe patient over-sedation requiring rapid response activation or medication reversal agents.",
            emr: "Best Practice Advisory (BPA) alert in Epic prompting the physician to transition from scheduled to symptom-triggered benzodiazepines when CIWA remains low.",
            venue: "ACP Quality Care Symposium, American Society of Addiction Medicine (ASAM)."
        },
        {
            id: 12,
            title: "Outpatient Diabetic Retinopathy Screening",
            category: "Outpatient",
            gap: "Low-income and minority patients with type 2 diabetes face significant barriers to receiving annual dilated eye exams, leading to delayed diagnosis and progression of diabetic retinopathy.",
            aim: "Increase annual diabetic retinopathy screening compliance in resident continuity clinics from a baseline of 40% to 75% by December 2026.",
            intervention: "Implement a handheld, non-mydriatic teleretinal camera in the resident clinic; train clinic Medical Assistants to perform photography during regular visit intake huddles.",
            outcome: "Percentage of active diabetic clinic patients with a documented retinal screening exam within the last 12 months.",
            process: "Percentage of scheduled diabetic clinic visits where retinal screening photography was successfully completed.",
            balancing: "Total duration of clinic visit (minutes) to ensure additional imaging does not delay clinic patient flow.",
            emr: "Configure an EMR health maintenance checklist that directly links teleretinal report uploads to care quality tracking.",
            venue: "SGIM Annual Meeting, American Diabetes Association (ADA) Scientific Sessions."
        },
        {
            id: 13,
            title: "Social Determinants of Health Screening",
            category: "Outpatient",
            gap: "Unaddressed social barriers (food insecurity, housing instability, utility distress) lead to poor clinical compliance, missed appointments, and poor disease control in vulnerable outpatient populations.",
            aim: "Screen 85% of active clinic patients for SDOH using a standardized screening tool during routine primary care encounters within 6 months.",
            intervention: "Implement the PRAPARE screening tool during check-in via electronic clinic tablets; hardwire automated referrals to community health workers based on positive responses.",
            outcome: "Percentage of patients with at least one identified social need who were successfully connected to a community resource within 30 days.",
            process: "Percentage of checked-in primary care visits with a completed SDOH PRAPARE screening questionnaire.",
            balancing: "No-show rates for referred community resource appointments (monitoring whether screening leads to successful connections).",
            emr: "EMR automated flowsheets that pull PRAPARE survey results directly into the resident's clinic note template.",
            venue: "APHA Annual Meeting, SGIM Annual Meeting."
        },
        {
            id: 14,
            title: "Bedside Procedure Consent Standardization",
            category: "High Value & Ethics",
            gap: "Bedside invasive clinical procedures (thoracentesis, paracentesis, lumbar puncture) frequently lack standardized informed consent documentation, leaving patients unaware of procedural risks and exposing physicians to legal liability.",
            aim: "Achieve 100% compliance with complete, standardized informed consent documentation prior to any resident-performed bedside invasive procedure by November 2026.",
            intervention: "Mandate a standard pre-procedural checklist and 'Time Out' form containing explicit patient risk disclosures; hold hands-on resident training sessions regarding structured consent conversations.",
            outcome: "Percentage of resident bedside procedures with complete, signed, and documented standardized consent forms.",
            process: "Percentage of procedures where the resident documented a 'Time Out' checklist in the EMR.",
            balancing: "Patient satisfaction score on procedural communication and informed choice.",
            emr: "Build an Epic procedural note template that blocks note completion until the consent verification field and date are updated.",
            venue: "Association for Hospital Medical Education (AHME), local GME Quality Day."
        },
        {
            id: 15,
            title: "Meds-to-Beds Discharge Prescription Delivery",
            category: "Operational & Transitions",
            gap: "Discharge medication discrepancies and difficulty obtaining medications post-discharge are major contributors to early post-hospitalization adverse events and 30-day readmissions.",
            aim: "Increase the rate of bedside medication delivery ('Meds-to-Beds' pharmacy program) for patients discharged from the General Medicine service from 20% to 60% by January 2027.",
            intervention: "Streamline hospital pharmacy prescription delivery workflow; mandate resident completion of discharge order sets 4 hours prior to planned departure to allow pharmacy prep time.",
            outcome: "Rate of post-discharge adverse drug events within 14 days of discharge; 30-day readmission rate.",
            process: "Percentage of discharges utilizing the bedside Meds-to-Beds program.",
            balancing: "Outpatient pharmacy operational strain (number of delayed deliveries past the planned discharge hour).",
            emr: "Epic discharge navigator checkpoint reminding residents to select 'Deliver to bedside' in the discharge prescription section.",
            venue: "ASHP Midyear Clinical Meeting, SHM Converge."
        },
        {
            id: 16,
            title: "Peripheral IV Stewardship & Dwell-Time Compliance",
            category: "Quality & Safety",
            gap: "Overutilization of unnecessary peripheral intravenous lines and failure to regularly assess line patency lead to high rates of phlebitis, local infection, and patient discomfort.",
            aim: "Reduce the average number of redundant peripheral IV days and decrease clinical phlebitis events by 35% on medicine wards within 6 months.",
            intervention: "Implement a nurse-driven daily PIV assessment checklist; institute a hard stop prompting removal of PIV lines that have been inactive for >24 hours unless indicated.",
            outcome: "Rate of hospital-acquired PIV phlebitis per 1,000 patient-days; total PIV-days.",
            process: "Percentage of active PIV lines that have been assessed and documented by nursing staff every 12 hours.",
            balancing: "Rates of emergency re-insertion of PIV lines for acute medication administration.",
            emr: "Dynamic EMR notification alerting nurses and doctors of PIV lines with zero active IV medications or fluids for 24 consecutive hours.",
            venue: "Infusion Nurses Society (INS) Annual Conference, local Patient Safety Symposium."
        }
    ];

    const filtered = ideas.filter(idea => {
        const matchesTab = activeTab === 'All' || idea.category === activeTab;
        const matchesSearch = idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            idea.gap.toLowerCase().includes(searchTerm.toLowerCase()) ||
            idea.aim.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const copyTemplate = (idea: typeof ideas[0]) => {
        const text = `PROJECT CHARTER TEMPLATE: ${idea.title.toUpperCase()}
Clinical Domain: ${idea.category}

PROBLEM STATEMENT:
${idea.gap}

SMART AIM:
${idea.aim}

CORE INTERVENTIONS:
${idea.intervention}

FAMILY OF MEASURES:
- Outcome Measure: ${idea.outcome}
- Process Measure: ${idea.process}
- Balancing Measure: ${idea.balancing}

EMR INTEGRATION & CLINICAL SYSTEM TOOLS:
${idea.emr}

PROPOSED SUBMISSION VENUES:
${idea.venue}
`;
        navigator.clipboard.writeText(text);
        setCopiedId(idea.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-6 my-6">
            <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                    {/* Search bar */}
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search high-impact ideas (e.g. sepsis, vaccine)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-advent-blue transition-colors text-slate-800"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => { setActiveTab(cat); setExpandedId(null); }}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === cat
                                    ? 'bg-advent-navy text-white shadow-md'
                                    : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200/60'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* List of ideas */}
            <div className="grid grid-cols-1 gap-4">
                {filtered.map(idea => {
                    const isExpanded = expandedId === idea.id;
                    return (
                        <div
                            key={idea.id}
                            className={`bg-white border rounded-3xl transition-all duration-300 shadow-sm overflow-hidden ${
                                isExpanded
                                    ? 'border-advent-blue ring-4 ring-advent-blue/5'
                                    : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
                            }`}
                        >
                            {/* Card header */}
                            <div
                                onClick={() => setExpandedId(isExpanded ? null : idea.id)}
                                className="p-6 flex items-center justify-between gap-4 cursor-pointer"
                            >
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200/40">
                                            {idea.category}
                                        </span>
                                    </div>
                                    <h4 className="text-lg font-black text-slate-900 font-serif hover:text-advent-blue transition-colors">
                                        {idea.title}
                                    </h4>
                                </div>
                                <div className="shrink-0 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">
                                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-advent-blue' : ''}`} />
                                </div>
                            </div>

                            {/* Card Expanded Content */}
                            {isExpanded && (
                                <div className="border-t border-slate-100 p-8 space-y-8 bg-slate-50/30 animate-in fade-in slide-in-from-top-2 duration-300">
                                    {/* The Problem Section */}
                                    <div className="space-y-2">
                                        <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400">The Clinical Gap (Problem Statement)</h5>
                                        <p className="text-sm font-semibold text-slate-700 leading-relaxed">{idea.gap}</p>
                                    </div>

                                    {/* Aim Statement */}
                                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/60">
                                        <h5 className="text-[9px] font-black uppercase tracking-widest text-emerald-700 mb-1">SMART Aim Statement</h5>
                                        <p className="text-sm font-bold text-emerald-900 leading-relaxed italic">"{idea.aim}"</p>
                                    </div>

                                    {/* Proposed Interventions */}
                                    <div className="space-y-2">
                                        <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Core Interventions</h5>
                                        <p className="text-sm font-semibold text-slate-700 leading-relaxed">{idea.intervention}</p>
                                    </div>

                                    {/* Trio of Measures Table */}
                                    <div className="space-y-3">
                                        <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400">The Family of Measures</h5>
                                        <div className="overflow-hidden border border-slate-200/80 rounded-2xl shadow-sm bg-white">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-slate-50 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-3 font-black uppercase text-slate-500 tracking-wider">Measure Type</th>
                                                        <th className="px-4 py-3 font-black uppercase text-slate-500 tracking-wider">Operational Definition</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    <tr>
                                                        <td className="px-4 py-3 font-black text-slate-900 flex items-center gap-1.5">
                                                            <div className="w-2 h-2 rounded-full bg-advent-navy" />
                                                            Outcome Measure
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold text-slate-600">{idea.outcome}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-4 py-3 font-black text-slate-900 flex items-center gap-1.5">
                                                            <div className="w-2 h-2 rounded-full bg-advent-green" />
                                                            Process Measure
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold text-slate-600">{idea.process}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-4 py-3 font-black text-slate-900 flex items-center gap-1.5">
                                                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                            Balancing Measure
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold text-slate-600">{idea.balancing}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* EMR & Venues Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm space-y-1.5">
                                            <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Epic EMR Integration</h5>
                                            <p className="text-xs font-semibold text-slate-600 leading-relaxed">{idea.emr}</p>
                                        </div>
                                        <div className="p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm space-y-1.5">
                                            <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Target Dissemination Venues</h5>
                                            <p className="text-xs font-semibold text-slate-600 leading-relaxed">{idea.venue}</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100 justify-end">
                                        <button
                                            onClick={() => copyTemplate(idea)}
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow"
                                        >
                                            {copiedId === idea.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                            {copiedId === idea.id ? 'Copied Template!' : 'Copy Protocol'}
                                        </button>
                                        {onSelectIdea && (
                                            <button
                                                onClick={() => onSelectIdea(idea.title)}
                                                className="flex items-center gap-2 px-4 py-2 bg-advent-navy text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-advent-navy/90 transition-colors shadow"
                                            >
                                                <Sparkles className="w-3 h-3" />
                                                AI Tailor to My Unit
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Main Interface Component ---

export default function QIHandbook({ onBack }: { onBack: () => void }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<'All' | 'Diagnostics' | 'Execution' | 'Reporting'>('All');
    const [activeChapter, setActiveChapter] = useState(chapters[0]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Metadata & Milestones for Academic Timeline
    const chapterMeta: Record<string, { category: 'Diagnostics' | 'Execution' | 'Reporting'; milestone: string }> = {
        overview: { category: 'Diagnostics', milestone: 'PGY-1 Q1: Aim Selection' },
        background: { category: 'Diagnostics', milestone: 'PGY-1 Q2: Lit Review' },
        outcomes: { category: 'Diagnostics', milestone: 'PGY-1 Q3: SMART Aim' },
        'ideas-bank': { category: 'Diagnostics', milestone: 'PGY-1 Q4: Idea Sourcing' },
        methods: { category: 'Execution', milestone: 'PGY-2 Q1: PDSA Design' },
        measures: { category: 'Execution', milestone: 'PGY-2 Q2: Measures Trio' },
        hippa: { category: 'Execution', milestone: 'PGY-2 Q3: HIPAA Security' },
        'team-roles': { category: 'Execution', milestone: 'PGY-2 Q4: RACI & Roles' },
        analysis: { category: 'Reporting', milestone: 'PGY-3 Q1: Statistical Plan' },
        results: { category: 'Reporting', milestone: 'PGY-3 Q2: SQUIRE Reporting' },
        sustainability: { category: 'Reporting', milestone: 'PGY-3 Q3: Sustain & Spread' },
        ethical: { category: 'Reporting', milestone: 'PGY-3 Q4: IRB Determination' }
    };

    // Hydration guard
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Filter chapters dynamically by search query and category
    const filteredChapters = chapters.filter(chapter => {
        const meta = chapterMeta[chapter.id];
        if (selectedCategory !== 'All' && meta?.category !== selectedCategory) {
            return false;
        }

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            const matchesTitle = chapter.title.toLowerCase().includes(query);
            const matchesSections = chapter.sections.some(section =>
                section.title.toLowerCase().includes(query) ||
                section.blocks.some(block =>
                    (block.content && block.content.toLowerCase().includes(query)) ||
                    (block.title && block.title.toLowerCase().includes(query)) ||
                    (block.items && block.items.some(item => item.toLowerCase().includes(query)))
                )
            );
            return matchesTitle || matchesSections;
        }

        return true;
    });

    // Auto-select first matching chapter if active gets filtered out
    useEffect(() => {
        if (filteredChapters.length > 0 && !filteredChapters.some(c => c.id === activeChapter.id)) {
            setActiveChapter(filteredChapters[0]);
        }
    }, [searchQuery, selectedCategory]);

    // Scroll to top of main area on chapter change
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
            const chapterText = activeChapter.sections.map(s => `Section: ${s.title}\n${s.blocks.filter(b => b.type === 'text').map(b => b.content).join('\n')}`).join('\n\n');
            const response = await getQIAdvice(aiQuery, undefined, chapterText);
            setAiResponse(response);
        } catch (e: any) {
            console.error('AI Assistant Error:', e);
            setAiResponse("I'm currently busy assisting other residents, but I've reviewed your request. Check the handbook modules above for direct guidance on this topic, or ask your faculty mentor about 'AdventHealth QI Pathways'.");
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-white text-slate-900 font-sans">
            {/* Left Nav Control Panel */}
            <div className="w-[22rem] border-r border-slate-100 flex flex-col bg-slate-50/40 shrink-0">
                <div className="p-6 pb-4 border-b border-slate-100 bg-white">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-advent-blue transition-colors mb-4 group"
                    >
                        <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
                        Back to Resources
                    </button>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-advent-navy text-white rounded-xl shadow-lg shadow-advent-navy/10">
                            <BookOpen className="w-4 h-4" />
                        </div>
                        QI Handbook
                    </h2>
                    <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">Academic Curriculum v2.0</p>
                </div>

                {/* Search Bar & Category Quick Filters */}
                <div className="p-4 bg-white border-b border-slate-100 space-y-3">
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search chapters or text..."
                            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:ring-4 focus:ring-advent-navy/5 focus:border-advent-navy text-xs font-bold text-slate-700 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-wider"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                        {(['All', 'Diagnostics', 'Execution', 'Reporting'] as const).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-2.5 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-widest transition-all ${
                                    selectedCategory === cat
                                        ? 'bg-advent-navy text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200/60'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Vertical Chapters Timeline */}
                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 relative scrollbar-thin">
                    {/* Vertical timeline connector */}
                    <div className="absolute left-6 top-8 bottom-8 w-[1.5px] bg-slate-200" />

                    {filteredChapters.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <Info className="w-5 h-5 mx-auto mb-2 text-slate-300" />
                            <p className="text-[9px] font-black uppercase tracking-widest">No matching modules found</p>
                        </div>
                    ) : (
                        filteredChapters.map((chapter) => {
                            const meta = chapterMeta[chapter.id];
                            const isActive = activeChapter.id === chapter.id;

                            return (
                                <div key={chapter.id} className="relative pl-6 group">
                                    {/* Timeline Node dot */}
                                    <div className={`absolute left-0.5 top-3 w-3 h-3 rounded-full border-2 transition-all flex items-center justify-center z-10 ${
                                        isActive
                                            ? 'bg-advent-navy border-advent-navy scale-110 shadow shadow-advent-navy/20'
                                            : 'bg-white border-slate-300 group-hover:border-slate-400'
                                    }`}>
                                        {isActive && <div className="w-1 h-1 bg-white rounded-full" />}
                                    </div>

                                    <div className="space-y-1.5">
                                        <button
                                            onClick={() => setActiveChapter(chapter)}
                                            className={`w-full flex flex-col text-left rounded-xl p-2.5 border transition-all ${
                                                isActive
                                                    ? 'bg-white border-slate-200 shadow-sm font-black'
                                                    : 'border-transparent hover:bg-slate-100/40 text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            <span className={`text-[8.5px] font-black uppercase tracking-widest mb-0.5 ${
                                                isActive ? 'text-advent-navy' : 'text-slate-400'
                                            }`}>
                                                {meta?.milestone}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div className={`${isActive ? 'text-advent-navy animate-pulse' : 'text-slate-300 group-hover:text-slate-400'}`}>
                                                    {chapter.icon}
                                                </div>
                                                <span className={`text-xs font-black uppercase tracking-wider ${
                                                    isActive ? 'text-slate-900' : 'text-slate-600'
                                                }`}>
                                                    {chapter.title}
                                                </span>
                                            </div>
                                        </button>

                                        {/* Table of Contents for Active Chapter */}
                                        {isActive && chapter.sections.length > 0 && (
                                            <div className="pl-3 pr-2 py-1.5 space-y-1.5 bg-slate-50/50 rounded-xl border border-slate-100/50 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <div className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-0.5 pl-1">In this chapter:</div>
                                                {chapter.sections.map((section, sIdx) => (
                                                    <button
                                                        key={sIdx}
                                                        onClick={() => {
                                                            const el = document.getElementById(`section-${chapter.id}-${sIdx}`);
                                                            if (el) {
                                                                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                            }
                                                        }}
                                                        className="w-full flex items-center gap-1.5 text-left py-0.5 text-[9.5px] font-bold text-slate-500 hover:text-advent-blue transition-colors group/item"
                                                    >
                                                        <ChevronRight className="w-2.5 h-2.5 text-slate-300 group-hover/item:text-advent-blue transition-colors shrink-0" />
                                                        <span className="truncate">{section.title}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right Curriculum Canvas */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30 relative">
                <main className="max-w-4xl mx-auto px-8 md:px-12 py-12">
                    <header className="mb-10 space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200/80 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500 shadow-3xs">
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                            {chapterMeta[activeChapter.id]?.milestone}
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 leading-tight tracking-tight">
                            {activeChapter.title}
                        </h1>
                    </header>

                    <div className="space-y-12">
                        {activeChapter.sections.map((section, idx) => (
                            <section
                                key={idx}
                                id={`section-${activeChapter.id}-${idx}`}
                                className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 scroll-mt-6"
                            >
                                <h3 className="text-xl font-black text-slate-900 border-b-2 border-slate-200 pb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-advent-blue rounded-full" />
                                    {section.title}
                                </h3>

                                <div className="space-y-6">
                                    {section.blocks.map((block, bIdx) => {
                                        if (block.type === 'text') {
                                            return (
                                                <p key={bIdx} className="text-sm text-slate-600 leading-relaxed font-semibold">
                                                    {block.content}
                                                </p>
                                            );
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
                                                <div key={bIdx} className="overflow-hidden border border-slate-200/60 rounded-2xl shadow-3xs my-6 bg-white">
                                                    <table className="w-full text-xs text-left">
                                                        <thead className="bg-slate-50 border-b border-slate-200/60">
                                                            <tr>
                                                                {block.headers?.map(h => (
                                                                    <th key={h} className="px-5 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {block.rows?.map((row, rIdx) => (
                                                                <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                                                                    {row.map((cell, cIdx) => (
                                                                        <td key={cIdx} className="px-5 py-4 font-bold text-slate-700">{cell}</td>
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
                                        if (block.type === 'idea-selector') {
                                            return <ProjectIdeaSelector key={bIdx} onSelectIdea={(title) => {
                                                setAiQuery(`I want to tailor the "${title}" project to my specific unit (e.g., Ward 4 West). What are some localized barriers my resident team might face, and how can we adapt the process and balancing measures?`);
                                                setSidebarOpen(true);
                                            }} />;
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
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm leading-relaxed text-slate-600 font-medium prose prose-slate max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {aiResponse}
                                        </ReactMarkdown>
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
