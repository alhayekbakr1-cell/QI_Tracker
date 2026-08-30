"use client"

import { useState, useRef, useEffect } from "react";
import { 
    MessageSquare, 
    Plus, 
    Search, 
    Trash2, 
    Edit2, 
    Send, 
    Bot, 
    Loader2, 
    AlertTriangle, 
    Sparkles, 
    CheckSquare, 
    Trophy, 
    Activity, 
    Check, 
    X,
    FolderSync,
    Paperclip,
    BookOpen,
    ExternalLink
} from "lucide-react";
import { streamQIAdvice } from "@/utils/ai";
import { scanForPHI } from "@/utils/phi_guard";
import { createClient } from "@/utils/supabase/client";
import { Project } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { EBMPaper, searchEBM } from "@/utils/ebm";

interface ChatMessage {
    role: 'user' | 'ai';
    content: string;
    timestamp: string;
}

interface ChatSession {
    id: string;
    title: string;
    createdAt: string;
    messages: ChatMessage[];
}

export default function QIConsultantWorkspace() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    // Text accumulated so far for the in-flight reply, rendered live.
    const [streamingText, setStreamingText] = useState("");
    
    // Inline Renaming State
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editTitleValue, setEditTitleValue] = useState("");
    
    // Delete Confirmation State
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // Project Context Injection State
    const [userProjects, setUserProjects] = useState<Project[]>([]);
    const [attachedProjectId, setAttachedProjectId] = useState<string | null>(null);
    const supabase = createClient();

    // Literature Search & Citation Injector State
    const [attachedPapers, setAttachedPapers] = useState<EBMPaper[]>([]);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [ebmSearchQuery, setEbmSearchQuery] = useState("");
    const [ebmSource, setEbmSource] = useState<'pubmed' | 'semanticscholar' | 'openalex' | 'clinicaltrials'>('pubmed');
    const [ebmResults, setEbmResults] = useState<EBMPaper[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState("");

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load projects on mount for contextual injection
    useEffect(() => {
        async function fetchProjects() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data, error } = await supabase
                        .from("projects")
                        .select("*")
                        .order("last_updated_date", { ascending: false });
                    if (error) throw error;
                    if (data) {
                        setUserProjects(data as Project[]);
                    }
                }
            } catch (err) {
                console.error("Error fetching projects for Dr. QI context:", err);
            }
        }
        fetchProjects();
    }, []);

    // Load sessions from LocalStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("qi-chief-chat-sessions");
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as ChatSession[];
                setSessions(parsed);
                if (parsed.length > 0) {
                    setActiveSessionId(parsed[0].id);
                }
            } catch (e) {
                console.error("Error loading chat sessions from localStorage:", e);
            }
        } else {
            // Seed a welcome session if none exist
            const welcomeSession: ChatSession = {
                id: "welcome-thread",
                title: "Welcome Session 🩺",
                createdAt: new Date().toISOString(),
                messages: [
                    {
                        role: 'ai',
                        content: "Welcome, colleague! I am **Dr. QI**, your senior academic research and Quality Improvement mentor. \n\nI am here to guide you step-by-step through your scholarly QI design, SQUIRE 2.0 alignment, root-cause analyses, or IRB determination pre-screening. Select one of the preset prompt starters below, or simply describe your clinical problem or PICO parameters in the chat input, and let's optimize your project for publication standards!",
                        timestamp: new Date().toISOString()
                    }
                ]
            };
            setSessions([welcomeSession]);
            setActiveSessionId(welcomeSession.id);
            localStorage.setItem("qi-chief-chat-sessions", JSON.stringify([welcomeSession]));
        }
    }, []);

    // Scroll to bottom of chat when messages update
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [sessions, activeSessionId, isLoading, streamingText]);

    const activeSession = sessions.find(s => s.id === activeSessionId) || null;

    const saveSessions = (updated: ChatSession[]) => {
        setSessions(updated);
        localStorage.setItem("qi-chief-chat-sessions", JSON.stringify(updated));
    };

    // Spawn a new chat
    const handleNewChat = () => {
        // Clean up any existing empty threads (no user messages) to match ChatGPT behavior
        const cleaned = sessions.filter(s => s.messages.filter(m => m.role === 'user').length > 0 || s.id === 'welcome-thread');
        
        const newId = Math.random().toString(36).substring(2, 9);
        const newSession: ChatSession = {
            id: newId,
            title: `QI Thread #${cleaned.length + 1}`,
            createdAt: new Date().toISOString(),
            messages: []
        };
        const updated = [newSession, ...cleaned];
        saveSessions(updated);
        setActiveSessionId(newId);
        setInput("");
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    // Inline Renaming Actions
    const startRename = (id: string, currentTitle: string) => {
        setEditingSessionId(id);
        setEditTitleValue(currentTitle);
    };

    const saveRename = (id: string) => {
        if (!editTitleValue.trim()) return;
        const updated = sessions.map(s => {
            if (s.id === id) {
                return { ...s, title: editTitleValue.trim() };
            }
            return s;
        });
        saveSessions(updated);
        setEditingSessionId(null);
    };

    const cancelRename = () => {
        setEditingSessionId(null);
    };

    // Thread Deletion
    const handleDeleteSession = (id: string) => {
        const updated = sessions.filter(s => s.id !== id);
        saveSessions(updated);
        
        if (activeSessionId === id) {
            if (updated.length > 0) {
                setActiveSessionId(updated[0].id);
            } else {
                setActiveSessionId(null);
            }
        }
        setConfirmDeleteId(null);
    };

    const handleClearAll = () => {
        if (window.confirm("Are you sure you want to permanently clear your entire conversation history? This cannot be undone.")) {
            saveSessions([]);
            setActiveSessionId(null);
        }
    };

    // Main send message
    const handleSend = async (
        e?: React.FormEvent, 
        customPrompt?: string, 
        customSessionsList?: ChatSession[], 
        customActiveId?: string
    ) => {
        if (e) e.preventDefault();
        
        const messageText = customPrompt || input.trim();
        if (!messageText || isLoading) return;

        // Ensure we have an active session to append to. If not, make one.
        let currentSessionId = customActiveId || activeSessionId;
        let currentSessionsList = customSessionsList || [...sessions];
        let session = currentSessionsList.find(s => s.id === currentSessionId);

        if (!session || !currentSessionId) {
            const newId = Math.random().toString(36).substring(2, 9);
            const newSession: ChatSession = {
                id: newId,
                title: messageText.length > 25 ? messageText.substring(0, 22) + "..." : messageText,
                createdAt: new Date().toISOString(),
                messages: []
            };
            currentSessionsList = [newSession, ...currentSessionsList];
            session = newSession;
            currentSessionId = newId;
            setActiveSessionId(newId);
        }

        const newUserMessage: ChatMessage = {
            role: 'user',
            content: messageText,
            timestamp: new Date().toISOString()
        };

        // If it's the very first user message in this thread, rename the thread title to match the user question
        const isFirstUserMessage = session.messages.filter(m => m.role === 'user').length === 0;
        let updatedTitle = session.title;
        if (isFirstUserMessage && session.id !== 'welcome-thread') {
            updatedTitle = messageText.length > 30 ? messageText.substring(0, 27) + "..." : messageText;
        }

        // Setup messages payload
        const updatedMessages = [...session.messages, newUserMessage];
        
        const updatedSessions = currentSessionsList.map(s => {
            if (s.id === currentSessionId) {
                return {
                    ...s,
                    title: updatedTitle,
                    messages: updatedMessages
                };
            }
            return s;
        });

        saveSessions(updatedSessions);
        setInput("");
        setAttachedPapers([]); // Clear the visual citation dock upon submission
        setIsLoading(true);

        // Retrieve attached project context parameters
        let projectContext = "";
        if (attachedProjectId) {
            const attachedProj = userProjects.find(p => p.id === attachedProjectId);
            if (attachedProj) {
                projectContext = `
[ATTACHED RESIDENT PROJECT METADATA - CLINICAL SURVEILLANCE CONTEXT]
- Project Title: "${attachedProj.title}"
- Focus Category: "${attachedProj.category || 'Quality Improvement'}"
- Registry Phase: "${attachedProj.status || 'Idea'}"
- SMART Aim Statement: "${attachedProj.primary_outcome || 'No aim statement defined yet'}"
- Updates & Documented Barriers: "${attachedProj.updates_and_barriers || 'No updates or barriers entered yet'}"

Dr. QI directive: Ground your response strictly in the parameters of this attached project. Do not ask them to restate their PICO aim or title. Focus directly on advising them on their specific workflow, pdsa design, or metric queries based on this context.
`;
            }
        }

        if (attachedPapers.length > 0) {
            const papersContext = `
[ATTACHED SCHOLARLY LITERATURE & EVIDENCE-BASED MEDICINE REFERENCES]
${attachedPapers.map((paper, idx) => `
Reference [${idx + 1}]:
- Title: "${paper.title}"
- Authors: "${paper.authors}"
- Venue/Journal: "${paper.journal}"
- Publication Date/Year: "${paper.date}"
- URL: "${paper.url}"
${paper.abstract ? `- Abstract: "${paper.abstract}"` : ''}
`).join('\n')}

Dr. QI directive: Incorporate findings or align your Quality Improvement suggestions with the attached scholarly references where appropriate. Cite these specific papers in your advice using academic style brackets, matching their index numbers, for example: "[1]" or "[2]". Ensure the resident can see how their project aligns with existing published evidence.
`;
            projectContext = projectContext ? `${projectContext}\n${papersContext}` : papersContext;
        }

        try {
            // Conversation history in the shape the prompt builder expects.
            const historyPayload = updatedMessages.map(m => ({
                role: m.role,
                content: m.content
            }));

            setStreamingText("");
            const advice = await streamQIAdvice(
                messageText,
                setStreamingText,
                projectContext || undefined,
                undefined,
                historyPayload
            );
            setStreamingText("");

            const newAIMessage: ChatMessage = {
                role: 'ai',
                content: advice,
                timestamp: new Date().toISOString()
            };

            const finalizedSessions = updatedSessions.map(s => {
                if (s.id === currentSessionId) {
                    return {
                        ...s,
                        messages: [...updatedMessages, newAIMessage]
                    };
                }
                return s;
            });
            saveSessions(finalizedSessions);
        } catch (error) {
            const errorAIMessage: ChatMessage = {
                role: 'ai',
                content: "I apologize, but I encountered an error communicating with my medical QI knowledge base. Please try checking your network connection or try again shortly.",
                timestamp: new Date().toISOString()
            };
            const finalizedSessions = updatedSessions.map(s => {
                if (s.id === currentSessionId) {
                    return {
                        ...s,
                        messages: [...updatedMessages, errorAIMessage]
                    };
                }
                return s;
            });
            saveSessions(finalizedSessions);
        } finally {
            setIsLoading(false);
        }
    };

    // Quick Trigger for Prompt Starters
    const handlePromptStarter = (promptText: string) => {
        const hasActiveUserMessages = activeSession && activeSession.messages.filter(m => m.role === 'user').length > 0;
        
        if (activeSession && !hasActiveUserMessages) {
            // Reuse current active session (it has no user messages yet)
            const updatedTitle = promptText.length > 25 ? promptText.substring(0, 22) + "..." : promptText;
            const updated = sessions.map(s => {
                if (s.id === activeSession.id) {
                    return {
                        ...s,
                        title: updatedTitle
                    };
                }
                return s;
            });
            saveSessions(updated);
            
            // Execute send immediately in this session
            handleSend(undefined, promptText, updated, activeSession.id);
        } else {
            // Clean up any stray empty threads first, then create a new one (ChatGPT behavior)
            const cleaned = sessions.filter(s => s.messages.filter(m => m.role === 'user').length > 0 || s.id === 'welcome-thread');
            
            const newId = Math.random().toString(36).substring(2, 9);
            const starterSession: ChatSession = {
                id: newId,
                title: promptText.length > 25 ? promptText.substring(0, 22) + "..." : promptText,
                createdAt: new Date().toISOString(),
                messages: []
            };
            const updated = [starterSession, ...cleaned];
            
            // Immediately set state for subsequent render cycles
            setActiveSessionId(newId);
            saveSessions(updated);
            
            // Execute handleSend immediately with synchronous fresh data parameters to bypass closure stale state
            handleSend(undefined, promptText, updated, newId);
        }
    };

    const handleEBMQuery = async () => {
        if (!ebmSearchQuery.trim()) return;
        setIsSearching(true);
        setSearchError("");
        setEbmResults([]);
        try {
            const results = await searchEBM(ebmSearchQuery.trim(), ebmSource);
            setEbmResults(results);
            if (results.length === 0) {
                setSearchError("No results found for this query in the selected registry.");
            }
        } catch (err) {
            console.error("EBM search error:", err);
            // Surface the actual reason. Semantic Scholar throttles heavily, and
            // reporting that as "check connectivity" sends people debugging the
            // wrong thing entirely.
            setSearchError(
                err instanceof Error && err.message
                    ? err.message
                    : "Registry request failed. Please try again or switch registry."
            );
        } finally {
            setIsSearching(false);
        }
    };

    const togglePaperSelection = (paper: EBMPaper) => {
        setAttachedPapers(prev => {
            const alreadyExists = prev.some(p => p.id === paper.id);
            if (alreadyExists) {
                return prev.filter(p => p.id !== paper.id);
            } else {
                if (prev.length >= 3) {
                    alert("To maintain clean context limits, you can attach a maximum of 3 references per question.");
                    return prev;
                }
                return [...prev, paper];
            }
        });
    };

    // Real-time search filters
    const filteredSessions = sessions.filter(session => {
        const titleMatch = session.title.toLowerCase().includes(searchQuery.toLowerCase());
        const messageMatch = session.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()));
        return titleMatch || messageMatch;
    });

    const phiDetected = input.length > 5 && scanForPHI(input).length > 0;

    return (
        <div className="flex flex-col lg:flex-row h-[650px] bg-white rounded-3xl overflow-hidden border border-slate-200/60 shadow-xs relative">
            
            {/* LEFT SIDEBAR - Thread History Panel */}
            <aside className="w-full lg:w-76 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col bg-slate-50/50 shrink-0">
                
                {/* Sidebar Header */}
                <div className="p-4 border-b border-slate-100/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-advent-navy" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Chat History</span>
                    </div>
                    <button
                        onClick={handleNewChat}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-advent-navy text-white text-[9px] font-black uppercase tracking-wider rounded-lg hover:bg-advent-cobalt transition-all shadow-3xs cursor-pointer"
                    >
                        <Plus className="w-3 h-3" /> New
                    </button>
                </div>

                {/* Sidebar Search Bar */}
                <div className="p-3 border-b border-slate-100/50 relative group">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search chats..."
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-250 rounded-lg text-xs outline-none focus:ring-2 focus:ring-advent-navy/10 focus:border-advent-navy font-semibold transition-all placeholder:text-slate-400 placeholder:font-normal"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-5.5 top-1/2 -translate-y-1/2" />
                </div>

                {/* Sidebar Scrollable Thread List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {filteredSessions.length > 0 ? (
                        filteredSessions.map((session) => {
                            const isActive = session.id === activeSessionId;
                            const isEditing = session.id === editingSessionId;
                            const isConfirmingDelete = session.id === confirmDeleteId;

                            return (
                                <div
                                    key={session.id}
                                    className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                                        isActive
                                            ? "bg-white border border-slate-200/80 shadow-2xs"
                                            : "hover:bg-slate-100/60 border border-transparent"
                                    }`}
                                    onClick={() => !isEditing && setActiveSessionId(session.id)}
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0 mr-1">
                                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-advent-navy' : 'text-slate-400'}`} />
                                        
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editTitleValue}
                                                onChange={(e) => setEditTitleValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveRename(session.id);
                                                    if (e.key === 'Escape') cancelRename();
                                                }}
                                                onBlur={() => saveRename(session.id)}
                                                autoFocus
                                                className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-advent-navy"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <span className={`text-xs truncate font-bold ${isActive ? 'text-advent-navy font-black' : 'text-slate-650'}`}>
                                                {session.title}
                                            </span>
                                        )}
                                    </div>

                                    {/* Action Buttons (Renaming & Trash) */}
                                    {!isEditing && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {isConfirmingDelete ? (
                                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => handleDeleteSession(session.id)}
                                                        className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                                                        title="Confirm Delete"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDeleteId(null)}
                                                        className="p-1 bg-slate-100 text-slate-500 rounded hover:bg-slate-200 transition-colors"
                                                        title="Cancel"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            startRename(session.id, session.title);
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-advent-navy hover:bg-slate-100 rounded transition-all"
                                                        title="Rename Session"
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConfirmDeleteId(session.id);
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                                        title="Delete Session"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-12 text-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">No sessions found</span>
                        </div>
                    )}
                </div>

                {/* Sidebar Footer Operations */}
                {sessions.length > 0 && (
                    <div className="p-3 border-t border-slate-100/80 bg-slate-50">
                        <button
                            onClick={handleClearAll}
                            className="w-full py-2 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Clear All Threads
                        </button>
                    </div>
                )}
            </aside>

            {/* RIGHT CONSOLE - Dynamic Conversations Workspace */}
            <section className="flex-1 flex flex-col min-w-0 bg-slate-50/20">
                
                {/* Console Top Header */}
                <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between gap-4 shrink-0 shadow-3xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="bg-advent-navy/10 p-2 rounded-xl text-advent-navy">
                            <Bot className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-xs font-black uppercase tracking-wider text-advent-navy truncate">
                                {activeSession ? activeSession.title : "Dr. QI Mentor"}
                            </h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Mentorship</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Pane */}
                <div 
                    ref={scrollRef} 
                    className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-55/30 custom-scrollbar flex flex-col"
                >
                    {(!activeSession || activeSession.messages.length === 0) ? (
                        
                        /* WELCOME LANDING CANVAS */
                        <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto py-8">
                            <div className="text-center space-y-4 mb-8">
                                <div className="inline-flex p-4 bg-advent-navy text-white rounded-3xl shadow-md border border-advent-cobalt relative">
                                    <Bot className="w-8 h-8 text-white" />
                                    <div className="absolute -bottom-1 -right-1 bg-emerald-400 w-3 h-3 rounded-full border-2 border-white animate-pulse" />
                                </div>
                                <div className="space-y-1.5">
                                    <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-slate-400">Dr. QI Mentorship System</span>
                                    <h2 className="text-2xl font-serif italic font-bold text-slate-900 leading-tight">
                                        Dr. QI Scholarly Co-Pilot
                                    </h2>
                                    <p className="text-[11px] font-bold text-slate-450 uppercase tracking-wider max-w-md mx-auto leading-relaxed">
                                        Hospital-Branded Academic Advisor for AdventHealth GME Quality Improvement & Research Initiatives
                                    </p>
                                </div>
                            </div>

                            {/* Preset Prompt Starters Grid */}
                            <div className="space-y-3">
                                <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-slate-400 mb-1">Select a Mentor Starter:</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[
                                        {
                                            title: "💡 Brainstorm a QI Project",
                                            desc: "Identify clinical issues in your ward and frame a viable QI study.",
                                            prompt: "Help me identify an inpatient clinical problem in my ward that would make a viable Quality Improvement project."
                                        },
                                        {
                                            title: "🎯 Shape a SMART Aim",
                                            desc: "Convert a vague clinical target into a highly metricated, time-bound aim.",
                                            prompt: "I have an idea to improve discharge summaries. Help me convert this into a Specific, Measurable, Achievable, Relevant, and Time-bound (SMART) Aim."
                                        },
                                        {
                                            title: "📊 Select Key Metrics",
                                            desc: "Design appropriate Process, Outcome, and Balancing registry safeguards.",
                                            prompt: "My project aims to reduce clinical telemetry alarms. Help me design appropriate Process, Outcome, and Balancing metrics."
                                        },
                                        {
                                            title: "🔄 Design a PDSA Cycle",
                                            desc: "Outline the parameters and execution logic for your first cycle.",
                                            prompt: "We want to implement a checklist for central line insertions. Let's design our first Plan-Do-Study-Act (PDSA) cycle."
                                        },
                                    ].map((starter, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handlePromptStarter(starter.prompt)}
                                            className="p-4 bg-white border border-slate-200/80 rounded-2xl text-left hover:border-advent-navy hover:shadow-2xs transition-all duration-300 group cursor-pointer"
                                        >
                                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 group-hover:text-advent-navy transition-colors mb-1.5">
                                                {starter.title}
                                            </h4>
                                            <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                                                {starter.desc}
                                            </p>
                                        </button>
                                    ))}
                                    
                                    {/* Double Column Starter */}
                                    <button
                                        onClick={() => handlePromptStarter("My project involves analyzing de-identified registry data for diabetic compliance. Let's check if this is Exempt QI or Human Subjects Research.")}
                                        className="p-4 bg-white border border-slate-200/80 rounded-2xl text-left hover:border-advent-navy hover:shadow-2xs transition-all duration-300 group cursor-pointer md:col-span-2 flex items-center justify-between gap-4"
                                    >
                                        <div className="max-w-xl">
                                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 group-hover:text-advent-navy transition-colors mb-1">
                                                🩺 IRB Screening & determination Check
                                            </h4>
                                            <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                                                Analyze if your registry data, clinical trial, or aggregate chart review is categorized as Exempt QI or requires full GME IRB oversight.
                                            </p>
                                        </div>
                                        <div className="p-2 bg-slate-50 text-slate-450 rounded-xl group-hover:bg-advent-navy/10 group-hover:text-advent-navy transition-colors shrink-0">
                                            <FolderSync className="w-4 h-4" />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        
                        /* ACTIVE CHAT STREAM */
                        <div className="space-y-4 max-w-4xl mx-auto w-full flex-1">
                            {activeSession.messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 sm:p-5 rounded-2xl shadow-3xs leading-relaxed text-sm ${
                                        msg.role === 'user'
                                            ? 'bg-gradient-to-br from-advent-navy to-advent-cobalt text-white rounded-br-none font-medium'
                                            : 'bg-white text-slate-700 border border-slate-200/70 rounded-bl-none shadow-xs'
                                    }`}>
                                        {msg.role === 'user' ? (
                                            msg.content
                                        ) : (
                                            <ReactMarkdown 
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({node, ...props}) => <p className="mb-3.5 last:mb-0 text-slate-750 leading-relaxed font-semibold text-[13.5px] sm:text-[14.5px]" {...props} />,
                                                    ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2.5 my-3.5 text-slate-600 font-semibold text-[13.5px] sm:text-[14.5px]" {...props} />,
                                                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-2.5 my-3.5 text-slate-650 font-semibold text-[13.5px] sm:text-[14.5px]" {...props} />,
                                                    li: ({node, ...props}) => <li className="marker:text-advent-sky" {...props} />,
                                                    strong: ({node, ...props}) => <strong className="font-extrabold text-advent-navy" {...props} />,
                                                    code: ({node, ...props}) => <code className="bg-slate-100 text-advent-navy px-1.5 py-0.5 rounded text-xs font-mono font-bold border border-slate-200/40" {...props} />,
                                                    h4: ({node, ...props}) => <h4 className="text-xs font-black uppercase tracking-wider text-advent-navy mt-5 mb-2.5 border-b border-slate-100 pb-1 flex items-center gap-1.5" {...props} />
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    {streamingText ? (
                                        // Render partial markdown as it arrives. An unclosed **bold**
                                        // mid-stream simply renders as literal asterisks for a moment,
                                        // which is far less jarring than a spinner that hides progress.
                                        <div className="bg-white border border-slate-100 shadow-sm p-4 rounded-2xl rounded-bl-none max-w-3xl prose prose-sm prose-slate">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {streamingText}
                                            </ReactMarkdown>
                                            <span className="inline-block w-1.5 h-4 bg-advent-navy/60 animate-pulse align-middle ml-0.5" aria-hidden="true" />
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-slate-100 shadow-sm p-4 rounded-2xl rounded-bl-none flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-advent-navy" />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Dr. QI is preparing advice...</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                      {/* Console Bottom Action Bar */}
                <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                    <div className="max-w-4xl mx-auto w-full space-y-3">
                        
                        {/* Real-time PHI Warning banner */}
                        {phiDetected && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 animate-in slide-in-from-bottom-2 duration-300">
                                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-red-700">PHI guard Warning Triggered</span>
                                    <p className="text-[10px] text-red-650 font-bold leading-normal">
                                        Potential Patient Identifiers detected in input. Please remove names, MRNs, dates of birth, or cell details before transmitting.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Citation pills container */}
                        {attachedPapers.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl mb-1 items-center animate-in slide-in-from-bottom-1 duration-200">
                                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 self-center mr-1">Evidence Context:</span>
                                {attachedPapers.map((paper) => (
                                    <div key={paper.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-3xs text-[10px] font-bold text-slate-700">
                                        <span className="truncate max-w-[180px]" title={paper.title}>
                                            {paper.authors.split(',')[0]} et al., {paper.date !== 'N/A' && paper.date ? paper.date.split('-')[0] : 'N/A'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setAttachedPapers(prev => prev.filter(p => p.id !== paper.id))}
                                            className="text-slate-400 hover:text-red-500 transition-all p-0.5 rounded cursor-pointer"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Input Controls */}
                        <form onSubmit={handleSend} className="flex flex-col sm:flex-row gap-2">
                            {userProjects.length > 0 && (
                                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-500 hover:border-advent-navy hover:text-advent-navy transition-all relative shrink-0">
                                    <Paperclip className="w-3.5 h-3.5 shrink-0" />
                                    <select
                                        value={attachedProjectId || ""}
                                        onChange={(e) => setAttachedProjectId(e.target.value || null)}
                                        className="bg-transparent border-none outline-none cursor-pointer pr-4 font-black w-full sm:w-36 text-[10px] uppercase truncate focus:ring-0"
                                        title="Attach active project context to this session"
                                    >
                                        <option value="">📎 Link Project...</option>
                                        {userProjects.map(p => (
                                            <option key={p.id} value={p.id}>{p.title}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => setShowSearchModal(true)}
                                className="flex items-center gap-1.5 bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-500 hover:border-advent-navy hover:text-advent-navy transition-all relative shrink-0 cursor-pointer"
                            >
                                <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>📚 Search Lit</span>
                            </button>

                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type a message or outline a QI concern to your mentor..."
                                disabled={isLoading}
                                className="flex-1 bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-advent-navy/10 focus:border-advent-navy transition-all placeholder:text-slate-400 placeholder:font-normal"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim() || phiDetected}
                                className="bg-advent-navy text-white px-4 py-3 rounded-xl hover:bg-advent-cobalt transition-all disabled:opacity-50 flex items-center justify-center shrink-0 shadow-3xs cursor-pointer"
                            >
                                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* EBM LITERATURE SEARCH MODAL OVERLAY */}
            {showSearchModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-advent-navy" />
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-advent-navy">Literature Search & Citation Injector</h3>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Query academic databases directly</span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowSearchModal(false);
                                    setEbmSearchQuery("");
                                    setEbmResults([]);
                                    setSearchError("");
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {/* Database Source Selection & Search Bar */}
                            <div className="space-y-2">
                                <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-slate-400">Select Registry Source:</span>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {(['pubmed', 'semanticscholar', 'openalex', 'clinicaltrials'] as const).map((src) => {
                                        const labels = {
                                            pubmed: 'PubMed (NCBI)',
                                            semanticscholar: 'Semantic Scholar',
                                            openalex: 'OpenAlex Works',
                                            clinicaltrials: 'ClinicalTrials.gov'
                                        };
                                        const isSelected = ebmSource === src;
                                        return (
                                            <button
                                                key={src}
                                                type="button"
                                                onClick={() => setEbmSource(src)}
                                                className={`py-2 px-3 text-[10px] font-black uppercase tracking-wider rounded-xl border text-center transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-advent-navy text-white border-advent-navy'
                                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-350'
                                                }`}
                                            >
                                                {labels[src]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-slate-400">Enter Search Query:</span>
                                <form onSubmit={(e) => { e.preventDefault(); handleEBMQuery(); }} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={ebmSearchQuery}
                                        onChange={(e) => setEbmSearchQuery(e.target.value)}
                                        placeholder="e.g., inpatient telemetry alarm fatigue, cancer pain sustain gains..."
                                        className="flex-1 bg-slate-50 border border-slate-250 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-advent-navy/10 focus:border-advent-navy transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSearching || !ebmSearchQuery.trim()}
                                        className="bg-advent-navy text-white px-4 py-2.5 rounded-xl hover:bg-advent-cobalt transition-all disabled:opacity-50 flex items-center justify-center shrink-0 shadow-3xs cursor-pointer text-xs font-black uppercase tracking-wider"
                                    >
                                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                                    </button>
                                </form>
                            </div>

                            {/* Error Banner */}
                            {searchError && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-xs font-semibold text-red-650">
                                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                                    <span>{searchError}</span>
                                </div>
                            )}

                            {/* Search Results */}
                            <div className="space-y-3">
                                {ebmResults.length > 0 ? (
                                    <>
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                            <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-slate-400">Search Results:</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select up to 3 papers</span>
                                        </div>
                                        <div className="space-y-3">
                                            {ebmResults.map((paper) => {
                                                const isAttached = attachedPapers.some(p => p.id === paper.id);
                                                return (
                                                    <div
                                                        key={paper.id}
                                                        onClick={() => togglePaperSelection(paper)}
                                                        className={`p-4 bg-white border rounded-2xl cursor-pointer transition-all hover:shadow-3xs ${
                                                            isAttached
                                                                ? 'border-advent-navy bg-advent-navy/5'
                                                                : 'border-slate-200/80 hover:border-slate-350'
                                                        }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={isAttached}
                                                                onChange={() => {}} // Controlled by parent div onClick
                                                                className="mt-1 rounded border-slate-300 text-advent-navy focus:ring-advent-navy shrink-0 cursor-pointer"
                                                            />
                                                            <div className="min-w-0 flex-1 space-y-1">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <h4 className="text-xs font-bold text-slate-800 leading-snug hover:text-advent-navy">
                                                                        {paper.title}
                                                                    </h4>
                                                                    {paper.url && (
                                                                        <a
                                                                            href={paper.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="text-slate-400 hover:text-advent-navy shrink-0 p-0.5 hover:bg-slate-50 rounded"
                                                                        >
                                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                                <p className="text-[10px] font-bold text-slate-550 truncate">
                                                                    {paper.authors}
                                                                </p>
                                                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-slate-400">
                                                                    <span>{paper.journal}</span>
                                                                    <span>•</span>
                                                                    <span>{paper.date !== 'N/A' && paper.date ? paper.date.split('-')[0] : 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    !isSearching && (
                                        <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                            <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">No articles retrieved yet</p>
                                            <p className="text-[10px] text-slate-400 mt-1 font-semibold max-w-xs mx-auto">Select a source registry above and input search queries to find clinical publications.</p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <span className="text-[10px] font-bold text-slate-400">
                                {attachedPapers.length} paper(s) attached
                            </span>
                            <button
                                onClick={() => {
                                    setShowSearchModal(false);
                                    setEbmSearchQuery("");
                                    setEbmResults([]);
                                    setSearchError("");
                                }}
                                className="px-4 py-2 bg-advent-navy text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-advent-cobalt transition-all cursor-pointer shadow-3xs"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
