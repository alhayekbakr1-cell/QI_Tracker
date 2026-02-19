"use client"

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, Loader2, Bot } from "lucide-react";
import { getQIAdvice } from "@/utils/ai";
import { scanForPHI } from "@/utils/phi_guard";
import { AlertCircle } from "lucide-react";

export default function QIConsultantChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
        { role: 'ai', content: "Hello! I am your QI Academic Consultant. How can I help you with your project methodology today?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const advice = await getQIAdvice(userMessage);
            setMessages(prev => [...prev, { role: 'ai', content: advice }]);
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'ai', content: "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="mb-4 w-[350px] h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="p-4 bg-advent-navy text-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 p-1.5 rounded-lg">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-widest">QI Consultant</h4>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-bold text-emerald-100/70">AI Active</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm font-medium leading-relaxed ${msg.role === 'user'
                                    ? 'bg-advent-blue text-white rounded-br-none'
                                    : 'bg-white text-slate-700 border border-slate-100 shadow-sm rounded-bl-none'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-100 shadow-sm p-3 rounded-2xl rounded-bl-none">
                                    <Loader2 className="w-4 h-4 animate-spin text-advent-blue" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* PHI Warning */}
                    {input.length > 5 && scanForPHI(input).length > 0 && (
                        <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex items-center gap-2 animate-in slide-in-from-bottom-2">
                            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-[9px] font-bold text-red-700 uppercase">Potential PHI Detected in input</span>
                        </div>
                    )}

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a QI question..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-advent-blue/20 focus:border-advent-blue font-medium transition-all"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="bg-advent-navy text-white p-2 rounded-xl hover:bg-advent-cobalt transition-all disabled:opacity-50"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${isOpen ? 'bg-white text-slate-400 rotate-90' : 'bg-advent-navy text-white'
                    }`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </button>
        </div>
    );
}
