"use client"

import { useState, useRef } from 'react';
import { Copy, X, Mail, Check, AlertTriangle } from 'lucide-react';
import { Project } from "@/types";

interface NudgeModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    recipientEmail: string;
    emailSubject: string;
    emailBody: string;
}

export default function NudgeModal({ isOpen, onClose, project, recipientEmail, emailSubject, emailBody }: NudgeModalProps) {
    const [copiedEmail, setCopiedEmail] = useState(false);
    const [copiedBody, setCopiedBody] = useState(false);

    // We decode the URI components for display
    const rawSubject = decodeURIComponent(emailSubject);
    const rawBody = decodeURIComponent(emailBody);

    if (!isOpen) return null;

    const copyToClipboard = async (text: string, type: 'email' | 'body') => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'email') {
                setCopiedEmail(true);
                setTimeout(() => setCopiedEmail(false), 2000);
            } else {
                setCopiedBody(true);
                setTimeout(() => setCopiedBody(false), 2000);
            }
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const handleLaunchOutlook = () => {
        window.location.href = `mailto:${recipientEmail}?subject=${emailSubject}&body=${emailBody}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-advent-blue p-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        <h3 className="font-bold text-lg">Nudge Project Leads</h3>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex gap-2 items-start">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>
                            We've prepared an email for you. Click <strong>Launch Outlook</strong> below.
                            If nothing happens, copy the details manually.
                        </p>
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">To (Recipients)</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={recipientEmail}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-700 focus:outline-advent-blue"
                            />
                            <button
                                onClick={() => copyToClipboard(recipientEmail, 'email')}
                                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg transition-colors"
                                title="Copy Email"
                            >
                                {copiedEmail ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Body Preview */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Message Preview</label>
                            <button
                                onClick={() => copyToClipboard(rawBody, 'body')}
                                className="text-xs text-advent-blue hover:underline flex items-center gap-1"
                            >
                                {copiedBody ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copiedBody ? "Copied!" : "Copy Message"}
                            </button>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600 font-mono whitespace-pre-wrap h-32 overflow-y-auto">
                            {rawBody}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleLaunchOutlook}
                        className="flex items-center gap-2 bg-advent-blue hover:bg-advent-blue/90 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
                    >
                        <Mail className="w-4 h-4" />
                        Launch Outlook
                    </button>
                </div>
            </div>
        </div>
    );
}
