"use client"

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { improveWriting } from "@/utils/ai";

interface SmartTextareaProps {
    name: string;
    label: string;
    placeholder?: string;
    defaultValue?: string;
    rows?: number;
    required?: boolean;
    className?: string;
    labelClassName?: string;
    context?: string; // Hint for AI about what this field represents
}

export default function SmartTextarea({
    name,
    label,
    placeholder,
    defaultValue = "",
    rows = 3,
    required = false,
    className,
    labelClassName,
    context,
}: SmartTextareaProps) {
    const [value, setValue] = useState(defaultValue);
    const [isImproving, setIsImproving] = useState(false);

    const handleImprove = async () => {
        if (!value || value.trim().length < 10) {
            alert("Please enter at least a few words before improving the writing.");
            return;
        }
        setIsImproving(true);
        try {
            const improved = await improveWriting(value, context || label);
            setValue(improved);
        } catch (e: any) {
            alert("AI Error: " + (e.message || "Unknown error"));
        } finally {
            setIsImproving(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-end ml-1">
                <label className={labelClassName || "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]"}>
                    {label}
                </label>
                <button
                    type="button"
                    onClick={handleImprove}
                    disabled={isImproving}
                    title="Improve writing with AI"
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-violet-600 bg-violet-50 px-2.5 py-1.5 rounded-lg hover:bg-violet-100 transition-all border border-violet-100 disabled:opacity-50"
                >
                    {isImproving
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Sparkles className="w-3 h-3" />
                    }
                    {isImproving ? "Improving..." : "Improve"}
                </button>
            </div>
            <textarea
                name={name}
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                required={required}
                className={className || "w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all resize-none placeholder:text-slate-300"}
            />
        </div>
    );
}
