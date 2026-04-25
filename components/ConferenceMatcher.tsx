"use client"

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Trophy, ExternalLink, ChevronRight, Loader2 } from 'lucide-react';
import { DEFAULT_CONFERENCES, fetchRegistry, Conference, getNextDeadline } from '@/constants/conferences';
import { format, differenceInDays } from 'date-fns';

export default function ConferenceMatcher() {
    const [registry, setRegistry] = useState<Conference[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await fetchRegistry();
                setRegistry(data);
            } catch (error) {
                console.error('Failed to load conference registry:', error);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    if (isLoading) {
        return (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
        );
    }

    const conferences = registry.length > 0 ? registry : DEFAULT_CONFERENCES;

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500 text-white rounded-2xl">
                    <Trophy className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-advent-navy tracking-tight">Conference Matcher</h3>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Upcoming Academic Deadlines</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {conferences.map((conf, idx) => {
                    const deadline = getNextDeadline(conf);
                    const daysLeft = differenceInDays(deadline, new Date());
                    const isUrgent = daysLeft < 30;

                    return (
                        <div key={idx} className="group p-5 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-sm font-black text-slate-900 group-hover:text-amber-700 transition-colors uppercase tracking-tight">{conf.name}</h4>
                                <a href={conf.website} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white rounded-lg text-slate-300 hover:text-advent-navy border border-slate-100 shadow-sm transition-all">
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>

                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {format(deadline, 'MMM dd, yyyy')}
                                </span>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${isUrgent ? 'bg-rose-100 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-600'
                                    }`}>
                                    <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'animate-pulse' : ''}`} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        {daysLeft} Days Remaining
                                    </span>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-advent-navy opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    Target from Project Detail <ChevronRight className="w-3 h-3" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="pt-2">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
                    Submit your abstract through the ORA Portal.
                </p>
            </div>
        </div>
    );
}
