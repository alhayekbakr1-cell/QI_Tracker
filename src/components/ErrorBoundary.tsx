"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an uncaught exception:", error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 rounded-3xl bg-rose-500/10 blur-xl animate-pulse" />
                        <div className="relative w-16 h-16 bg-rose-50 border border-rose-100 rounded-3xl flex items-center justify-center text-rose-600 shadow-md">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                        Clinical Portal Suspended
                    </h2>
                    <p className="text-sm text-slate-500 max-w-md font-semibold leading-relaxed mb-8">
                        An unexpected client-side error occurred while rendering this interface. Your data safety and session security remain active.
                    </p>

                    <div className="w-full max-w-lg bg-slate-50 border border-slate-200/85 rounded-3xl p-6 mb-8 text-left shadow-inner">
                        <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnostic Details</span>
                            <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded text-[8px] font-black border border-rose-100 uppercase tracking-tighter">System Error</span>
                        </div>
                        <pre className="text-xs text-rose-600 font-mono overflow-x-auto whitespace-pre-wrap leading-normal font-semibold max-h-32">
                            {this.state.error?.toString() || "Unknown rendering exception"}
                        </pre>
                    </div>

                    <button
                        onClick={this.handleReset}
                        className="flex items-center gap-2 bg-advent-navy hover:bg-advent-cobalt text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-advent-navy/10 active:scale-95 transition-all cursor-pointer"
                    >
                        <RefreshCw className="w-4 h-4 text-white" />
                        Reload Interface
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
