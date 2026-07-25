import React from 'react';

export default function SkeletonProjectCard() {
    return (
        <div className="group academic-card p-6 flex flex-col h-full relative overflow-hidden bg-white border border-slate-200/60 shadow-sm rounded-3xl animate-pulse">
            {/* Top Badges area skeleton */}
            <div className="flex items-center gap-1.5 mb-4">
                <div className="h-6 w-20 bg-slate-200 rounded-md"></div>
                <div className="h-6 w-16 bg-slate-200 rounded-md"></div>
            </div>

            {/* Title skeleton */}
            <div className="space-y-2 mb-4">
                <div className="h-5 bg-slate-200 rounded-md w-3/4"></div>
                <div className="h-5 bg-slate-200 rounded-md w-1/2"></div>
            </div>

            {/* Progress bar skeleton */}
            <div className="mb-4 mt-2">
                <div className="flex items-center justify-between mb-1">
                    <div className="h-3 w-24 bg-slate-200 rounded-sm"></div>
                    <div className="h-3 w-8 bg-slate-200 rounded-sm"></div>
                </div>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-200 w-full"></div>
                </div>
            </div>

            {/* Bottom info skeleton */}
            <div className="mt-auto space-y-3.5 pt-4 border-t border-slate-100/80">
                <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 bg-slate-200 rounded-full"></div>
                    <div className="h-3 w-32 bg-slate-200 rounded-sm"></div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 bg-slate-200 rounded-sm"></div>
                        <div className="h-3 w-20 bg-slate-200 rounded-sm"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
