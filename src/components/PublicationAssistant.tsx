"use client"

import { Project, Metric } from '@/types'
import {
    Sparkles,
    Copy,
    CheckCircle2,
    FileText,
    ChevronRight,
    AlertCircle,
    Loader2,
    Trophy,
    Search,
    BookOpen,
    Database,
    Brain,
    ExternalLink,
    FileCheck,
    ShieldCheck,
    AlertTriangle,
    XCircle,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Activity,
    Play,
    Zap,
    LineChart
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { scanForPHI } from '@/utils/phi_guard'
import { searchSemanticScholar, fetchReadableText } from "@/utils/ebm";
import {
    generateAbstract,
    synthesizeLitInsight,
    auditSquireAndIRB,
    generateManuscriptIMRAD,
    generatePDSAArchitectAndRCA,
    generateIRBExemptionAdvisor,
    analyzeSPCRunChart,
    simulatePeerReview,
    generateEMRSpecification,
    mapCFIRFramework,
    findJournalFit,
    adviseStatisticalPower
} from '@/utils/ai'

interface PublicationAssistantProps {
    project: Project;
    metrics?: Metric[];
    isOpen: boolean;
    onClose: () => void;
}

async function searchPubMed(query: string) {
    try {
        const searchRes = await fetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
                query
            )}&retmode=json&retmax=5`
        );
        if (!searchRes.ok) throw new Error('PubMed search failed');
        const searchData = await searchRes.json();
        const idList: string[] = searchData.esearchresult?.idlist || [];
        if (idList.length === 0) return [];

        const summaryRes = await fetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idList.join(
                ','
            )}&retmode=json`
        );
        if (!summaryRes.ok) throw new Error('PubMed summary failed');
        const summaryData = await summaryRes.json();

        return idList
            .map(id => {
                const result = summaryData.result?.[id];
                if (!result) return null;
                const authors = result.authors
                    ? result.authors.map((a: any) => a.name).join(', ')
                    : 'Unknown Authors';
                return {
                    id,
                    title: result.title || 'No Title Available',
                    authors,
                    journal: result.source || 'Unknown Journal',
                    date: result.pubdate || result.sortpubdate || 'No Date',
                    url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
                };
            })
            .filter(Boolean);
    } catch (err) {
        console.error(err);
        throw err;
    }
}

// Semantic Scholar search lives in utils/ebm.ts and is proxied server-side.


async function searchOpenAlex(query: string) {
    try {
        const priorityMail = process.env.NEXT_PUBLIC_OPENALEX_KEY || '';
        let url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=5`;
        if (priorityMail && priorityMail.includes('@')) {
            url += `&mailto=${encodeURIComponent(priorityMail)}`;
        } else if (priorityMail) {
            url += `&api_key=${encodeURIComponent(priorityMail)}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('OpenAlex search failed');
        const data = await response.json();
        const results = data.results || [];

        return results.map((work: any) => {
            const authorsList = work.authorships
                ? work.authorships.map((a: any) => a.author.display_name).join(', ')
                : 'Unknown Authors';
            const sourceName = work.primary_location?.source?.display_name || 'No Source Listed';
            return {
                id: work.id,
                title: work.title || 'No Title Available',
                authors: authorsList,
                journal: `${sourceName} (Citations: ${work.cited_by_count || 0})`,
                date: work.publication_year ? work.publication_year.toString() : 'No Date',
                url: work.doi || `https://openalex.org/${work.id.split('/').pop()}`,
                abstract: ''
            };
        });
    } catch (err) {
        console.error('OpenAlex search failed:', err);
        throw err;
    }
}

async function searchClinicalTrials(query: string) {
    try {
        const res = await fetch(
            `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(
                query
            )}&pageSize=5`
        );
        if (!res.ok) throw new Error('ClinicalTrials.gov search failed');
        const data = await res.json();
        const studies = data.studies || [];
        return studies.map((s: any) => {
            const proto = s.protocolSection || {};
            const idModule = proto.identificationModule || {};
            const sponsorModule = proto.sponsorCollaboratorsModule || {};
            const descModule = proto.descriptionModule || {};
            const designModule = proto.designModule || {};

            const nctId = idModule.nctId || 'Unknown NCTID';
            const title =
                idModule.officialTitle || idModule.briefTitle || 'No Title Available';
            const leadSponsor = sponsorModule.leadSponsor?.name || 'Unknown Sponsor';
            const summary = descModule.briefSummary || '';
            const phases = designModule.phases ? designModule.phases.join(', ') : 'N/A';

            return {
                id: nctId,
                title,
                authors: leadSponsor,
                journal: `Clinical Trial | Phase: ${phases}`,
                date: proto.statusModule?.startDateStruct?.date || 'No Date',
                summary,
                url: `https://clinicaltrials.gov/study/${nctId}`
            };
        });
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export default function PublicationAssistant({
    project,
    metrics = [],
    isOpen,
    onClose
}: PublicationAssistantProps) {
    const [copied, setCopied] = useState(false)
    const [phiFindings, setPhiFindings] = useState<{ type: string; value: string }[]>([])

    const [abstractText, setAbstractText] = useState<string>('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [abstractFormat, setAbstractFormat] = useState<'standard' | 'acp' | 'shm' | 'ihi' | 'bmj'>('standard')

    // New active tab layout states
    const [activeTab, setActiveTab] = useState<'abstract' | 'manuscript' | 'architect' | 'literature' | 'audit'>('abstract')
    
    // Manuscript Builder states
    const [manuscriptText, setManuscriptText] = useState<string>('')
    const [isGeneratingManuscript, setIsGeneratingManuscript] = useState(false)
    const [manuscriptError, setManuscriptError] = useState<string | null>(null)
    const [manuscriptCopied, setManuscriptCopied] = useState(false)

    // RCA & PDSA Architect states
    const [pdsaArchitectData, setPdsaArchitectData] = useState<any>(null)
    const [isGeneratingArchitect, setIsGeneratingArchitect] = useState(false)
    const [architectError, setArchitectError] = useState<string | null>(null)

    // New literature search/synthesis states
    const [searchQuery, setSearchQuery] = useState('')
    const [searchDb, setSearchDb] = useState<'pubmed' | 'clinicaltrials' | 'semanticscholar' | 'openalex'>('pubmed')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [searchError, setSearchError] = useState<string | null>(null)
    const [synthesizingId, setSynthesizingId] = useState<string | null>(null)
    const [synthesizedInsights, setSynthesizedInsights] = useState<Record<string, string>>({})

    // Compliance SQUIRE & IRB Auditor states
    const [isAuditing, setIsAuditing] = useState(false)
    const [auditReport, setAuditReport] = useState<any>(null)
    const [auditError, setAuditError] = useState<string | null>(null)

    // === 7 NEW CLINICAL AI SUB-TOOLS STATES ===
    // 1. IRB Exemption Advisor
    const [irbExemptionText, setIrbExemptionText] = useState<string>('')
    const [isGeneratingIRB, setIsGeneratingIRB] = useState(false)
    const [irbCopied, setIrbCopied] = useState(false)

    // 2. SPC Run Chart Auditor
    const [spcReportText, setSpcReportText] = useState<string>('')
    const [isAnalyzingSPC, setIsAnalyzingSPC] = useState(false)

    // 3. Peer Review Simulator
    const [peerReviewText, setPeerReviewText] = useState<string>('')
    const [isSimulatingPeerReview, setIsSimulatingPeerReview] = useState(false)

    // 4. Journal Selection Advisor
    const [journalFitData, setJournalFitData] = useState<any>(null)
    const [isFindingJournal, setIsFindingJournal] = useState(false)

    // 5. Biostatistical Power & PICO Guide
    const [statisticalPowerData, setStatisticalPowerData] = useState<any>(null)
    const [isAdvisingPower, setIsAdvisingPower] = useState(false)

    // 6. CFIR 2.0 & ERIC Strategy Mapper
    const [cfirFrameworkData, setCfirFrameworkData] = useState<any>(null)
    const [isMappingCFIR, setIsMappingCFIR] = useState(false)

    // 7. Clinical EMR Specification Sheet
    const [emrSpecificationText, setEmrSpecificationText] = useState<string>('')
    const [isGeneratingEMR, setIsGeneratingEMR] = useState(false)
    const [emrCopied, setEmrCopied] = useState(false)

    // Scan for PHI, Generate Abstract, and Run Academic Compliance Audit whenever the modal opens or project/metrics/format change
    useEffect(() => {
        if (isOpen) {
            const findings = scanForPHI(JSON.stringify(project));
            setPhiFindings(findings);

            async function triggerGeneration() {
                setIsGenerating(true);
                try {
                    const text = await generateAbstract(project, abstractFormat);
                    setAbstractText(text);
                } catch (error) {
                    console.error('Failed to generate abstract:', error);
                    setAbstractText('Error generating abstract. Please try again.');
                } finally {
                    setIsGenerating(false);
                }
            }

            async function triggerAudit() {
                setIsAuditing(true);
                setAuditError(null);
                try {
                    const metricsCount = metrics?.length || 0;
                    const metricsLabels = Array.from(new Set(metrics?.map(m => m.label) || []));
                    const reportText = await auditSquireAndIRB(project, metricsCount, metricsLabels);
                    
                    let cleanText = reportText.trim();
                    if (cleanText.startsWith('```')) {
                        cleanText = cleanText.replace(/^```(json)?\n/, '').replace(/\n```$/, '');
                    }
                    const parsed = JSON.parse(cleanText);
                    setAuditReport(parsed);
                } catch (error) {
                    console.error('Failed to audit project:', error);
                    setAuditError('Failed to complete compliance audit. Please try again.');
                } finally {
                    setIsAuditing(false);
                }
            }

            triggerGeneration();
            triggerAudit();

            if (project?.title) {
                setSearchQuery(project.title);
            }
        }
    }, [isOpen, project, metrics, abstractFormat]);

    // Lazy load Manuscript Builder tab
    useEffect(() => {
        if (isOpen && activeTab === 'manuscript' && !manuscriptText && !isGeneratingManuscript) {
            async function triggerManuscriptGeneration() {
                setIsGeneratingManuscript(true);
                setManuscriptError(null);
                try {
                    const literatureContext = Object.values(synthesizedInsights).join('\n\n');
                    const text = await generateManuscriptIMRAD(project, metrics, literatureContext);
                    setManuscriptText(text);
                } catch (error) {
                    console.error('Failed to generate manuscript:', error);
                    setManuscriptError('Failed to generate IMRAD manuscript outline. Please try again.');
                } finally {
                    setIsGeneratingManuscript(false);
                }
            }
            triggerManuscriptGeneration();
        }
    }, [isOpen, activeTab, project, metrics, synthesizedInsights, manuscriptText, isGeneratingManuscript]);

    // Lazy load RCA & PDSA Architect tab
    useEffect(() => {
        if (isOpen && activeTab === 'architect' && !pdsaArchitectData && !isGeneratingArchitect) {
            async function triggerArchitectGeneration() {
                setIsGeneratingArchitect(true);
                setArchitectError(null);
                try {
                    const reportText = await generatePDSAArchitectAndRCA(project);
                    let cleanText = reportText.trim();
                    if (cleanText.startsWith('```')) {
                        cleanText = cleanText.replace(/^```(json)?\n/, '').replace(/\n```$/, '');
                    }
                    const parsed = JSON.parse(cleanText);
                    setPdsaArchitectData(parsed);
                } catch (error) {
                    console.error('Failed to generate RCA/PDSA Architect data:', error);
                    setArchitectError('Failed to generate Root Cause Analysis and PDSA next-cycle roadmap. Please try again.');
                } finally {
                    setIsGeneratingArchitect(false);
                }
            }
            triggerArchitectGeneration();
        }
    }, [isOpen, activeTab, project, pdsaArchitectData, isGeneratingArchitect]);

    // Lazy load Journal Selection Advisor
    useEffect(() => {
        if (isOpen && activeTab === 'manuscript' && !journalFitData && !isFindingJournal) {
            async function triggerJournalFit() {
                setIsFindingJournal(true);
                try {
                    const res = await findJournalFit(project);
                    let cleanText = res.trim();
                    if (cleanText.startsWith('```')) {
                        cleanText = cleanText.replace(/^```(json)?\n/, '').replace(/\n```$/, '');
                    }
                    const parsed = JSON.parse(cleanText);
                    setJournalFitData(parsed);
                } catch (error) {
                    console.error('Failed to find journal fit:', error);
                } finally {
                    setIsFindingJournal(false);
                }
            }
            triggerJournalFit();
        }
    }, [isOpen, activeTab, project, journalFitData, isFindingJournal]);

    // Lazy load Biostatistical Power Advisor
    useEffect(() => {
        if (isOpen && activeTab === 'manuscript' && !statisticalPowerData && !isAdvisingPower) {
            async function triggerStatisticalPower() {
                setIsAdvisingPower(true);
                try {
                    const res = await adviseStatisticalPower(project);
                    let cleanText = res.trim();
                    if (cleanText.startsWith('```')) {
                        cleanText = cleanText.replace(/^```(json)?\n/, '').replace(/\n```$/, '');
                    }
                    const parsed = JSON.parse(cleanText);
                    setStatisticalPowerData(parsed);
                } catch (error) {
                    console.error('Failed to get statistical power advice:', error);
                } finally {
                    setIsAdvisingPower(false);
                }
            }
            triggerStatisticalPower();
        }
    }, [isOpen, activeTab, project, statisticalPowerData, isAdvisingPower]);

    // Lazy load CFIR 2.0 Implementation science mapper
    useEffect(() => {
        if (isOpen && activeTab === 'architect' && !cfirFrameworkData && !isMappingCFIR) {
            async function triggerCFIRMapping() {
                setIsMappingCFIR(true);
                try {
                    const res = await mapCFIRFramework(project);
                    let cleanText = res.trim();
                    if (cleanText.startsWith('```')) {
                        cleanText = cleanText.replace(/^```(json)?\n/, '').replace(/\n```$/, '');
                    }
                    const parsed = JSON.parse(cleanText);
                    setCfirFrameworkData(parsed);
                } catch (error) {
                    console.error('Failed to map CFIR framework:', error);
                } finally {
                    setIsMappingCFIR(false);
                }
            }
            triggerCFIRMapping();
        }
    }, [isOpen, activeTab, project, cfirFrameworkData, isMappingCFIR]);

    // Lazy load Clinical EMR Spec sheet
    useEffect(() => {
        if (isOpen && activeTab === 'architect' && !emrSpecificationText && !isGeneratingEMR) {
            async function triggerEMRSpec() {
                setIsGeneratingEMR(true);
                try {
                    const text = await generateEMRSpecification(project, metrics);
                    setEmrSpecificationText(text);
                } catch (error) {
                    console.error('Failed to generate EMR specs:', error);
                } finally {
                    setIsGeneratingEMR(false);
                }
            }
            triggerEMRSpec();
        }
    }, [isOpen, activeTab, project, metrics, emrSpecificationText, isGeneratingEMR]);

    // Lazy load SPC Run Chart analysis
    useEffect(() => {
        if (isOpen && activeTab === 'architect' && !spcReportText && !isAnalyzingSPC) {
            async function triggerSPCAudit() {
                setIsAnalyzingSPC(true);
                try {
                    const text = await analyzeSPCRunChart(project.title, metrics || []);
                    setSpcReportText(text);
                } catch (error) {
                    console.error('Failed to analyze SPC Run Chart:', error);
                } finally {
                    setIsAnalyzingSPC(false);
                }
            }
            triggerSPCAudit();
        }
    }, [isOpen, activeTab, project, metrics, spcReportText, isAnalyzingSPC]);

    // Lazy load IRB Exemption Letter advisor
    useEffect(() => {
        if (isOpen && activeTab === 'audit' && !irbExemptionText && !isGeneratingIRB) {
            async function triggerIRBAdvisor() {
                setIsGeneratingIRB(true);
                try {
                    const text = await generateIRBExemptionAdvisor(project);
                    setIrbExemptionText(text);
                } catch (error) {
                    console.error('Failed to generate IRB exemption letter:', error);
                } finally {
                    setIsGeneratingIRB(false);
                }
            }
            triggerIRBAdvisor();
        }
    }, [isOpen, activeTab, project, irbExemptionText, isGeneratingIRB]);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(abstractText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleCopyManuscript = () => {
        navigator.clipboard.writeText(manuscriptText)
        setManuscriptCopied(true)
        setTimeout(() => setManuscriptCopied(false), 2000)
    }

    const handleCopyEMR = () => {
        navigator.clipboard.writeText(emrSpecificationText)
        setEmrCopied(true)
        setTimeout(() => setEmrCopied(false), 2000)
    }

    const handleCopyIRB = () => {
        navigator.clipboard.writeText(irbExemptionText)
        setIrbCopied(true)
        setTimeout(() => setIrbCopied(false), 2000)
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setSearchError(null);
        setSearchResults([]);
        try {
            if (searchDb === 'pubmed') {
                const results = await searchPubMed(searchQuery);
                setSearchResults(results);
            } else if (searchDb === 'semanticscholar') {
                const results = await searchSemanticScholar(searchQuery);
                setSearchResults(results);
            } else if (searchDb === 'openalex') {
                const results = await searchOpenAlex(searchQuery);
                setSearchResults(results);
            } else {
                const results = await searchClinicalTrials(searchQuery);
                setSearchResults(results);
            }
        } catch (err) {
            console.error(err);
            setSearchError('Search failed. Please refine your query or verify your API key configurations.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSynthesize = async (result: any) => {
        if (synthesizingId) return;
        setSynthesizingId(result.id);
        try {
            let textToPass = result.abstract || '';
            // Reader key is server-side now; it used to be NEXT_PUBLIC_*, which
            // inlines it into the public bundle. Best-effort: returns "" on failure.
            if (result.url && !textToPass) {
                textToPass = await fetchReadableText(result.url);
            }

            const insight = await synthesizeLitInsight(
                result.title,
                result.authors,
                result.journal,
                searchDb === 'pubmed' ? 'pubmed' : searchDb === 'semanticscholar' ? 'semanticscholar' : searchDb === 'openalex' ? 'openalex' : 'trial',
                project.title,
                textToPass
            );
            setSynthesizedInsights(prev => ({
                ...prev,
                [result.id]: insight
            }));
        } catch (err) {
            console.error('Failed to synthesize insight:', err);
            alert('Failed to generate synthesis insight. Please try again.');
        } finally {
            setSynthesizingId(null);
        }
    };

    const handleReRunAudit = async () => {
        setIsAuditing(true);
        setAuditError(null);
        try {
            const metricsCount = metrics?.length || 0;
            const metricsLabels = Array.from(new Set(metrics?.map(m => m.label) || []));
            const reportText = await auditSquireAndIRB(project, metricsCount, metricsLabels);
            
            let cleanText = reportText.trim();
            if (cleanText.startsWith('```')) {
                cleanText = cleanText.replace(/^```(json)?\n/, '').replace(/\n```$/, '');
            }
            const parsed = JSON.parse(cleanText);
            setAuditReport(parsed);
        } catch (error) {
            console.error('Failed to audit project:', error);
            setAuditError('Failed to complete compliance audit. Please try again.');
        } finally {
            setIsAuditing(false);
        }
    };

    const handleSimulatePeerReview = async () => {
        setIsSimulatingPeerReview(true);
        try {
            const review = await simulatePeerReview(project, abstractText, manuscriptText);
            setPeerReviewText(review);
        } catch (error) {
            console.error('Failed to simulate peer review:', error);
            setPeerReviewText('Failed to simulate peer review. Please try again.');
        } finally {
            setIsSimulatingPeerReview(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight leading-none">Publication Assistant</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 px-2 py-0.5 bg-white/5 rounded-full inline-block">Ready for Submission</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {activeTab === 'abstract' && (
                            <button
                                onClick={handleCopy}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied' : 'Copy Abstract'}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto bg-slate-50/30">
                    {/* Tab Navigation Menu */}
                    <div className="grid grid-cols-2 md:grid-cols-5 bg-slate-100 p-1.5 rounded-3xl border border-slate-200/60 w-full max-w-3xl mx-auto gap-1">
                        <button
                            onClick={() => setActiveTab('abstract')}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                activeTab === 'abstract'
                                    ? 'bg-white text-advent-blue shadow-md border border-slate-200/10'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <FileText className="w-4 h-4" />
                            Abstract
                        </button>
                        <button
                            onClick={() => setActiveTab('literature')}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                activeTab === 'literature'
                                    ? 'bg-white text-advent-blue shadow-md border border-slate-200/10'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <BookOpen className="w-4 h-4" />
                            Literature
                        </button>
                        <button
                            onClick={() => setActiveTab('manuscript')}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                activeTab === 'manuscript'
                                    ? 'bg-white text-advent-blue shadow-md border border-slate-200/10'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            Manuscript
                        </button>
                        <button
                            onClick={() => setActiveTab('architect')}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                activeTab === 'architect'
                                    ? 'bg-white text-advent-blue shadow-md border border-slate-200/10'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Activity className="w-4 h-4" />
                            Architect
                        </button>
                        <button
                            onClick={() => setActiveTab('audit')}
                            className={`col-span-2 md:col-span-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                activeTab === 'audit'
                                    ? 'bg-white text-advent-blue shadow-md border border-slate-200/10'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Compliance
                        </button>
                    </div>

                    {/* Tab content 1: Draft Abstract */}
                    {activeTab === 'abstract' && (
                        <div className="space-y-6">
                            {phiFindings.length > 0 && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-[10px] font-black text-red-700 uppercase tracking-widest leading-none mb-1">Privacy Alert: Potential PHI Detected</h4>
                                        <p className="text-[10px] text-red-600 font-medium">
                                            We found {phiFindings.length} item(s) that look like sensitive patient data (MRNs, Names, or Dates). Please ensure all clinical data is redacted before submission.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="p-8 bg-white rounded-3xl border border-slate-200/60 font-mono text-sm text-slate-600 whitespace-pre-wrap leading-relaxed shadow-sm min-h-[300px] flex items-center justify-center relative group">
                                {isGenerating ? (
                                    <div className="flex flex-col items-center gap-4 py-12">
                                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 animate-bounce">
                                            <Sparkles className="w-8 h-8 text-amber-400" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI is composing your abstract...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full text-slate-700">
                                        {abstractText}
                                    </div>
                                )}
                                
                                {!isGenerating && (
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-slate-100 shadow-sm">
                                            <div className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" />
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">AI Enhanced</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab content 2: Literature Explorer */}
                    {activeTab === 'literature' && (
                        <div className="space-y-6">
                            <form onSubmit={handleSearch} className="bg-white p-4 border border-slate-200/60 rounded-3xl shadow-sm space-y-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Search Keywords</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Enter keywords, project titles or PMIDs..."
                                            className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-advent-blue/10 outline-none"
                                        />
                                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                                    <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/60 w-full sm:w-auto overflow-x-auto">
                                        <button
                                            type="button"
                                            onClick={() => setSearchDb('pubmed')}
                                            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                                searchDb === 'pubmed'
                                                    ? 'bg-white text-advent-blue shadow-sm border border-slate-200/10'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            <Database className="w-3 h-3" />
                                            PubMed
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSearchDb('semanticscholar')}
                                            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                                searchDb === 'semanticscholar'
                                                    ? 'bg-white text-advent-blue shadow-sm border border-slate-200/10'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            <BookOpen className="w-3 h-3" />
                                            Semantic Scholar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSearchDb('openalex')}
                                            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                                searchDb === 'openalex'
                                                    ? 'bg-white text-advent-blue shadow-sm border border-slate-200/10'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            <Sparkles className="w-3 h-3" />
                                            OpenAlex
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSearchDb('clinicaltrials')}
                                            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                                searchDb === 'clinicaltrials'
                                                    ? 'bg-white text-advent-blue shadow-sm border border-slate-200/10'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            <Activity className="w-3 h-3" />
                                            ClinicalTrials
                                        </button>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSearching || !searchQuery.trim()}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-advent-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-advent-navy disabled:opacity-50 transition-all shadow-sm active:scale-95"
                                    >
                                        {isSearching ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                Searching...
                                            </>
                                        ) : (
                                            <>
                                                <Search className="w-3.5 h-3.5" />
                                                Search
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>

                            {searchError && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <span className="text-[10px] text-red-600 font-medium">{searchError}</span>
                                </div>
                            )}

                            {/* Search Results list */}
                            <div className="space-y-4">
                                {isSearching ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-advent-blue" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fetching live evidence...</span>
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="text-center py-16 border-2 border-dashed border-slate-200/60 rounded-3xl bg-white">
                                        <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Search Results</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Enter a query above to explore live literature evidence</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">
                                            Found {searchResults.length} Studies / Papers
                                        </h4>
                                        {searchResults.map((result: any) => (
                                            <div
                                                key={result.id}
                                                className="bg-white border border-slate-200/60 rounded-3xl p-5 hover:border-slate-300 transition-all shadow-sm flex flex-col justify-between gap-4 group"
                                            >
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                                            searchDb === 'pubmed' 
                                                                ? 'bg-blue-50 border border-blue-100 text-blue-600' 
                                                                : searchDb === 'semanticscholar'
                                                                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-600'
                                                                    : searchDb === 'openalex'
                                                                        ? 'bg-purple-50 border border-purple-100 text-purple-600'
                                                                        : 'bg-indigo-50 border border-indigo-100 text-indigo-600'
                                                        }`}>
                                                            <Database className="w-2.5 h-2.5" />
                                                            {searchDb === 'pubmed' 
                                                                ? 'PubMed ID: ' + result.id 
                                                                : searchDb === 'semanticscholar'
                                                                    ? 'Semantic Scholar'
                                                                    : searchDb === 'openalex'
                                                                        ? 'OpenAlex ID'
                                                                        : 'ClinicalTrials.gov: ' + result.id}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-400">{result.date}</span>
                                                    </div>
                                                    <h5 className="text-xs font-black text-slate-800 leading-snug group-hover:text-advent-blue transition-colors">
                                                        {result.title}
                                                    </h5>
                                                    <p className="text-[10px] text-slate-500 font-medium">
                                                        <span className="font-bold text-slate-700">Source/Authors: </span>
                                                        {result.authors}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-medium">
                                                        <span className="font-bold text-slate-600">Details: </span>
                                                        {result.journal}
                                                    </p>
                                                </div>
                                                
                                                <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 mt-1 gap-2">
                                                    <a
                                                        href={result.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        View Source
                                                    </a>
                                                    
                                                    <button
                                                        onClick={() => handleSynthesize(result)}
                                                        disabled={synthesizingId === result.id}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-advent-blue to-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:shadow-md hover:from-advent-navy hover:to-indigo-800 disabled:opacity-50 transition-all active:scale-95"
                                                    >
                                                        {synthesizingId === result.id ? (
                                                            <>
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                                Synthesizing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Brain className="w-3 h-3" />
                                                                Synthesize Insight
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                                
                                                {/* AI Synthesized Insight glowing glassmorphic card */}
                                                {synthesizedInsights[result.id] && (
                                                    <div className="mt-3 bg-gradient-to-br from-advent-blue/5 to-purple-50/30 border border-advent-blue/10 rounded-2xl p-4 relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <div className="absolute top-0 right-0 w-24 h-24 bg-advent-blue/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                                                        <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-indigo-600 mb-1.5">
                                                            <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                                                            QI Methodology Translation (PDSA Ideas)
                                                        </div>
                                                        <p className="text-[10px] text-slate-600 font-medium leading-relaxed italic">
                                                            "{synthesizedInsights[result.id]}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab content 3: Manuscript Builder */}
                    {activeTab === 'manuscript' && (
                        <div className="space-y-6">
                            {/* Main Manuscript IMRAD Outline card */}
                            <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileCheck className="w-5 h-5 text-indigo-500" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            IMRAD Scholarly Outline Draft
                                        </h4>
                                    </div>
                                    {manuscriptText && (
                                        <button
                                            onClick={handleCopyManuscript}
                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                                manuscriptCopied ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            {manuscriptCopied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                            {manuscriptCopied ? 'Copied Manuscript' : 'Copy Manuscript'}
                                        </button>
                                    )}
                                </div>

                                <div className="p-6 bg-slate-50 border border-slate-200/40 rounded-2xl text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[300px] max-h-[450px] overflow-y-auto font-serif">
                                    {isGeneratingManuscript ? (
                                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synthesizing full IMRAD scholarly draft...</span>
                                        </div>
                                    ) : manuscriptError ? (
                                        <div className="text-center py-12 text-rose-500 font-bold uppercase text-[10px]">{manuscriptError}</div>
                                    ) : (
                                        manuscriptText
                                    )}
                                </div>
                            </div>

                            {/* Journal Selection Advisor */}
                            {isFindingJournal && !journalFitData ? (
                                <div className="flex items-center justify-center py-8 gap-2 bg-white rounded-3xl border border-slate-100">
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Consulting Journal Match Database...</span>
                                </div>
                            ) : journalFitData ? (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">
                                        Journal Selection Fit Suggestions
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {journalFitData.journals?.map((j: any, i: number) => {
                                            let badgeBg = 'bg-blue-50 border-blue-100 text-blue-700';
                                            if (j.acceptanceProbability === 'High') badgeBg = 'bg-emerald-50 border-emerald-100 text-emerald-700';
                                            else if (j.acceptanceProbability === 'Low') badgeBg = 'bg-rose-50 border-rose-100 text-rose-700';
                                            return (
                                                <div key={i} className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between gap-4 shadow-sm hover:border-slate-300 transition-all">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Journal {i+1}</span>
                                                            <span className={`inline-flex items-center text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeBg}`}>
                                                                {j.acceptanceProbability} Fit
                                                            </span>
                                                        </div>
                                                        <h6 className="text-xs font-black text-slate-800 leading-tight">{j.name}</h6>
                                                        <div className="grid grid-cols-2 gap-2 text-[8px] text-slate-400 uppercase font-black tracking-wider border-t border-slate-100 pt-2 mt-1">
                                                            <div>
                                                                <span className="block text-[7px] text-slate-400">Impact Factor</span>
                                                                <span className="text-slate-700 font-bold">{j.impactFactor}</span>
                                                            </div>
                                                            <div>
                                                                <span className="block text-[7px] text-slate-400">Limits (Abs/Ms)</span>
                                                                <span className="text-slate-700 font-bold">{j.abstractLimit} / {j.manuscriptLimit}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-2 italic">
                                                            "{j.rationale}"
                                                        </p>
                                                    </div>
                                                    <div className="border-t border-slate-50 pt-2 space-y-1">
                                                        <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 block animate-pulse">Formatting Checklist</span>
                                                        {j.formattingRules?.map((r: string, idx: number) => (
                                                            <div key={idx} className="flex items-center gap-1.5">
                                                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                                                                <span className="text-[9px] text-slate-500 font-medium leading-none">{r}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : null}

                            {/* Biostatistical Power & PICO Guide */}
                            {isAdvisingPower && !statisticalPowerData ? (
                                <div className="flex items-center justify-center py-8 gap-2 bg-white rounded-3xl border border-slate-100">
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Calculating biostatistical power estimates...</span>
                                </div>
                            ) : statisticalPowerData ? (
                                <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6 shadow-sm space-y-5 animate-in fade-in duration-300 font-sans">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <LineChart className="w-5 h-5 text-indigo-500" />
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Biostatistical Design, Power & PICO Guide
                                        </h5>
                                    </div>
                                    
                                    {/* PICO grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="bg-slate-50 border border-slate-200/40 rounded-2xl p-4">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-blue-600 block mb-1">Population</span>
                                            <p className="text-[10px] text-slate-600 font-medium leading-normal">{statisticalPowerData.pico?.population}</p>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-200/40 rounded-2xl p-4">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-amber-600 block mb-1">Intervention</span>
                                            <p className="text-[10px] text-slate-600 font-medium leading-normal">{statisticalPowerData.pico?.intervention}</p>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-200/40 rounded-2xl p-4">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-purple-600 block mb-1">Comparison</span>
                                            <p className="text-[10px] text-slate-600 font-medium leading-normal">{statisticalPowerData.pico?.comparison}</p>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-200/40 rounded-2xl p-4">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 block mb-1">Outcome</span>
                                            <p className="text-[10px] text-slate-600 font-medium leading-normal">{statisticalPowerData.pico?.outcome}</p>
                                        </div>
                                    </div>

                                    {/* Statistical Tests & Sample Size Advice */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                                        <div className="md:col-span-7 space-y-3">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block pl-1">Recommended Statistical Tests</span>
                                            <div className="space-y-3">
                                                {statisticalPowerData.recommendedTests?.map((t: any, idx: number) => (
                                                    <div key={idx} className="bg-slate-50/50 border border-slate-200/30 rounded-2xl p-4 flex flex-col gap-1.5 hover:bg-slate-50 hover:border-slate-200 transition-all">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                            <h6 className="text-[11px] font-bold text-slate-800 leading-none">{t.testName}</h6>
                                                        </div>
                                                        <p className="text-[9px] font-black uppercase tracking-tight text-slate-400">{t.useCase}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">"{t.rationale}"</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="md:col-span-5 space-y-3">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block pl-1">Sample Size & MDES Guidelines</span>
                                            <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/30 border border-indigo-100 rounded-3xl p-5 space-y-3.5 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100/30 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                                                <div>
                                                    <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Min Detectable Effect Size</span>
                                                    <p className="text-[10px] text-indigo-950 font-bold leading-normal">{statisticalPowerData.sampleSizeAdvice?.mdes}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Sample Size Threshold</span>
                                                    <p className="text-[10px] text-indigo-950 font-bold leading-normal">{statisticalPowerData.sampleSizeAdvice?.sampleSizeRuleOfThumb}</p>
                                                </div>
                                                <div className="border-t border-indigo-100 pt-2.5 mt-1">
                                                    <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Biostatistical Rationale</span>
                                                    <p className="text-[10px] text-slate-600 font-medium leading-relaxed italic">
                                                        "{statisticalPowerData.sampleSizeAdvice?.justification}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {/* Peer Review Simulator (Interactive Panel) */}
                            <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-6 shadow-sm space-y-4 font-sans">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Brain className="w-5 h-5 text-purple-500" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            AI Adversarial Peer Review Simulator
                                        </h4>
                                    </div>
                                    <button
                                        onClick={handleSimulatePeerReview}
                                        disabled={isSimulatingPeerReview || !manuscriptText}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:shadow-md hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all active:scale-95 shrink-0"
                                    >
                                        {isSimulatingPeerReview ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                Critiquing Draft...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                                                Simulate Peer Review
                                            </>
                                        )}
                                    </button>
                                </div>

                                {peerReviewText ? (
                                    <div className="p-6 bg-rose-50/20 border border-rose-100 rounded-2xl text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto animate-in fade-in duration-300 font-serif">
                                        {peerReviewText}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 border-2 border-dashed border-slate-200/60 rounded-2xl bg-slate-50/20">
                                        <Brain className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Peer Review Active</p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            Click "Simulate Peer Review" to get a highly demanding adversarial academic review of your draft!
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab content 4: RCA & PDSA Architect */}
                    {activeTab === 'architect' && (
                        <div className="space-y-6">
                            {isGeneratingArchitect ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-3xl border border-slate-100">
                                    <Loader2 className="w-8 h-8 animate-spin text-advent-blue" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Architecting Root Cause & PDSA outlines...</span>
                                </div>
                            ) : architectError ? (
                                <div className="p-8 text-center bg-rose-50 border border-rose-100 rounded-3xl text-rose-500 font-bold uppercase text-[10px]">
                                    {architectError}
                                </div>
                            ) : pdsaArchitectData ? (
                                <div className="space-y-6 animate-in fade-in duration-300 font-sans">
                                    {/* Visual Ishikawa Diagram */}
                                    <div className="relative bg-slate-900 text-white rounded-[2rem] p-6 overflow-hidden border border-slate-800 shadow-xl">
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-advent-blue/10 rounded-full blur-3xl pointer-events-none" />
                                        <div className="flex items-center gap-2 mb-6">
                                            <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                                                Root Cause Ishikawa (Fishbone) Architect
                                            </h5>
                                        </div>
                                        
                                        {/* Visual Fishbone Structure */}
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
                                            
                                            {/* Ribs (Causes) */}
                                            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                                                {/* Central Spine line (only on desktop md) */}
                                                <div className="hidden md:block absolute left-0 right-0 top-1/2 h-0.5 bg-indigo-500/30 transform -translate-y-1/2 z-0" />

                                                {/* People Rib */}
                                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 relative z-10 hover:border-indigo-500/50 transition-all">
                                                    <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-700/50">
                                                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-300">People</span>
                                                    </div>
                                                    <ul className="space-y-1.5">
                                                        {pdsaArchitectData.ishikawa?.people?.map((c: string, i: number) => (
                                                            <li key={i} className="text-[10px] text-slate-400 font-medium list-disc list-inside leading-snug">{c}</li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Process Rib */}
                                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 relative z-10 hover:border-indigo-500/50 transition-all">
                                                    <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-700/50">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-300">Process</span>
                                                    </div>
                                                    <ul className="space-y-1.5">
                                                        {pdsaArchitectData.ishikawa?.process?.map((c: string, i: number) => (
                                                            <li key={i} className="text-[10px] text-slate-400 font-medium list-disc list-inside leading-snug">{c}</li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Equipment Rib */}
                                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 relative z-10 hover:border-indigo-500/50 transition-all">
                                                    <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-700/50">
                                                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-300">Equipment</span>
                                                    </div>
                                                    <ul className="space-y-1.5">
                                                        {pdsaArchitectData.ishikawa?.equipment?.map((c: string, i: number) => (
                                                            <li key={i} className="text-[10px] text-slate-400 font-medium list-disc list-inside leading-snug">{c}</li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Environment Rib */}
                                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 relative z-10 hover:border-indigo-500/50 transition-all">
                                                    <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-700/50">
                                                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-300">Environment</span>
                                                    </div>
                                                    <ul className="space-y-1.5">
                                                        {pdsaArchitectData.ishikawa?.environment?.map((c: string, i: number) => (
                                                            <li key={i} className="text-[10px] text-slate-400 font-medium list-disc list-inside leading-snug">{c}</li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Materials Rib */}
                                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 relative z-10 hover:border-indigo-500/50 transition-all">
                                                    <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-700/50">
                                                        <div className="w-2 h-2 rounded-full bg-rose-400" />
                                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-300">Materials</span>
                                                    </div>
                                                    <ul className="space-y-1.5">
                                                        {pdsaArchitectData.ishikawa?.materials?.map((c: string, i: number) => (
                                                            <li key={i} className="text-[10px] text-slate-400 font-medium list-disc list-inside leading-snug">{c}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                
                                                {/* Spine Arrow Head */}
                                                <div className="hidden md:flex absolute right-[-10px] top-1/2 transform -translate-y-1/2 translate-x-full z-20 items-center">
                                                    <ChevronRight className="w-6 h-6 text-indigo-500/60" />
                                                </div>
                                            </div>

                                            {/* Fish Head (SMART Aim) */}
                                            <div className="w-full md:w-48 bg-gradient-to-br from-advent-blue to-indigo-600 border border-advent-blue/20 rounded-2xl p-4 relative z-10 shrink-0 text-center shadow-md">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-200">SMART Aim / Target</span>
                                                <p className="text-[11px] font-bold text-white leading-normal mt-1.5">{project.primary_outcome}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 5-Whys Analysis cascade */}
                                    <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <BookOpen className="w-5 h-5 text-indigo-500" />
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                5-Whys Root Cause Cascade
                                            </h5>
                                        </div>
                                        <div className="space-y-3 relative">
                                            {/* Vertical alignment lines */}
                                            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-100" />
                                            
                                            {pdsaArchitectData.fiveWhys?.map((why: string, idx: number) => (
                                                <div key={idx} className="flex items-start gap-4 relative z-10 group animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 75}ms` }}>
                                                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-all shrink-0">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1 bg-slate-50/50 group-hover:bg-slate-50 border border-slate-200/40 group-hover:border-slate-200 rounded-2xl p-3.5 transition-all">
                                                        <p className="text-[11px] text-slate-700 font-semibold leading-relaxed">{why}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 4-phase PDSA Roadmap cards */}
                                    <div className="space-y-4">
                                        <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">
                                            IHI Standard Next-Cycle PDSA Roadmap
                                        </h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* PLAN */}
                                            <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50/30 rounded-full blur-xl pointer-events-none" />
                                                <div className="flex items-center gap-2 mb-3 pb-1.5 border-b border-slate-100">
                                                    <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-[10px] font-black text-blue-600">P</div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Plan</span>
                                                </div>
                                                <p className="text-[10px] text-slate-600 font-medium leading-relaxed">{pdsaArchitectData.pdsaRoadmap?.plan}</p>
                                            </div>

                                            {/* DO */}
                                            <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50/30 rounded-full blur-xl pointer-events-none" />
                                                <div className="flex items-center gap-2 mb-3 pb-1.5 border-b border-slate-100">
                                                    <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-[10px] font-black text-amber-600">D</div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Do</span>
                                                </div>
                                                <p className="text-[10px] text-slate-600 font-medium leading-relaxed">{pdsaArchitectData.pdsaRoadmap?.do}</p>
                                            </div>

                                            {/* STUDY */}
                                            <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50/30 rounded-full blur-xl pointer-events-none" />
                                                <div className="flex items-center gap-2 mb-3 pb-1.5 border-b border-slate-100">
                                                    <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-[10px] font-black text-purple-600">S</div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Study</span>
                                                </div>
                                                <p className="text-[10px] text-slate-600 font-medium leading-relaxed">{pdsaArchitectData.pdsaRoadmap?.study}</p>
                                            </div>

                                            {/* ACT */}
                                            <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50/30 rounded-full blur-xl pointer-events-none" />
                                                <div className="flex items-center gap-2 mb-3 pb-1.5 border-b border-slate-100">
                                                    <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-[10px] font-black text-emerald-600">A</div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Act</span>
                                                </div>
                                                <p className="text-[10px] text-slate-600 font-medium leading-relaxed">{pdsaArchitectData.pdsaRoadmap?.act}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CFIR 2.0 & ERIC Strategies Mapper */}
                                    {isMappingCFIR && !cfirFrameworkData ? (
                                        <div className="flex items-center justify-center py-6 gap-2 bg-white rounded-3xl border border-slate-100">
                                            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mapping CFIR 2.0 implementation barriers...</span>
                                        </div>
                                    ) : cfirFrameworkData ? (
                                        <div className="space-y-4 animate-in fade-in duration-300">
                                            <div className="flex items-center justify-between">
                                                <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">
                                                    CFIR 2.0 & ERIC Implementation Strategy Mapping
                                                </h5>
                                                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                                                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                                                        Sustainability: {cfirFrameworkData.sustainabilityScore}%
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/40">
                                                <span className="font-bold text-slate-700">Sustainability Justification: </span>
                                                {cfirFrameworkData.sustainabilityJustification}
                                            </p>
                                            <div className="grid grid-cols-1 gap-3">
                                                {cfirFrameworkData.domains?.map((dom: any, i: number) => (
                                                    <div key={i} className="bg-white border border-slate-200/60 rounded-3xl p-5 hover:border-slate-300 transition-all shadow-sm">
                                                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                                                {dom.name}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                            <div className="md:col-span-4 space-y-2">
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Identified Barriers</span>
                                                                {dom.barriers && dom.barriers.length > 0 ? (
                                                                    <ul className="space-y-1">
                                                                        {dom.barriers.map((b: string, idx: number) => (
                                                                            <li key={idx} className="text-[9px] text-slate-600 font-bold list-disc list-inside leading-snug">{b}</li>
                                                                        ))}
                                                                    </ul>
                                                                ) : (
                                                                    <span className="text-[9px] text-slate-400 font-medium italic">No direct barriers identified.</span>
                                                                )}
                                                            </div>
                                                            <div className="md:col-span-4 space-y-2">
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Mapped ERIC Strategies</span>
                                                                {dom.strategies && dom.strategies.length > 0 ? (
                                                                    <ul className="space-y-1">
                                                                        {dom.strategies.map((s: string, idx: number) => (
                                                                            <li key={idx} className="text-[9px] text-indigo-700 font-bold bg-indigo-50/50 px-2 py-0.5 rounded-md inline-block mr-1 mb-1 leading-snug">{s}</li>
                                                                        ))}
                                                                    </ul>
                                                                ) : (
                                                                    <span className="text-[9px] text-slate-400 font-medium italic">No direct strategies mapped.</span>
                                                                )}
                                                            </div>
                                                            <div className="md:col-span-4 space-y-1">
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Implementation Details</span>
                                                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{dom.details}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}

                                    {/* Clinical EMR Specification Sheet */}
                                    {isGeneratingEMR && !emrSpecificationText ? (
                                        <div className="flex items-center justify-center py-6 gap-2 bg-white rounded-3xl border border-slate-100">
                                            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Compiling EMR analyst specifications...</span>
                                        </div>
                                    ) : emrSpecificationText ? (
                                        <div className="space-y-4 animate-in fade-in duration-300">
                                            <div className="flex items-center justify-between">
                                                <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">
                                                    Clinical EMR Analyst Build Specifications
                                                </h5>
                                                <button
                                                    onClick={handleCopyEMR}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                                        emrCopied ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {emrCopied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                    {emrCopied ? 'Copied Specs' : 'Copy Specs'}
                                                </button>
                                            </div>
                                            <div className="p-6 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-3xl border border-slate-800 shadow-inner overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[350px]">
                                                {emrSpecificationText}
                                            </div>
                                        </div>
                                    ) : null}

                                    {/* SPC Run Chart Auditor reports */}
                                    {isAnalyzingSPC && !spcReportText ? (
                                        <div className="flex items-center justify-center py-6 gap-2 bg-white rounded-3xl border border-slate-100">
                                            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Auditing statistical run chart processes...</span>
                                        </div>
                                    ) : spcReportText ? (
                                        <div className="space-y-4 animate-in fade-in duration-300">
                                            <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">
                                                Statistical Process Control & Run Chart Audit
                                            </h5>
                                            <div className="p-6 bg-white border border-slate-200/60 rounded-3xl shadow-sm text-[10px] text-slate-600 whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto">
                                                {spcReportText}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Tab content 5: SQUIRE & IRB Compliance Audit */}
                    {activeTab === 'audit' && (
                        <div className="space-y-6">
                            {isAuditing && !auditReport ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-4">
                                    <div className="relative w-16 h-16 flex items-center justify-center">
                                        <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                                        <div className="absolute inset-0 border-4 border-t-advent-blue border-r-indigo-500 rounded-full animate-spin" />
                                        <ShieldCheck className="w-6 h-6 text-advent-blue animate-pulse" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block animate-pulse">Running Clinical Compliance Scan...</span>
                                        <p className="text-[10px] text-slate-400 font-medium">Auditing SQUIRE 2.0 guidelines & IRB federal common rule</p>
                                    </div>
                                </div>
                            ) : auditError && !auditReport ? (
                                <div className="p-8 text-center bg-red-50/50 border border-red-100 rounded-3xl space-y-4 font-sans">
                                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                                    <div>
                                        <h4 className="text-xs font-black text-red-700 uppercase tracking-widest font-bold">Compliance Audit Failed</h4>
                                        <p className="text-[10px] text-red-600 font-medium mt-1">{auditError}</p>
                                    </div>
                                    <button
                                        onClick={handleReRunAudit}
                                        className="inline-flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Retry Compliance Audit
                                    </button>
                                </div>
                            ) : auditReport ? (
                                <div className="space-y-6 animate-in fade-in duration-300 font-sans">
                                    {/* Auditing Header / Actions */}
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">
                                            Academic Compliance Dashboard
                                        </h4>
                                        <button
                                            onClick={handleReRunAudit}
                                            disabled={isAuditing}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                        >
                                            <RefreshCw className={`w-3 h-3 ${isAuditing ? 'animate-spin' : ''}`} />
                                            Re-run Scan
                                        </button>
                                    </div>

                                    {/* Score & IRB Summary Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        {/* SQUIRE Score Circular Dial */}
                                        <div className="md:col-span-5 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4">SQUIRE 2.0 Score</span>
                                            
                                            {/* Circular Progress Path */}
                                            <div className="relative w-28 h-28 flex items-center justify-center mb-3">
                                                {(() => {
                                                    const score = auditReport.squireScore || 0;
                                                    const radius = 42;
                                                    const circumference = 2 * Math.PI * radius;
                                                    const strokeDashoffset = circumference - (score / 100) * circumference;
                                                    let scoreColor = 'text-emerald-500';
                                                    if (score < 50) scoreColor = 'text-rose-500';
                                                    else if (score < 80) scoreColor = 'text-amber-500';
                                                    
                                                    return (
                                                        <>
                                                            <svg className="w-full h-full transform -rotate-90">
                                                                <circle
                                                                    cx="56"
                                                                    cy="56"
                                                                    r={radius}
                                                                    className="text-slate-100"
                                                                    strokeWidth="8"
                                                                    stroke="currentColor"
                                                                    fill="transparent"
                                                                />
                                                                <circle
                                                                    cx="56"
                                                                    cy="56"
                                                                    r={radius}
                                                                    className={`${scoreColor} transition-all duration-1000 ease-out`}
                                                                    strokeWidth="8"
                                                                    strokeDasharray={circumference}
                                                                    strokeDashoffset={strokeDashoffset}
                                                                    strokeLinecap="round"
                                                                    stroke="currentColor"
                                                                    fill="transparent"
                                                                />
                                                            </svg>
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                <span className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{score}</span>
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">/ 100</span>
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                            
                                            {/* Rating Badge */}
                                            {(() => {
                                                const score = auditReport.squireScore || 0;
                                                let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                                                let badgeText = 'Exemplary QI Design';
                                                if (score < 50) {
                                                    badgeBg = 'bg-rose-50 text-rose-700 border-rose-100';
                                                    badgeText = 'Needs Rigor Update';
                                                } else if (score < 80) {
                                                    badgeBg = 'bg-amber-50 text-amber-700 border-amber-100';
                                                    badgeText = 'Approaching Standard';
                                                }
                                                return (
                                                    <span className={`inline-flex items-center text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${badgeBg}`}>
                                                        {badgeText}
                                                    </span>
                                                );
                                            })()}
                                        </div>

                                        {/* IRB Pre-screening Card */}
                                        <div className="md:col-span-7 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">IRB Pre-Screening</span>
                                                    <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700`}>
                                                        <ShieldCheck className="w-3 h-3" />
                                                        {auditReport.irbStatus || 'QI determination'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1.5 pl-0.5">IRB Rationale Summary</p>
                                                <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic border-l-2 border-indigo-200 pl-3">
                                                    "{auditReport.irbRationale}"
                                                </p>
                                            </div>
                                            <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between">
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">45 CFR 46 Common Rule Standard</span>
                                                <div className="flex items-center gap-1 text-[8px] font-black text-indigo-600 uppercase tracking-widest">
                                                    <span>Pre-Audited</span>
                                                    <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 5-Domain Checklist Accordion/Cards */}
                                    <div className="space-y-3">
                                        <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">
                                            SQUIRE 2.0 Domain-Level Breakdown
                                        </h5>
                                        <div className="grid grid-cols-1 gap-3">
                                            {auditReport.checklist?.map((item: any) => {
                                                let StatusIcon = CheckCircle2;
                                                let iconColor = 'text-emerald-500';
                                                let itemBg = 'bg-emerald-50/20 border-emerald-100/50 hover:border-emerald-200';
                                                let badgeColor = 'bg-emerald-50 border-emerald-100 text-emerald-700';
                                                
                                                if (item.status === 'warn') {
                                                    StatusIcon = AlertTriangle;
                                                    iconColor = 'text-amber-500';
                                                    itemBg = 'bg-amber-50/20 border-amber-100/50 hover:border-amber-200';
                                                    badgeColor = 'bg-amber-50 border-amber-100 text-amber-700';
                                                } else if (item.status === 'fail') {
                                                    StatusIcon = XCircle;
                                                    iconColor = 'text-rose-500';
                                                    itemBg = 'bg-rose-50/20 border-rose-100/50 hover:border-rose-200';
                                                    badgeColor = 'bg-rose-50 border-rose-100 text-rose-700';
                                                }
                                                
                                                return (
                                                    <div 
                                                        key={item.id}
                                                        className={`bg-white border rounded-[1.5rem] p-4 transition-all shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4 group ${itemBg}`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="mt-0.5 shrink-0">
                                                                <StatusIcon className={`w-5 h-5 ${iconColor}`} />
                                                            </div>
                                                            <div>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <h6 className="text-xs font-black text-slate-800 tracking-tight">
                                                                        {item.label}
                                                                    </h6>
                                                                    <span className={`inline-flex items-center text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor}`}>
                                                                        {item.status}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1.5">
                                                                    {item.details}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Actionable Academic Recommendations Roadmap */}
                                    {auditReport.recommendations && auditReport.recommendations.length > 0 && (
                                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2rem] p-6 text-white shadow-lg space-y-4 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-200 leading-none">
                                                    Actionable Submission Roadmap
                                                </h5>
                                            </div>
                                            <div className="grid grid-cols-1 gap-3 pt-2">
                                                {auditReport.recommendations.map((rec: string, index: number) => (
                                                    <div 
                                                        key={index}
                                                        className="flex items-start gap-3.5 bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all"
                                                    >
                                                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-amber-400 shrink-0 mt-0.5">
                                                            {index + 1}
                                                        </div>
                                                        <p className="text-[11px] text-slate-200 font-medium leading-relaxed">
                                                            {rec}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* IRB Exemption Advisor Letter */}
                                    {isGeneratingIRB && !irbExemptionText ? (
                                        <div className="flex items-center justify-center py-6 gap-2 bg-white rounded-3xl border border-slate-100">
                                            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Drafting IRB Exemption Advisor Letter...</span>
                                        </div>
                                    ) : irbExemptionText ? (
                                        <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-6 shadow-sm space-y-4 animate-in fade-in duration-300">
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <FileCheck className="w-5 h-5 text-indigo-500" />
                                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        IRB Exemption Advisor Letter Draft
                                                    </h5>
                                                </div>
                                                <button
                                                    onClick={handleCopyIRB}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                                        irbCopied ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {irbCopied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                    {irbCopied ? 'Copied Letter' : 'Copy Letter'}
                                                </button>
                                            </div>
                                            <div className="p-6 bg-slate-50 border border-slate-200/40 rounded-2xl text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto font-serif">
                                                {irbExemptionText}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="text-center py-16 border-2 border-dashed border-slate-200/60 rounded-3xl bg-white space-y-4 font-sans">
                                    <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Compliance Data</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Failed to retrieve compliance audit. Click below to start standard scan.</p>
                                    </div>
                                    <button
                                        onClick={handleReRunAudit}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-advent-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-advent-navy transition-all active:scale-95 shadow-sm"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Run Compliance Scan
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bottom buttons */}
                    <div className="flex items-center justify-between pt-6 border-t border-slate-100 font-sans">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                <div className="w-10 h-10 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600 shadow-sm">AH</div>
                                <div className="w-10 h-10 rounded-full border-4 border-white bg-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-600 shadow-sm">GME</div>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Collaborators Linked</span>
                        </div>

                        {activeTab === 'abstract' && (
                            <button
                                className="group flex items-center gap-2 text-advent-blue font-black text-[10px] uppercase tracking-widest hover:translate-x-1 transition-transform bg-advent-blue/5 px-6 py-3 rounded-xl"
                                onClick={() => alert("PDF Export coming soon!")}
                            >
                                Export PDF Summary
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}

                        {activeTab === 'manuscript' && manuscriptText && (
                            <button
                                className="group flex items-center gap-2 text-advent-blue font-black text-[10px] uppercase tracking-widest hover:translate-x-1 transition-transform bg-advent-blue/5 px-6 py-3 rounded-xl"
                                onClick={handleCopyManuscript}
                            >
                                Copy Manuscript Draft
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}

                        {activeTab === 'architect' && pdsaArchitectData && (
                            <button
                                className="group flex items-center gap-2 text-advent-blue font-black text-[10px] uppercase tracking-widest hover:translate-x-1 transition-transform bg-advent-blue/5 px-6 py-3 rounded-xl"
                                onClick={handleCopyEMR}
                            >
                                Copy EMR Specs
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}

                        {activeTab === 'audit' && auditReport && (
                            <button
                                className="group flex items-center gap-2 text-advent-blue font-black text-[10px] uppercase tracking-widest hover:translate-x-1 transition-transform bg-advent-blue/5 px-6 py-3 rounded-xl"
                                onClick={() => alert("Compliance Audit Export coming soon!")}
                            >
                                Export Audit Report
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
