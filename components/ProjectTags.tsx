"use client"

import { useState, useEffect } from "react";
import { Tag, Sparkles } from "lucide-react";
import { getSuggestedTags } from "@/utils/ai";

export default function ProjectTags({ title, category }: { title: string, category: string }) {
    const [tags, setTags] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function fetchTags() {
            if (!title) return;
            setIsLoading(true);
            try {
                // getSuggestedTags now returns a clean string[] directly via JSON mode
                const result = await getSuggestedTags(title, category);
                setTags(result);
            } catch (e) {
                console.error("Tagging error:", e);
            } finally {
                setIsLoading(false);
            }
        }
        fetchTags();
    }, [title, category]);

    if (!isLoading && tags.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-4">
            {isLoading ? (
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    Generating tags...
                </div>
            ) : (
                tags.map((tag, i) => (
                    <span
                        key={i}
                        className="inline-flex items-center gap-1.5 bg-advent-blue/10 text-advent-blue border border-advent-blue/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-advent-blue/20 transition-colors cursor-default"
                    >
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                    </span>
                ))
            )}
        </div>
    );
}