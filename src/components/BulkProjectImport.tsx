"use client"

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { createClient } from '@/utils/supabase/client';
import { ProjectStatus } from '@/types';

export default function BulkProjectImport() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const supabase = createClient();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus(null);
        }
    };

    const processCSV = () => {
        if (!file) return;
        setIsProcessing(true);
        setStatus(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rawData = results.data as any[];

                // Validate headers (flexible matching)
                const requiredHeaders = ['title']; // Title is the minimum required
                const headers = Object.keys(rawData[0] || {}).map(h => h.toLowerCase().trim());
                const hasTitle = headers.some(h => h.includes('title'));

                if (!hasTitle) {
                    setStatus({
                        type: 'error',
                        message: `Invalid CSV format. "Title" column is required.`
                    });
                    setIsProcessing(false);
                    return;
                }

                try {
                    // Map CSV columns to database fields
                    const entries = rawData.map(row => {
                        // Find values regardless of case/whitespace in headers
                        const findValue = (possibleNames: string[]) => {
                            const key = Object.keys(row).find(k => 
                                possibleNames.includes(k.toLowerCase().trim())
                            );
                            return key ? row[key] : null;
                        };

                        const title = findValue(['title', 'project title', 'name']);
                        const status = findValue(['status', 'current status']);
                        const category = findValue(['category', 'type']);
                        const subcategory = findValue(['subcategory']);
                        const primaryOutcome = findValue(['primary outcome', 'outcome']);
                        const proponents = findValue(['proponents', 'team', 'leads']);
                        const faculty = findValue(['faculty', 'mentor']);
                        const updates = findValue(['updates', 'barriers', 'updates and barriers']);

                        // Clean proponents list
                        let proponentsArray: string[] = [];
                        if (proponents) {
                            proponentsArray = proponents.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean);
                        }

                        return {
                            title: title?.trim(),
                            status: (status || 'Idea') as ProjectStatus,
                            category: category || null,
                            subcategory: subcategory || null,
                            primary_outcome: primaryOutcome || null,
                            proponents: proponentsArray,
                            faculty: faculty || null,
                            updates_and_barriers: updates || null,
                            last_updated_date: new Date().toISOString()
                        };
                    }).filter(p => p.title); // Ensure title exists

                    // 1. Fetch existing projects to check for title conflicts manually
                    const { data: existingProjects, error: fetchError } = await supabase
                        .from('projects')
                        .select('id, title');

                    if (fetchError) throw fetchError;

                    const titleToId = new Map(existingProjects.map(p => [p.title.toLowerCase().trim(), p.id]));

                    const toUpdate = [];
                    const toInsert = [];

                    for (const entry of entries) {
                        const existingId = titleToId.get(entry.title.toLowerCase().trim());
                        if (existingId) {
                            toUpdate.push({ id: existingId, ...entry });
                        } else {
                            toInsert.push(entry);
                        }
                    }

                    // 2. Perform Batch Insert
                    if (toInsert.length > 0) {
                        const { error: insertError } = await supabase
                            .from('projects')
                            .insert(toInsert);
                        if (insertError) throw insertError;
                    }

                    // 3. Perform Individual/Batch Updates (Supabase doesn't support batch update with different values easily without onConflict)
                    // If we have many updates, we'll do them in parallel or sequentially
                    for (const updateEntry of toUpdate) {
                        const { error: updateError } = await supabase
                            .from('projects')
                            .update(updateEntry)
                            .eq('id', updateEntry.id);
                        if (updateError) throw updateError;
                    }

                    setStatus({
                        type: 'success',
                        message: `Successfully processed ${entries.length} projects (${toInsert.length} new, ${toUpdate.length} updated).`
                    });
                    setFile(null);
                } catch (err: any) {
                    console.error("Import error:", err);
                    setStatus({
                        type: 'error',
                        message: `Import failed: ${err.message || "Unknown error"}`
                    });
                } finally {
                    setIsProcessing(false);
                }
            },
            error: (error) => {
                setStatus({ type: 'error', message: `CSV Parsing Error: ${error.message}` });
                setIsProcessing(false);
            }
        });
    };

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-advent-navy text-white rounded-2xl">
                    <Upload className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-advent-navy tracking-tight">Bulk Project Import</h3>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Sync from QI Masterlist Excel</p>
                </div>
            </div>

            <div className="p-6 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center space-y-4">
                <FileText className="w-10 h-10 text-slate-300" />
                <div className="text-center px-4">
                    <p className="text-sm font-bold text-slate-600 truncate max-w-[200px]">
                        {file ? file.name : "Select Masterlist.csv"}
                    </p>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">
                        Requires: Title (Status, Category, Proponents optional)
                    </p>
                </div>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="project-csv-upload"
                />
                <label
                    htmlFor="project-csv-upload"
                    className="cursor-pointer px-6 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest hover:border-advent-navy transition-all shadow-sm"
                >
                    Browse Files
                </label>
            </div>

            {status && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                    }`}>
                    {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-xs font-bold">{status.message}</span>
                </div>
            )}

            <button
                onClick={processCSV}
                disabled={!file || isProcessing}
                className="w-full py-4 bg-advent-navy text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-advent-cobalt transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50"
            >
                {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Upload className="w-4 h-4" />
                )}
                {isProcessing ? 'Processing Masterlist...' : 'Sync Projects'}
            </button>
        </div>
    );
}
