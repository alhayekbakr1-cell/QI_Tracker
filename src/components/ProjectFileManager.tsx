"use client"

import { useState, useEffect } from "react";
import {
    Paperclip,
    Upload,
    Trash2,
    Loader2,
    FileText,
    File,
    Download,
    ExternalLink,
    Plus,
    FileSpreadsheet,
    FileImage,
    AlertCircle
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { ProjectFile, Profile } from "@/types";
import { format } from "date-fns";
import { useMsal } from "@azure/msal-react";
import { uploadToSharedFolder } from "@/utils/oneDrive";
import { uploadProjectFile, downloadProjectFile } from "@/utils/projectStorage";

interface ProjectFileManagerProps {
    projectId: string;
    projectName?: string;
    currentUserProfile: Profile | null;
}

export default function ProjectFileManager({ projectId, projectName, currentUserProfile }: ProjectFileManagerProps) {
    const [files, setFiles] = useState<ProjectFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    const [linkName, setLinkName] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const supabase = createClient();
    const { instance, accounts } = useMsal();

    useEffect(() => {
        fetchFiles();
    }, [projectId]);

    const fetchFiles = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('project_files')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (!error) {
            setFiles((data || []) as ProjectFile[]);
        }
        setIsLoading(false);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            setUploading(true);

            // 1. Store in-app first. This is the copy the mentor and the programme
            // can actually retrieve; OneDrive below is best-effort and is regularly
            // blocked, which previously failed the whole upload.
            const { storagePath } = await uploadProjectFile(projectId, file.name, file, file.type);

            // 2. Mirror to the shared OneDrive folder where that is available.
            let finalUrl = "";
            try {
                const res = await uploadToSharedFolder(
                    instance,
                    accounts[0],
                    projectName || projectId,
                    file.name,
                    file,
                    file.type
                );
                finalUrl = res.url;
            } catch (err) {
                console.warn("OneDrive mirror skipped:", err);
            }

            // 3. Save file reference in project_files table
            const { data: dbData, error: dbError } = await supabase
                .from('project_files')
                .insert([{
                    project_id: projectId,
                    file_name: file.name,
                    file_type: file.name.split('.').pop() || null,
                    file_url: finalUrl || null,
                    storage_path: storagePath,
                    uploaded_by: currentUserProfile?.id || null,
                    uploaded_by_name: currentUserProfile?.full_name || null
                }])
                .select()
                .single();

            if (dbError) {
                throw new Error(`Database record failed: ${dbError.message}`);
            }

            // 5. Trigger an audit log entry for this upload
            await supabase.from('audit_logs').insert({
                project_id: projectId,
                user_id: currentUserProfile?.id,
                field_name: 'project_file',
                old_value: null,
                new_value: file.name,
                action: 'INSERT'
            });

            if (dbData) {
                setFiles([dbData as ProjectFile, ...files]);
            }

            alert("File uploaded successfully to OneDrive!");
        } catch (error) {
            console.error('Error uploading file:', error);
            alert(error instanceof Error ? error.message : 'Error uploading file!');
        } finally {
            setUploading(false);
        }
    };

    const handleLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!linkName || !linkUrl || uploading) return;

        setUploading(true);
        try {
            const { data: dbData, error: dbError } = await supabase
                .from('project_files')
                .insert([{
                    project_id: projectId,
                    file_name: linkName.trim(),
                    file_type: 'link',
                    file_url: linkUrl.trim(),
                    uploaded_by: currentUserProfile?.id || null,
                    uploaded_by_name: currentUserProfile?.full_name || null
                }])
                .select()
                .single();

            if (dbError) throw dbError;

            // Trigger audit log
            await supabase.from('audit_logs').insert({
                project_id: projectId,
                user_id: currentUserProfile?.id,
                field_name: 'project_file_link',
                old_value: null,
                new_value: linkName.trim(),
                action: 'INSERT'
            });

            if (dbData) {
                setFiles([dbData as ProjectFile, ...files]);
                setLinkName("");
                setLinkUrl("");
                setIsLinking(false);
            }
        } catch (error) {
            console.error('Error linking asset:', error);
            alert('Error linking resource URL!');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (fileId: string, fileName: string) => {
        if (!confirm(`Are you sure you want to remove "${fileName}"?`)) return;

        const { error } = await supabase
            .from('project_files')
            .delete()
            .eq('id', fileId);

        if (!error) {
            // Trigger audit log for delete
            await supabase.from('audit_logs').insert({
                project_id: projectId,
                user_id: currentUserProfile?.id,
                field_name: 'project_file_delete',
                old_value: fileName,
                new_value: null,
                action: 'DELETE'
            });

            setFiles(files.filter(f => f.id !== fileId));
        } else {
            alert(`Error deleting file reference: ${error.message}`);
        }
    };

    const getFileIcon = (type: string | null) => {
        if (!type) return <File className="w-5 h-5 text-slate-400" />;
        const lowercaseType = type.toLowerCase();
        
        if (lowercaseType === 'pdf') return <FileText className="w-5 h-5 text-red-500" />;
        if (['docx', 'doc'].includes(lowercaseType)) return <FileText className="w-5 h-5 text-blue-500" />;
        if (['xlsx', 'xls', 'csv'].includes(lowercaseType)) return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
        if (['pptx', 'ppt'].includes(lowercaseType)) return <FileText className="w-5 h-5 text-amber-500" />;
        if (['png', 'jpg', 'jpeg', 'svg', 'gif'].includes(lowercaseType)) return <FileImage className="w-5 h-5 text-violet-500" />;
        if (lowercaseType === 'link') return <ExternalLink className="w-5 h-5 text-advent-blue" />;
        
        return <File className="w-5 h-5 text-slate-400" />;
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-advent-blue" />
                    Resource Attachments
                </h3>
                <div className="flex items-center gap-2">
                    {!isLinking && (
                        <>
                            <button
                                onClick={() => setIsLinking(true)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border border-slate-200 active:scale-95"
                            >
                                Link URL
                            </button>
                            <label className={`
                                cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95
                                ${uploading ? 'bg-slate-100 text-slate-400' : 'bg-advent-blue text-white hover:bg-advent-navy shadow-sm'}
                            `}>
                                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                Upload
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </>
                    )}
                </div>
            </div>

            <div className="p-6 space-y-4">
                {isLinking && (
                    <form onSubmit={handleLinkSubmit} className="bg-slate-50 border border-advent-blue/20 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                                Link Label
                            </label>
                            <input
                                autoFocus
                                type="text"
                                placeholder="e.g. IRB Approval Letter"
                                value={linkName}
                                onChange={e => setLinkName(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-advent-blue/10"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                                Destination URL
                            </label>
                            <input
                                type="url"
                                placeholder="https://..."
                                value={linkUrl}
                                onChange={e => setLinkUrl(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-advent-blue/10"
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setIsLinking(false)}
                                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={uploading || !linkName || !linkUrl}
                                className="flex items-center gap-1 px-4 py-1.5 bg-advent-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-advent-navy disabled:opacity-50 transition-all"
                            >
                                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                Add Link
                            </button>
                        </div>
                    </form>
                )}

                {isLoading ? (
                    <div className="flex justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-slate-200" />
                    </div>
                ) : files.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                        <Paperclip className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No attachments yet</p>
                        <p className="text-[9px] text-slate-300 mt-1">Upload key files or share links for resources</p>
                    </div>
                ) : (
                    <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                        {files.map(file => (
                            <div
                                key={file.id}
                                className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group bg-white"
                            >
                                <div className="flex-shrink-0 bg-slate-50 p-2 rounded-xl group-hover:scale-105 transition-transform">
                                    {getFileIcon(file.file_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-800 truncate" title={file.file_name}>
                                        {file.file_name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[9px] text-slate-400 font-semibold">
                                        <span>{file.uploaded_by_name || "Unknown"}</span>
                                        <span>•</span>
                                        <span>{format(new Date(file.created_at), 'MMM d, yyyy')}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    {/* The bucket is private, so there is no permanent link:
                                        a signed URL is minted per click. Falls back to the
                                        OneDrive link for files stored before in-app storage. */}
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                if ((file as any).storage_path) {
                                                    await downloadProjectFile((file as any).storage_path, file.file_name);
                                                } else if (file.file_url) {
                                                    window.open(file.file_url, "_blank", "noopener");
                                                } else {
                                                    alert("This file has no stored copy. Please re-upload it.");
                                                }
                                            } catch (err: any) {
                                                alert(err?.message || "Could not open that file.");
                                            }
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-advent-blue hover:bg-slate-50 rounded-lg transition-all"
                                        title="View/Download"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                    </button>

                                    {(currentUserProfile?.role === 'Admin' || currentUserProfile?.role === 'Faculty' || file.uploaded_by === currentUserProfile?.id) && (
                                        <button
                                            onClick={() => handleDelete(file.id, file.file_name)}
                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
