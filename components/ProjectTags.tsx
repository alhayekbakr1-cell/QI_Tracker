"use client"

import { useState, useEffect } from "react";
import { Tag, Sparkles } from "lucide-react";
import { getSuggestedTags } from "@/utils/ai";

export default function ProjectTags({ title, category }: { title: string, category: string }) {
    const [tags, setTags] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function fetchTags() {
            setIsLoading(true);
            try {
                const result = await getSuggestedTags(title, category);
                setTags(result.split(',').map((t: string) => t.trim()));
            } catch (e) {
                console.error("Tagging error:", e);
            } finally {
                setIsLoading(false);
            }
        }
        fetchTags();
    }, [title, category]);

    return (
        <div className="flex flex-wrap gap-2 mt-4">
            {isLoading ? (
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest animate-pulse">
                    <Tag className="w-3 h-3" />
                    Sourcing tags...
                </div>
            ) : (
                tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-advent-navy/5 text-advent-navy border border-advent-navy/10 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-advent-navy/10 transition-colors cursor-default">
                        <Tag className="w-3 h-3 text-advent-navy/40" />
                        {tag}
                    </span>
                ))
            )}
            {tags.length > 0 && !isLoading && (
                <div className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest ml-1 self-center" title="AI Generated">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI
                </div>
            )}
        </div>
    );
}
