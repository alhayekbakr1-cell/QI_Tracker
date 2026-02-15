"use client"

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { createClient } from '@/utils/supabase/client';
import { UserRole } from '@/types';

export default function BulkPersonnelImport() {
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
                const data = results.data as any[];

                // Validate headers
                const requiredHeaders = ['name', 'email'];
                const headers = Object.keys(data[0] || {});
                const hasHeaders = requiredHeaders.every(h => headers.includes(h));

                if (!hasHeaders) {
                    setStatus({
                        type: 'error',
                        message: `Invalid CSV format. Required headers: ${requiredHeaders.join(', ')}`
                    });
                    setIsProcessing(false);
                    return;
                }

                try {
                    // Map data to database schema
                    const entries = data.map(row => ({
                        name: row.name.trim(),
                        email: row.email.trim().toLowerCase(),
                        role: (row.role as UserRole) || 'Viewer'
                    }));

                    // Batch upsert into directory table
                    // We use name as the conflict target since it has a unique constraint in the DB
                    const { error } = await supabase
                        .from('directory')
                        .upsert(entries, { onConflict: 'name' });

                    if (error) throw error;

                    setStatus({
                        type: 'success',
                        message: `Successfully imported ${entries.length} personnel entries.`
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
                    <h3 className="text-xl font-black text-advent-navy tracking-tight">Bulk Directory Import</h3>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Update Resident & Faculty Gatekeeper</p>
                </div>
            </div>

            <div className="p-6 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center space-y-4">
                <FileText className="w-10 h-10 text-slate-300" />
                <div className="text-center">
                    <p className="text-sm font-bold text-slate-600">
                        {file ? file.name : "Select directory_rows.csv or similar"}
                    </p>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">
                        Required Columns: Name, Email
                    </p>
                </div>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                />
                <label
                    htmlFor="csv-upload"
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
                {isProcessing ? 'Processing Batch...' : 'Import Personnel'}
            </button>
        </div>
    );
}
