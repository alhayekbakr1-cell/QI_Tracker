"use client"

import { Plus, Save, X } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function MetricEntryForm({ projectId }: { projectId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [month, setMonth] = useState("");
    const [value, setValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Try to parse month/year into YYYY-MM-DD
        // Example: "Jan 26" -> 2026-01-01
        let formattedDate = month;
        const monthMatch = month.match(/([a-zA-Z]{3})\s*(\d{2})/);
        if (monthMatch) {
            const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            const m = months.indexOf(monthMatch[1].toLowerCase());
            if (m !== -1) {
                const y = `20${monthMatch[2]}`;
                formattedDate = `${y}-${(m + 1).toString().padStart(2, '0')}-01`;
            }
        }

        const { error } = await supabase
            .from('metrics')
            .insert({
                project_id: projectId,
                month: formattedDate,
                value: parseFloat(value) / 100, // Convert percentage to decimal
                label: 'Success Rate'
            });

        setIsLoading(false);
        if (error) {
            alert(`Error: ${error.message} (Date: ${formattedDate})`);
        } else {
            setIsOpen(false);
            setMonth("");
            setValue("");
            router.refresh();
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-advent-blue/5 border border-advent-blue/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-advent-blue hover:bg-advent-blue/10 transition-all active:scale-95"
            >
                <Plus className="w-3.5 h-3.5" />
                Add Data Point
            </button>
        );
    }

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 relative animate-in fade-in zoom-in duration-200">
            <button
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
            >
                <X className="w-4 h-4" />
            </button>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Month</label>
                        <input
                            type="text"
                            placeholder="e.g., Jan 26"
                            required
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rate (%)</label>
                        <input
                            type="number"
                            placeholder="e.g., 45"
                            required
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue outline-none transition-all"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-advent-blue text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-advent-dark-blue transition-all shadow-lg shadow-advent-blue/20 disabled:opacity-50"
                >
                    <Save className="w-3.5 h-3.5" />
                    {isLoading ? 'Saving...' : 'Save Data Point'}
                </button>
            </form>
        </div>
    );
}
