"use client"

import { Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

import { PROJECT_CATEGORIES, PROJECT_STATUSES } from "@/constants/projectData";

export default function ProjectFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }

        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
                <Search className={`absolute left-3 top-2.5 w-4 h-4 transition-colors ${isPending ? 'text-advent-blue animate-pulse' : 'text-slate-400'}`} />
                <input
                    type="text"
                    placeholder="Search by title..."
                    defaultValue={searchParams.get('q') || ''}
                    onChange={(e) => updateFilter('q', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue outline-none transition-all"
                />
            </div>

            <div className="relative flex-1 min-w-[200px]">
                <Search className={`absolute left-3 top-2.5 w-4 h-4 transition-colors ${isPending ? 'text-advent-blue animate-pulse' : 'text-slate-400'}`} />
                <input
                    type="text"
                    placeholder="Search by Faculty..."
                    defaultValue={searchParams.get('faculty') || ''}
                    onChange={(e) => updateFilter('faculty', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue outline-none transition-all"
                />
            </div>

            <div className="relative flex-1 min-w-[200px]">
                <Search className={`absolute left-3 top-2.5 w-4 h-4 transition-colors ${isPending ? 'text-advent-blue animate-pulse' : 'text-slate-400'}`} />
                <input
                    type="text"
                    placeholder="Search by Lead..."
                    defaultValue={searchParams.get('lead') || ''}
                    onChange={(e) => updateFilter('lead', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue outline-none transition-all"
                />
            </div>

            <div className="flex items-center gap-2">
                <select
                    defaultValue={searchParams.get('status') || ''}
                    onChange={(e) => updateFilter('status', e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold px-3 py-2 outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue transition-all cursor-pointer"
                >
                    <option value="">All Statuses</option>
                    {PROJECT_STATUSES.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                </select>

                <select
                    defaultValue={searchParams.get('category') || ''}
                    onChange={(e) => updateFilter('category', e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold px-3 py-2 outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue transition-all cursor-pointer"
                >
                    <option value="">All Categories</option>
                    {PROJECT_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
