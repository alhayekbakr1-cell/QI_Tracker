"use client"

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Upload, FileCheck, Loader2 } from "lucide-react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/utils/auth/msalConfig";

interface FileUploaderProps {
    projectId: string;
    fieldName: "protocol_url" | "presentation_url";
    onUploadComplete: (url: string) => void;
    currentUrl?: string | null;
}

export default function FileUploader({ projectId, fieldName, onUploadComplete, currentUrl }: FileUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const supabase = createClient();
    const { instance, accounts } = useMsal();

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            if (file.size > 25 * 1024 * 1024) {
                alert("File is too large! Maximum limit is 25MB.");
                return;
            }

            setUploading(true);

            // 1. Get MSAL Token
            let accessToken;
            if (accounts.length === 0) {
                const loginResponse = await instance.loginPopup(loginRequest);
                accessToken = loginResponse.accessToken;
            } else {
                const request = {
                    ...loginRequest,
                    account: accounts[0]
                };
                try {
                    const response = await instance.acquireTokenSilent(request);
                    accessToken = response.accessToken;
                } catch (err) {
                    const loginResponse = await instance.loginPopup(loginRequest);
                    accessToken = loginResponse.accessToken;
                }
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${fieldName}_${Date.now()}.${fileExt}`;
            const filePath = `QI_Tracker/${projectId}/${fileName}`;

            // 2. Upload to OneDrive via Graph API
            const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${filePath}:/content`;
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': file.type || 'application/octet-stream'
                },
                body: file
            });

            if (!uploadResponse.ok) {
                const err = await uploadResponse.json();
                throw new Error(`Graph API error: ${err.error?.message || 'Upload failed'}`);
            }

            const driveItem = await uploadResponse.json();

            // 3. Create shareable link
            const shareUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${driveItem.id}/createLink`;
            const shareResponse = await fetch(shareUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'view',
                    scope: 'anonymous'
                })
            });

            if (!shareResponse.ok) {
                const err = await shareResponse.json();
                throw new Error(`Graph API link creation error: ${err.error?.message || 'Link failed'}`);
            }

            const shareData = await shareResponse.json();
            const publicUrl = shareData.link.webUrl;

            // 4. Update Supabase
            const { error: updateError } = await supabase
                .from('projects')
                .update({ [fieldName]: publicUrl })
                .eq('id', projectId);

            if (updateError) {
                console.error('Database update error:', updateError);
                throw new Error(`Database error: ${updateError.message}`);
            }

            onUploadComplete(publicUrl);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert(error instanceof Error ? error.message : 'Error uploading file!');
        } finally {
            setUploading(false);
        }
    };

    const handleLinkSubmit = async () => {
        if (!linkUrl) return;
        setUploading(true);
        try {
            const { error: updateError } = await supabase
                .from('projects')
                .update({ [fieldName]: linkUrl })
                .eq('id', projectId);

            if (updateError) throw updateError;
            onUploadComplete(linkUrl);
            setIsLinking(false);
            setLinkUrl("");
        } catch (error) {
            console.error('Error linking file:', error);
            alert('Error linking URL!');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                {fieldName === "protocol_url" ? "QI Protocol" : "QI Presentation"}
            </label>

            <div className="flex flex-col gap-3 p-4 border border-slate-200 rounded-2xl bg-white shadow-sm">
                <div className="flex items-center gap-3">
                    {currentUrl ? (
                        <div className="flex items-center gap-2 text-advent-navy font-bold text-sm">
                            <div className="bg-emerald-500/10 p-1.5 rounded-lg">
                                <FileCheck className="w-5 h-5 text-emerald-500" />
                            </div>
                            <span>
                                {currentUrl.includes('supabase.co') ? 'Filesystem Asset' : 'External Link'}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-300 font-bold text-sm italic">
                            <div className="bg-slate-50 p-1.5 rounded-lg text-slate-300">
                                <Upload className="w-5 h-5" />
                            </div>
                            Missing
                        </div>
                    )}

                    <div className="flex-1" />

                    <div className="flex gap-2">
                        {!isLinking && (
                            <>
                                <button
                                    onClick={() => setIsLinking(true)}
                                    className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200"
                                >
                                    Link URL
                                </button>
                                <label className={`
                                    cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                                    ${uploading ? 'bg-slate-100 text-slate-400' : 'bg-advent-navy text-white hover:bg-advent-cobalt shadow-lg shadow-advent-navy/10'}
                                `}>
                                    {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                    {currentUrl ? "Replace File" : "Upload File"}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept={fieldName === "protocol_url" ? ".docx,.pdf" : ".pptx,.pdf"}
                                        onChange={handleUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            </>
                        )}
                    </div>
                </div>

                {isLinking && (
                    <div className="flex flex-col gap-3 animate-in zoom-in-95 duration-200">
                        <input
                            type="url"
                            placeholder="Paste OneDrive or Shareable link here..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-advent-navy/5 outline-none"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsLinking(false)}
                                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLinkSubmit}
                                disabled={!linkUrl || uploading}
                                className="px-6 py-2 bg-advent-navy text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-advent-cobalt disabled:opacity-50"
                            >
                                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save Link"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
