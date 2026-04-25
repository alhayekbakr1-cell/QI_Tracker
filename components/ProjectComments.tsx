"use client"

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Trash2, Loader2 } from 'lucide-react';
import { Comment, Profile, Project } from '@/types';
import { createClient } from '@/utils/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { getProfileDetails, sendEmailNotification } from '@/utils/notifications';

interface ProjectCommentsProps {
    projectId: string;
    currentUserProfile: Profile | null;
}

export default function ProjectComments({ projectId, currentUserProfile }: ProjectCommentsProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchComments();
    }, [projectId]);

    const fetchComments = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (!error) {
            setComments(data as Comment[]);
        }
        setIsLoading(false);
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUserProfile || isPosting) return;

        setIsPosting(true);
        const { data, error } = await supabase
            .from('comments')
            .insert([{
                project_id: projectId,
                user_id: currentUserProfile.id,
                content: newComment.trim()
            }])
            .select()
            .single();

        if (!error && data) {
            setComments([...comments, data as Comment]);
            setNewComment('');

            // TRIGGER NOTIFICATION
            try {
                // 1. Fetch project details to get title and participants
                const { data: project } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('id', projectId)
                    .single();

                if (project) {
                    const typedProject = project as Project;

                    // 2. Identify recipients
                    // If Faculty posts, notify lead proponents
                    // If Resident posts, notify faculty
                    let recipientIds: string[] = [];
                    if (currentUserProfile.role === 'Faculty' || currentUserProfile.role === 'Admin') {
                        recipientIds = typedProject.lead_proponent_ids || [];
                    } else {
                        if (typedProject.faculty_id) recipientIds = [typedProject.faculty_id];
                    }

                    if (recipientIds.length > 0) {
                        const recipients = await getProfileDetails(recipientIds);

                        for (const recipient of recipients) {
                            await sendEmailNotification({
                                to_email: recipient.email,
                                to_name: recipient.name,
                                subject: `New Guidance for project: ${typedProject.title}`,
                                message: `"${newComment.trim()}" — ${currentUserProfile.full_name || 'A Mentor'}`,
                                project_title: typedProject.title,
                                action_url: `${window.location.origin}/projects/view?id=${projectId}`
                            });
                        }
                    }
                }
            } catch (notifyError) {
                console.error('Notification trigger error:', notifyError);
            }
        }
        setIsPosting(false);
    };

    const handleDeleteComment = async (commentId: string) => {
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId);

        if (!error) {
            setComments(comments.filter(c => c.id !== commentId));
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-advent-blue" />
                    Project Guidance
                </h3>
                <span className="text-[10px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100 italic">
                    Zero PHI Zone
                </span>
            </div>

            <div className="p-6">
                <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No communication yet</p>
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="flex gap-4 group">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                                    <User className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">
                                            {comment.user_id === currentUserProfile?.id ? 'You' : 'Anonymous Resident/Faculty'}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] text-slate-400 font-medium">
                                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                            </span>
                                            {comment.user_id === currentUserProfile?.id && (
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100">
                                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <form onSubmit={handlePostComment} className="relative">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Leave guidance or update... (Do not enter patient data)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pr-12 text-xs font-medium focus:ring-2 focus:ring-advent-blue/10 outline-none min-h-[80px] transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim() || isPosting}
                        className="absolute right-3 bottom-3 p-2 bg-advent-blue text-white rounded-xl shadow-lg shadow-advent-blue/20 hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
            </div>
        </div>
    );
}
