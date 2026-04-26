"use client"

import { useState, useEffect } from "react";
import { Tag, Sparkles } from "lucide-react";
import { getSuggestedTags } from "@/utils/ai";

/** Extract clean tag tokens from any AI output format */
function parseTags(raw: string): string[] {
    // First try: extract all #Hashtag tokens
    const hashMatches = raw.match(/#[\w\-]+/g);
    if (hashMatches && hashMatches.length >= 2) {
        return hashMatches
            .map(t => t.replace('#', '').trim())
            .filter(t => t.length > 1 && t.length < 30)
            .slice(0, 6);
    }

    // Fallback: split by comma or newline, strip markdown junk, filter short/long noise
    const candidates = raw
        .split(/[,\n]+/)
        .map(t => t
            .replace(/^[\s\-\*\#\d\.]+/, '')   // strip leading bullets/numbers/markdown
            .replace(/[\*\_\`\[\]]/g, '')        // strip inline markdown chars
            .trim()
        )
        .filter(t => {
            const len = t.length;
            return len > 2 && len < 35 && !t.toLowerCase().includes('here are') && !t.toLowerCase().includes('keyword');
        })
        .slice(0, 6);
    return candidates;
}

export default function ProjectTags({ title, category }: { title: string, category: string }) {
    const [tags, setTags] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function fetchTags() {
            setIsLoading(true);
            try {
                const result = await getSuggestedTags(title, category);
                setTags(parseTags(result));
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
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase trac