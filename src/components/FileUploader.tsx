"use client"

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Upload, FileCheck, Loader2 } from "lucide-react";

interface FileUploaderProps {
    projectId: string;
    fieldName: "protocol_url" | "presentation_url";
    onUploadComplete: (url: string) => void;
    currentUrl?: string | null;
}

export default function FileUploader({ projectId, fieldName, onUploadComplete, currentUrl }: FileUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const supabase = createClient();

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            setUploading(true);

            const fileExt = file.name.split('.').pop();
            const filePath = `${projectId}/${fieldName}_${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('project-documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('project-documents')
                .getPublicUrl(filePath);

            // Update database
            const { error: updateError } = await supabase
                .from('projects')
                .update({ [fieldName]: publicUrl })
                .eq('id', projectId);

            if (updateError) throw updateError;

            onUploadComplete(publicUrl);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error uploading file!');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                {fieldName === "protocol_url" ? "QI Protocol" : "QI Presentation"}
            </label>

            <div className="flex items-center gap-3 p-3 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                {currentUrl ? (
                    <div className="flex items-center gap-2 text-advent-blue font-bold text-sm">
                        <FileCheck className="w-5 h-5 text-emerald-500" />
                        Uploaded
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-sm italic">
                        Missing
                    </div>
                )}

                <div className="flex-1" />

                <label className={`
                    cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-widest transition-all
                    ${uploading ? 'bg-slate-100 text-slate-400' : 'bg-advent-blue/10 text-advent-blue hover:bg-advent-blue/20'}
                `}>
                    {uploading ? (
                        <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload className="w-3 h-3" />
                            {currentUrl ? "Replace" : "Upload"}
                        </>
                    )}
                    <input
                        type="file"
                        className="hidden"
                        accept={fieldName === "protocol_url" ? ".docx,.pdf" : ".pptx,.pdf"}
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                </label>
            </div>
        </div>
    );
}
