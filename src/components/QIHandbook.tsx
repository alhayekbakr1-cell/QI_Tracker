
"use client"

import React, { useState } from 'react';
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
    Book, // Replaced BookA with Book for stability
    Calendar,
    AlertTriangle,
    Scale,
    Gavel,
    RefreshCw,
    HelpCircle,
    Database,
    Calculator
} from 'lucide-react';

// --- Types ---
interface ContentBlock {
    type: 'text' | 'checklist' | 'tip' | 'table' | 'prompt' | 'comparison' | 'irb-tool';
    content?: string;
    title?: string;
    items?: string[];
    headers?: string[];
    rows?: string[][];
    promptText?: string;
    badExample?: string;
    goodExample?: string;
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

// --- Data Content from Handbook (QI FOCUSED & ENHANCED) ---

const chapters: Chapter[] = [
    {
        id: 'qi-basics',
        title: '1. QI Fundamentals',
        icon: <BookOpen className="w-5 h-5" />,
        sections: [
            {
                title: 'The QI Mindset',
                blocks: [
                    {
                        type: 'text',
                        content: "Quality Improvement is not about working harder; it's about changing the system. If you try to fix a problem by saying 'Residents need to be more careful,' you will fail. QI changes the process so doing the right thing becomes the easiest thing."
                    },
                    {
                        type: 'tip',
                        title: 'QI vs. QA (Quality Assurance)',
                        content: "• QA is reactive: 'Who made the mistake? Let's punish them.' (Bad for culture)\n• QI is proactive: 'Why did the system allow this mistake? Let's fix the process.' (Good for culture)"
                    }
                ]
            },
            {
                title: 'Project Selection (FINER)',
                blocks: [
                    {
                        type: 'text',
                        content: "Use the FINER criteria to validate your idea before you start."
                    },
                    {
                        type: 'table',
                        title: 'The FINER Criteria',
                        headers: ['Letter', 'Meaning', 'Resident Question'],
                        rows: [
                            ['F', 'Feasible', 'Can I do this with available time/resources?'],
                            ['I', 'Interesting', 'Do I care enough to work on this for months?'],
                            ['N', 'Novel', 'Does it add *local* value or new insight?'],
                            ['E', 'Ethical', 'Is the risk minimal? (See IRB tool)'],
                            ['R', 'Relevant', 'Does it matter to our patients/hospital?']
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'team-sustain',
        title: '2. Team & Stakeholders',
        icon: <Users className="w-5 h-5" />,
        sections: [
            {
                title: 'Building the Team',
                blocks: [
                    {
                        type: 'text',
                        content: "QI is a team sport. You cannot fix a hospital process alone. You need a multidisciplinary squad."
                    },
                    {
                        type: 'table',
                        title: 'Who to Recruit',
                        headers: ['Role', 'Why you need them', 'Who to ask'],
                        rows: [
                            ['Physician Champion', 'Political cover and longevity.', 'Attending/Faculty interested in the topic.'],
                            ['Process Owner', 'They control the staff/workflow.', 'Nurse Manager, Unit Director, or Chief Tech.'],
                            ['Frontline Staff', 'They know why things actually fail.', 'Bedside RNs, Residents, Clerks.'],
                            ['Data Expert', 'Access to EHR reports.', 'Quality Dept or Chief Resident.']
                        ]
                    }
                ]
            },
            {
                title: 'Stakeholder Analysis',
                blocks: [
                    {
                        type: 'text',
                        content: "Before you start, map out who cares about your project and who has the power to stop it."
                    },
                    {
                        type: 'table',
                        title: 'Power vs. Interest Grid',
                        headers: ['Category', 'Example', 'Strategy'],
                        rows: [
                            ['High Power / High Interest', 'Residency Program Director, CMO', 'Manage Closely. Engage daily/weekly.'],
                            ['High Power / Low Interest', 'Hospital Legal, IT Dept', 'Keep Satisfied. Meet their requirements.'],
                            ['Low Power / High Interest', 'Junior Residents, Patients', 'Keep Informed. Use them as champions.'],
                            ['Low Power / Low Interest', 'Other Depts', 'Monitor. Don\'t spend too much time here.']
                        ]
                    }
                ]
            },
            {
                title: 'Sustainability (The Handover)',
                blocks: [
                    {
                        type: 'tip',
                        title: 'Passing the Torch',
                        content: "Residents graduate; projects die. To prevent this, create a 'Handover Pack' for the next PGY class."
                    },
                    {
                        type: 'checklist',
                        title: 'The Handover Pack Checklist',
                        items: [
                            'Clean Data Sheet (Excel/RedCap link)',
                            'Process Map of the NEW workflow',
                            'Contact List (Who is the friendly IT person?)',
                            'Login Credentials (for shared accounts)',
                            'Draft Abstract (What has been written so far?)'
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'design',
        title: '3. Designing the Project',
        icon: <Target className="w-5 h-5" />,
        sections: [
            {
                title: 'Root Cause Analysis',
                blocks: [
                    {
                        type: 'text',
                        content: "Before you fix it, you must understand why it's broken. Do not jump to solutions."
                    },
                    {
                        type: 'table',
                        title: 'Tools for Diagnostics',
                        headers: ['Tool', 'Purpose', 'When to use'],
                        rows: [
                            ['The 5 Whys', 'Drill down to the root cause by asking "Why?" 5 times.', 'Simple problems with a linear cause.'],
                            ['Fishbone Diagram', 'Visualizes all potential causes (People, Process, Equipment, Environment).', 'Complex problems with multiple factors.'],
                            ['Process Map', 'Visualizes the actual current steps (not what the policy says).', 'When workflow is confusing or variable.']
                        ]
                    }
                ]
            },
            {
                title: 'Process Mapping 101',
                blocks: [
                    {
                        type: 'text',
                        content: "Draw the 'Current State' before you design the 'Future State'. Use standard symbols."
                    },
                    {
                        type: 'table',
                        title: 'Standard Symbols',
                        headers: ['Shape', 'Meaning'],
                        rows: [
                            ['Oval / Circle', 'Start or End of the process.'],
                            ['Rectangle', 'Activity or Step (e.g., "Nurse draws blood").'],
                            ['Diamond', 'Decision Point (e.g., "Is Pt allergic? Yes/No").'],
                            ['Arrow', 'Direction of flow.']
                        ]
                    }
                ]
            },
            {
                title: 'The AIM Statement',
                blocks: [
                    {
                        type: 'comparison',
                        title: 'Aim Statement Makeover',
                        badExample: "We want to improve communication about discharges.",
                        goodExample: "Increase the % of discharge summaries completed within 24 hours of discharge from 50% to 90% by June 30th on the Med-Surg unit."
                    },
                    {
                        type: 'tip',
                        title: 'Formula',
                        content: "Improve [Process/Outcome] for [Population] at [Setting] from [Baseline] to [Target] by [Date]."
                    }
                ]
            }
        ]
    },
    {
        id: 'equity',
        title: '4. Equity in QI',
        icon: <Scale className="w-5 h-5" />,
        sections: [
            {
                title: 'The Equity Lens',
                blocks: [
                    {
                        type: 'text',
                        content: "QI can inadvertently increase disparities. For example, a high-tech app intervention might help young/wealthy patients while leaving elderly/poor patients behind."
                    },
                    {
                        type: 'tip',
                        title: 'Stratified Data',
                        content: "Don't just look at the average. Always break your data down by Race, Ethnicity, Language, and Insurance Status. You might find your 'improvement' only happened for English speakers."
                    }
                ]
            },
            {
                title: 'Equity Checklist',
                blocks: [
                    {
                        type: 'checklist',
                        title: 'Applying an Equity Lens',
                        items: [
                            'Did we include diverse patient voices in the planning?',
                            'Is the intervention accessible to non-English speakers?',
                            'Does the data show a disparity at baseline?',
                            'Did we check if the intervention widened the gap?'
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'methodology',
        title: '5. Methodology & Data',
        icon: <Activity className="w-5 h-5" />,
        sections: [
            {
                title: 'Data Management',
                blocks: [
                    {
                        type: 'text',
                        content: "Messy data kills projects. Before collecting a single chart, define your variables."
                    },
                    {
                        type: 'tip',
                        title: 'The Data Dictionary',
                        content: "Create a simple document defining every column in your spreadsheet. \nExample: 'Age' = Age in years at admission (Number). 'Readmitted' = Yes/No (0=No, 1=Yes)."
                    }
                ]
            },
            {
                title: 'The Measures',
                blocks: [
                    {
                        type: 'table',
                        title: 'Family of Measures',
                        headers: ['Type', 'Definition', 'Example (Sepsis Project)'],
                        rows: [
                            ['Outcome', 'The result you ultimately want.', 'Sepsis mortality rate.'],
                            ['Process', 'Are we doing the steps correctly?', '% of patients getting antibiotics <1 hour.'],
                            ['Balancing', 'Did we break something else?', 'ED Length of Stay (did we clog the ED?)']
                        ]
                    }
                ]
            },
            {
                title: 'Statistical Tests Cheat Sheet',
                blocks: [
                    {
                        type: 'text',
                        content: "While Run Charts are best for QI, you may need basic stats for your 'Pre' vs 'Post' comparison table."
                    },
                    {
                        type: 'table',
                        title: 'Choosing the Right Test',
                        headers: ['Goal', 'Example', 'Test to Use'],
                        rows: [
                            ['Compare Means (2 Groups)', 'Length of Stay (Intervention vs Control)', 'T-Test (or Wilcoxon if skewed)'],
                            ['Compare Proportions (2 Groups)', 'Readmission Rate (Yes/No)', 'Chi-Square (or Fisher\'s Exact)'],
                            ['Compare Means (3+ Groups)', 'LOS across 3 different wards', 'ANOVA'],
                            ['Correlation', 'Age vs Length of Stay', 'Pearson Correlation']
                        ]
                    }
                ]
            },
            {
                title: 'The Run Chart',
                blocks: [
                    {
                        type: 'text',
                        content: "Don't just use 'Before' and 'After' bar charts. Use a Run Chart (Line chart over time) to see if changes are real."
                    },
                    {
                        type: 'tip',
                        title: 'Rules for "Non-Random" Change',
                        content: "1. Shift: 6 or more consecutive points above or below the median.\n2. Trend: 5 or more consecutive points all going up or all going down.\n3. Astronomical Point: A data point that is blatantly outside historical norms."
                    }
                ]
            }
        ]
    },
    {
        id: 'presentation',
        title: '6. Presenting (Posters)',
        icon: <Presentation className="w-5 h-5" />,
        sections: [
            {
                title: 'Poster Design',
                blocks: [
                    {
                        type: 'text',
                        content: "Keep text minimal. Use bullet points and clear visuals. Most people spend 3 minutes looking at a poster."
                    },
                    {
                        type: 'checklist',
                        title: 'Poster Section Checklist',
                        items: [
                            'Title & Authors (Bold, clear)',
                            'Background (Why is this a problem? Use 1-2 stats)',
                            'Methods (PDSA cycles described simply)',
                            'Results (MUST have a chart/graph)',
                            'Conclusions (What did we learn? What is next?)',
                            'QR Code (Link to full paper/contact)'
                        ]
                    }
                ]
            },
            {
                title: 'Oral Presentation',
                blocks: [
                    {
                        type: 'tip',
                        title: 'The "Elevator Pitch"',
                        content: "Prepare a 1-minute summary: \n'We noticed [Problem]. We aimed to [Goal]. We changed [Intervention]. Our data showed [Result]. We plan to [Next Step].'"
                    }
                ]
            }
        ]
    },
    {
        id: 'ethics-reporting',
        title: '7. Reporting & Ethics',
        icon: <ShieldCheck className="w-5 h-5" />,
        sections: [
            {
                title: 'Is it Research?',
                blocks: [
                    {
                        type: 'text',
                        content: "Use the tool below (based on the UW-Madison Decision Tree) to determine if your project requires full IRB review."
                    },
                    {
                        type: 'irb-tool',
                        title: 'IRB Determination Wizard'
                    }
                ]
            },
            {
                title: 'Publication (SQUIRE 2.0)',
                blocks: [
                    {
                        type: 'checklist',
                        title: 'SQUIRE Checklist Highlights',
                        items: [
                            'Title: Did you identify it as a QI project?',
                            'Context: Did you describe the local unit/culture?',
                            'Intervention: Did you describe the PDSA evolution?',
                            'Analysis: Did you use time-series charts (Run charts)?'
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'ai-qi',
        title: '8. AI Toolkit',
        icon: <BrainCircuit className="w-5 h-5" />,
        sections: [
            {
                title: 'Diagnostic Prompts',
                blocks: [
                    {
                        type: 'prompt',
                        title: 'The "Fishbone" Generator',
                        promptText: "I am investigating a problem: [Problem, e.g., High contamination rates in blood cultures]. Act as a QI expert. Generate a Fishbone (Ishikawa) diagram structure analyzing potential causes across these categories: People, Process, Equipment, Environment, and Management. Ask me clarifying questions if needed."
                    },
                    {
                        type: 'prompt',
                        title: 'The "Driver Diagram" Builder',
                        promptText: "My SMART Aim is: [Insert Aim]. Help me build a Driver Diagram. Suggest 3 Primary Drivers (System components that contribute directly to the aim) and for each, suggest 2 Secondary Drivers (Specific interventions/change ideas)."
                    }
                ]
            },
            {
                title: 'Writing Prompts',
                blocks: [
                    {
                        type: 'prompt',
                        title: 'The "Data Dictionary" Builder',
                        promptText: "These are the variables I plan to collect for a retrospective QI project on [Topic]: [List]. Create a data dictionary table with variable name, definition, units, allowed values (e.g., 0=No, 1=Yes), and likely EHR source. Do not include patient-level data."
                    },
                    {
                        type: 'prompt',
                        title: 'The "SQUIRE" Methods Drafter',
                        promptText: "Here are my notes on our PDSA cycles: [Paste Notes]. Draft the 'Methods' section for a QI manuscript. Use the SQUIRE 2.0 guidelines. Specifically, describe the 'Intervention' section chronologically, explaining how the intervention was adapted over time."
                    },
                    {
                        type: 'prompt',
                        title: 'The "Abstract Condenser"',
                        promptText: "My target journal has a 250-word limit. My current abstract is [X] words. Rewrite it to meet the limit without losing the specific data points in the results section. Do not add new results or claims."
                    },
                    {
                        type: 'prompt',
                        title: 'The "Title Generator"',
                        promptText: "Here is my abstract: [Paste abstract]. Generate 5 title options: (1) academic/formal, (2) short/punchy, (3) result-focused, (4) question format, (5) clinical audience. Keep all under 120 characters."
                    }
                ]
            }
        ]
    },
    {
        id: 'timeline',
        title: '9. Project Roadmap',
        icon: <Calendar className="w-5 h-5" />,
        sections: [
            {
                title: '12-Month Resident Timeline',
                blocks: [
                    {
                        type: 'text',
                        content: "Don't fall behind. Use this rough schedule to ensure you are ready for Research Day."
                    },
                    {
                        type: 'table',
                        title: 'The Timeline',
                        headers: ['Phase', 'Months', 'Key Deliverables'],
                        rows: [
                            ['1. Diagnostics', 'Month 1-2', 'Form Team, 5 Whys, Process Map, Baseline Data.'],
                            ['2. Planning', 'Month 3', 'SMART Aim, IRB Determination, Driver Diagram.'],
                            ['3. Action (PDSA)', 'Month 4-8', 'Run PDSA Cycles (test interventions). Collect data continuously.'],
                            ['4. Analysis', 'Month 9-10', 'Final Run Charts, Interpret results.'],
                            ['5. Dissemination', 'Month 11-12', 'Submit Abstract, Poster Design, Presentation.']
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'troubleshooting',
        title: '10. Troubleshooting',
        icon: <AlertTriangle className="w-5 h-5" />,
        sections: [
            {
                title: 'Common Pitfalls',
                blocks: [
                    {
                        type: 'text',
                        content: "Stuck? Most QI projects stall for predictable reasons."
                    },
                    {
                        type: 'table',
                        title: 'How to get Unstuck',
                        headers: ['The Problem', 'The Diagnosis', 'The Fix'],
                        rows: [
                            ['"We have no data"', 'IT Request is stuck in queue.', 'Do manual data collection. Look at 10 charts yourself. Use a "proxy" measure.'],
                            ['"Nurses wont do it"', 'Intervention adds work.', 'Change the "Default". Make the right thing the easiest thing. Ask them what THEY want to fix.'],
                            ['"Scope Creep"', 'Trying to boil the ocean.', 'Narrow your focus. Fix ONE unit or ONE diagnosis first.'],
                            ['"Solution Jumping"', 'Skipped root cause analysis.', 'Stop. Go back and do a Fishbone diagram. You might be solving the wrong problem.']
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'glossary',
        title: '11. Glossary',
        icon: <Book className="w-5 h-5" />,
        sections: [
            {
                title: 'Key Terms',
                blocks: [
                    {
                        type: 'table',
                        title: 'QI Dictionary',
                        headers: ['Term', 'Definition'],
                        rows: [
                            ['PDSA Cycle', 'Plan-Do-Study-Act. A four-stage problem-solving model used for improving a process.'],
                            ['Run Chart', 'A graph of data over time used to identify trends or shifts.'],
                            ['Outcome Measure', 'What happened to the patient (e.g., mortality, readmission).'],
                            ['Process Measure', 'Whether the system worked as intended (e.g., antibiotic timing).'],
                            ['Balancing Measure', 'Unintended consequences (e.g., did we cause delays elsewhere?).'],
                            ['Root Cause', 'The fundamental reason for a problem, which if removed, prevents recurrence.'],
                            ['SQUIRE', 'Standards for QUality Improvement Reporting Excellence. Guidelines for publishing QI.'],
                            ['Stakeholder', 'Anyone affected by the project (patients, staff, admin).']
                        ]
                    }
                ]
            }
        ]
    }
];

// --- Components ---

const IRBDeterminationTool = () => {
    const [step, setStep] = useState(0);
    const [history, setHistory] = useState<number[]>([]);

    // Detailed logic based on UW-Madison Decision Tree V4-18-16
    const questions = [
        {
            id: 0,
            text: "Will the project involve testing an experimental drug, device (including medical software or assays), or biologic?",
            yesDest: 'result-research-fda',
            noDest: 1
        },
        {
            id: 1,
            text: "Has the project received funding (e.g., federal, industry) explicitly to be conducted as a human subjects research study?",
            yesDest: 'result-research-funding',
            noDest: 2
        },
        {
            id: 2,
            text: "Is this a multi-site project (e.g., coordinating center, multiple sites, study-wide protocol)?",
            yesDest: 'result-research-multisite',
            noDest: 3
        },
        {
            id: 3,
            text: "Will the project occur regardless of whether individuals conducting it may benefit professionally from it?",
            yesDest: 4,
            noDest: 'result-research-benefit'
        },
        {
            id: 4,
            text: "Will the results of the project be published, presented or disseminated outside of the institution conducting it?",
            yesDest: 5,
            noDest: 6 // Skip systematic check if no publication intent
        },
        {
            id: 5,
            text: "Is this a systematic investigation designed with the intent to contribute to generalizable knowledge (e.g. testing hypothesis, randomization, case-control)?",
            yesDest: 'result-research-intent',
            noDest: 6
        },
        {
            id: 6,
            text: "Is the project intended to improve or evaluate the practice or process within a particular institution or a specific program?",
            yesDest: 'result-qi',
            noDest: 'result-unknown'
        }
    ];

    const results: Record<string, { title: string; color: string; desc: string; action: string }> = {
        'result-research-fda': {
            title: "Research (FDA Regulated)",
            color: "bg-red-50 border-red-200 text-red-900",
            desc: "This involves regulated products. It is definitely research.",
            action: "STOP. You must submit a full IRB application. Contact the IRB office immediately."
        },
        'result-research-funding': {
            title: "Research (Funded)",
            color: "bg-red-50 border-red-200 text-red-900",
            desc: "The funding source likely requires specific research oversight.",
            action: "Submit an IRB application. This is likely not exempt QI."
        },
        'result-research-multisite': {
            title: "Research (Multi-Site)",
            color: "bg-orange-50 border-orange-200 text-orange-900",
            desc: "Multi-site projects usually imply generalizability beyond your local institution.",
            action: "Consult the IRB. This usually requires review, though some collaborative QI may exist."
        },
        'result-research-benefit': {
            title: "Likely Research (Professional Benefit)",
            color: "bg-orange-50 border-orange-200 text-orange-900",
            desc: "If the project is being done primarily for professional benefit rather than operational necessity, it may be classified as research.",
            action: "IRB review is likely required. Access the HS IRBs website for guidance."
        },
        'result-research-intent': {
            title: "Research (Generalizable Knowledge)",
            color: "bg-orange-50 border-orange-200 text-orange-900",
            desc: "Your primary intent appears to be generating new scientific knowledge (Systematic Investigation) rather than just improving local care.",
            action: "IRB review is likely required. Submit for determination."
        },
        'result-qi': {
            title: "Quality Improvement / Program Evaluation",
            color: "bg-emerald-50 border-emerald-200 text-emerald-900",
            desc: "This project appears to constitute QI and/or Program Evaluation and doesn't fit the federal definition of research.",
            action: "PROCEED. Further IRB review is typically not required, but ensure you follow institutional policy for 'Non-Human Subjects' determination."
        },
        'result-unknown': {
            title: "Unclear Status",
            color: "bg-gray-50 border-gray-200 text-gray-900",
            desc: "The project doesn't fit the definition of QI/Program Evaluation, but also wasn't flagged as obvious research.",
            action: "Contact the HS IRBs Office for guidance."
        }
    };

    const [resultId, setResultId] = useState<string | null>(null);

    const handleResponse = (answer: boolean) => {
        const currentQ = questions[step];
        const dest = answer ? currentQ.yesDest : currentQ.noDest;

        if (typeof dest === 'number') {
            setStep(dest);
        } else {
            setResultId(dest as string);
        }
    };

    const reset = () => {
        setStep(0);
        setResultId(null);
    };

    if (resultId) {
        const res = results[resultId];
        if (!res) return <div className="p-4 text-red-600">Configuration Error: Unknown result type</div>;

        return (
            <div className={`p-6 rounded-xl border-2 ${res.color} shadow-sm animate-in fade-in zoom-in-95`}>
                <div className="flex items-center gap-3 mb-4">
                    <Gavel className="w-6 h-6" />
                    <h3 className="text-xl font-bold">{res.title}</h3>
                </div>
                <p className="mb-4 text-base font-medium">{res.desc}</p>
                <div className="bg-white/60 p-4 rounded-lg border border-black/5 mb-6">
                    <strong className="block mb-1 text-sm uppercase tracking-wide opacity-75">Action Required:</strong>
                    {res.action}
                </div>
                <button
                    onClick={reset}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-50 border border-gray-200 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" /> Start Over
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm my-6">
            <div className="mb-6 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question {step + 1}</span>
                {step > 0 && (
                    <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600">Reset</button>
                )}
            </div>

            <div className="flex gap-4 items-start mb-8">
                <HelpCircle className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
                <h3 className="text-lg font-semibold text-slate-800 leading-relaxed">
                    {questions[step].text}
                </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => handleResponse(true)}
                    className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all font-semibold text-slate-600"
                >
                    YES
                </button>
                <button
                    onClick={() => handleResponse(false)}
                    className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all font-semibold text-slate-600"
                >
                    NO
                </button>
            </div>
        </div>
    );
};

const PromptBox = ({ title, text }: { title: string; text: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-4">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-purple-600" />
                    {title}
                </h4>
                <button
                    onClick={handleCopy}
                    className="text-xs flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors"
                >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy Prompt'}
                </button>
            </div>
            <div className="bg-white p-3 rounded border border-slate-100 font-mono text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                {text}
            </div>
        </div>
    );
};

const ComparisonBox = ({ bad, good }: { bad: string; good: string }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2 text-red-700 font-bold text-sm uppercase tracking-wide">
                    <X className="w-4 h-4" /> Weak Example
                </div>
                <p className="text-red-900 text-sm font-medium leading-relaxed">"{bad}"</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2 text-emerald-700 font-bold text-sm uppercase tracking-wide">
                    <Check className="w-4 h-4" /> Strong Example
                </div>
                <p className="text-emerald-900 text-sm font-medium leading-relaxed">"{good}"</p>
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
        <div className="bg-white border border-slate-200 rounded-xl p-5 my-4 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
                {title}
            </h3>
            <div className="space-y-3">
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${checkedItems.has(idx) ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                        onClick={() => toggleItem(idx)}
                    >
                        <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${checkedItems.has(idx) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                            {checkedItems.has(idx) && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className={`text-sm ${checkedItems.has(idx) ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                            {item}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ContentRenderer = ({ block }: { block: ContentBlock }) => {
    switch (block.type) {
        case 'text':
            return <p className="text-slate-600 leading-relaxed mb-4">{block.content}</p>;

        case 'tip':
            return (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg">
                    <h4 className="font-bold text-blue-900 mb-1 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        {block.title}
                    </h4>
                    <p className="text-blue-800 text-sm whitespace-pre-wrap">{block.content}</p>
                </div>
            );

        case 'table':
            return (
                <div className="overflow-x-auto my-6 border border-slate-200 rounded-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                                {block.headers?.map((h, i) => (
                                    <th key={i} className="px-4 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {block.rows?.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50/50">
                                    {row.map((cell, j) => (
                                        <td key={j} className="px-4 py-3 text-slate-600">{cell}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );

        case 'checklist':
            return <Checklist title={block.title || 'Checklist'} items={block.items || []} />;

        case 'prompt':
            return <PromptBox title={block.title || 'AI Prompt'} text={block.promptText || ''} />;

        case 'comparison':
            return <ComparisonBox bad={block.badExample || ''} good={block.goodExample || ''} />;

        case 'irb-tool':
            return <IRBDeterminationTool />;

        default:
            return null;
    }
};

export default function QIHandbook({ onBack }: { onBack?: () => void }) {
    const [activeChapterId, setActiveChapterId] = useState<string>('qi-basics');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const activeChapter = chapters.find(c => c.id === activeChapterId) || chapters[0];

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">

            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 h-full">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                        <Activity className="text-blue-600 w-6 h-6" />
                        <h1 className="text-xl font-bold text-slate-800 leading-tight">QI Handbook</h1>
                    </div>
                    <p className="text-xs text-slate-400 font-medium tracking-wide">ADVENTHEALTH TAMPA • 2026</p>

                    {onBack && (
                        <button
                            onClick={onBack}
                            className="mt-4 text-xs font-semibold text-slate-500 flex items-center gap-1 hover:text-blue-600"
                        >
                            ← Back to Resources
                        </button>
                    )}
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {chapters.map((chapter) => (
                        <button
                            key={chapter.id}
                            onClick={() => setActiveChapterId(chapter.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${activeChapterId === chapter.id
                                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <span className={activeChapterId === chapter.id ? 'text-blue-600' : 'text-slate-400'}>
                                {chapter.icon}
                            </span>
                            {chapter.title}
                            {activeChapterId === chapter.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs leading-relaxed">
                        <p className="font-semibold text-white mb-1">QI Pro Tip</p>
                        Start with "Why?" before "How?". If you don't know the root cause, your intervention will fail.
                    </div>
                </div>
            </aside>

            {/* Sidebar - Mobile Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <div className="w-64 bg-white shadow-xl h-full p-4">
                        <div className="flex justify-between items-center mb-6">
                            <span className="font-bold text-lg">QI Modules</span>
                            <button onClick={() => setIsMobileMenuOpen(false)}>
                                <X className="w-6 h-6 text-slate-500" />
                            </button>
                        </div>
                        {chapters.map((chapter) => (
                            <button
                                key={chapter.id}
                                onClick={() => {
                                    setActiveChapterId(chapter.id);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg mb-1 ${activeChapterId === chapter.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
                                    }`}
                            >
                                {chapter.icon}
                                {chapter.title}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 h-full overflow-y-auto bg-white/50 relative scroll-smooth">
                {/* Mobile Header */}
                <header className="md:hidden sticky top-0 bg-white/80 backdrop-blur border-b border-slate-200 p-4 flex items-center justify-between z-10">
                    <h2 className="font-bold text-slate-800">{activeChapter.title}</h2>
                    <button onClick={() => setIsMobileMenuOpen(true)}>
                        <Menu className="w-6 h-6 text-slate-600" />
                    </button>
                </header>

                <div className="max-w-4xl mx-auto p-6 md:p-12 pb-24">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">{activeChapter.title}</h2>
                        <div className="h-1 w-20 bg-blue-500 rounded-full"></div>
                    </div>

                    <div className="space-y-12">
                        {activeChapter.sections.map((section, idx) => (
                            <section key={idx} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                <h3 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                                    {section.title}
                                </h3>
                                <div>
                                    {section.blocks.map((block, bIdx) => (
                                        <ContentRenderer key={bIdx} block={block} />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>

                    {/* Navigation Footer */}
                    <div className="mt-16 pt-8 border-t border-slate-200 flex justify-between items-center">
                        <div className="text-xs text-slate-400">
                            Residency QI Handbook v2.5
                        </div>
                        {chapters.findIndex(c => c.id === activeChapterId) < chapters.length - 1 && (
                            <button
                                onClick={() => {
                                    const currIdx = chapters.findIndex(c => c.id === activeChapterId);
                                    setActiveChapterId(chapters[currIdx + 1].id);
                                    document.querySelector('main')?.scrollTo(0, 0);
                                }}
                                className="flex items-center gap-2 text-blue-600 font-semibold hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
                            >
                                Next Module <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
