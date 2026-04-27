"use client"

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import {
    MessageSquare,
    Zap,
    FileText,
    Presentation,
    TrendingUp,
    Clock,
    CircleDot
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface ActivityItem {
    id: string;
    type: 'comment' | 'audit';
    project_id: string;
    project_title: string;
    user_name: string;
    content: string;
    created_at: string;
    field_name?: string;
    new_value?: string;
}

export default function ActivityFeed() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchActivity() {
            try {
                // 1. Fetch recent comments (fetching user_id separately for now to avoid join error)
                const { data: comments, error: cError } = await supabase
                    .from('comments')
                    .select('id, content, created_at, project_id, user_id')
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (cError) {
                    console.error("ActivityFeed Comment Error:", cError);
                }

                // 2. Fetch project titles for these comments
                const projectIds = Array.from(new Set((comments || []).map(c => c.project_id)));
                const { data: projects } = projectIds.length > 0 ? await supabase
                    .from('projects')
                    .select('id, title')
                    .in('id', projectIds) : { data: [] };

                // 3. Fetch user names
                const userIds = Array.from(new Set((comments || []).map(c => c.user_id)));
                const { data: userProfiles } = userIds.length > 0 ? await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', userIds) : { data: [] };

                // 4. Fetch recent audit logs (handling potential missing table)
                const { data: auditLogs, error: aError } = await supabase
                    .from('audit_logs')
                    .select('id, field_name, new_value, created_at, project_id, user_id')
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (aError) {
                    console.warn("ActivityFeed Audit Table not found or inaccessible:", aError.message);
                }

                // 5. Transform Comments
                const formattedComments: ActivityItem[] = (comments || []).map(c => {
                    const project = projects?.find(p => p.id === c.project_id);
                    const profile = userProfiles?.find(p => p.id === c.user_id);
                    return {
                        id: c.id,
                        type: 'comment',
                        project_id: c.project_id,
                        project_title: project?.title || 'Unknown Project',
                        user_name: profile?.full_name || 'Someone',
                        content: c.content,
                        created_at: c.created_at
                    };
                });

                // 6. Transform Audit Logs (if available)
                const formattedAudit: ActivityItem[] = (auditLogs || []).map(a => {
                    const project = projects?.find(p => p.id === a.project_id);
                    const profile = userProfiles?.find(p => p.id === a.user_id);
                    return {
                        id: a.id,
                        type: 'audit',
                        project_id: a.project_id,
                        project_title: project?.title || 'Unknown Project',
                        user_name: profile?.full_name || 'Someone',
                        content: getAuditDescription(a.field_name, a.new_value),
                        created_at: a.created_at,
                        field_name: a.field_name,
                        new_value: a.new_value
                    };
                });

                const combined = [...formattedComments, ...formattedAudit]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 15);

                setActivities(combined);
            } catch (error) {
                console.error("Error fetching activity:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchActivity();

        // Polling for real-time feel (every 30s)
        const interval = setInterval(fetchActivity, 30000);
        return () => clearInterval(interval);
    }, [supabase]);

    function getAuditDescription(field: string, value: string) {
        switch (field) {
            case 'status': return `Updated status to ${value}`;
            case 'pdsa_cycle': return `Moved to PDSA Cycle ${value}`;
            case 'protocol_url': return `Uploaded QI Protocol`;
            case 'presentation_url': return `Shared Presentation Link`;
            default: return `Updated ${field}`;
        }
    }

    function getIcon(item: ActivityItem) {
        if (item.type === 'comment') return <MessageSquare className="w-4 h-4 text-advent-navy" />;

        switch (item.field_name) {
            case 'status': return <CircleDot className="w-4 h-4 text-emerald-500" />;
            case 'pdsa_cycle': return <TrendingUp className="w-4 h-4 text-amber-500" />;
            case 'protocol_url': return <FileText className="w-4 h-4 text-blue-500" />;
            case 'presentation_url': return <Presentation className="w-4 h-4 text-purple-500" />;
            default: return <Zap className="w-4 h-4 text-slate-400" />;
        }
    }

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-slate-100 rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {activities.length > 0 ? (
                activities.map((item) => (
                    <div key={item.id} className="group relative flex gap-x-4">
                        <div className="relative flex h-8 w-8 flex-none items-center justify-center bg-white rounded-full border border-slate-200 shadow-sm group-hover:scale-110 transition-transform">
                            {getIcon(item)}
                        </div>

                        <div className="flex-auto py-0.5">
                            <div className="flex justify-between items-start gap-x-4">
                                <p className="text-xs leading-5 text-slate-500">
                                    <span className="font-black text-slate-900">{item.user_name}</span>
                                    {" "}
                                    {item.type === 'comment' ? 'commented on' : 'changed'}
                                    {" "}
                                    <Link
                                        href={`/projects/view?id=${item.project_id}`}
                                        className="font-bold text-advent-navy hover:underline"
                                    >
                                        {item.project_title}
                                    </Link>
                                </p>
                                <div className="flex items-center gap-1 text-[10px] whitespace-nowrap text-slate-400 font-bold uppercase tracking-widest">
                                    <Clock className="w-3 h-3" />
                                    {formatDistanceToNow(new Date(item.created_at))}
                                </div>
                            </div>

                            <p className="mt-1 text-xs font-medium text-slate-600 line-clamp-2 italic">
                                "{item.type === 'comment' ? item.content : item.content}"
                            </p>
                        </div>
                    </div>
                ))
            ) : (
                <div className="py-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <p className="text-xs font-bold text-slate-400">No recent activity found.</p>
                </div>
            )}
        </div>
    );
}
