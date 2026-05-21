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
    CircleDot,
    Paperclip,
    Link2,
    Trash2,
    PlusCircle,
    CheckCircle2,
    ListTodo
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
    old_value?: string;
}

export default function ActivityFeed() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchActivity() {
            try {
                // 1. Fetch recent comments
                const { data: comments, error: cError } = await supabase
                    .from('comments')
                    .select('id, content, created_at, project_id, user_id')
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (cError) {
                    console.error("ActivityFeed Comment Error:", cError);
                }

                // 2. Fetch recent audit logs (filtering out 'faculty_id' as we log it alongside 'faculty')
                const { data: auditLogs, error: aError } = await supabase
                    .from('audit_logs')
                    .select('id, field_name, old_value, new_value, created_at, project_id, user_id')
                    .neq('field_name', 'faculty_id')
                    .order('created_at', { ascending: false })
                    .limit(15);

                if (aError) {
                    console.warn("ActivityFeed Audit Table not found or inaccessible:", aError.message);
                }

                // 3. Consolidate project titles from BOTH comments and audit logs
                const projectIds = Array.from(new Set([
                    ...(comments || []).map(c => c.project_id),
                    ...(auditLogs || []).map(a => a.project_id)
                ].filter(Boolean)));

                const { data: projects } = projectIds.length > 0 ? await supabase
                    .from('projects')
                    .select('id, title')
                    .in('id', projectIds) : { data: [] };

                // 4. Consolidate user names from BOTH comments and audit logs
                const userIds = Array.from(new Set([
                    ...(comments || []).map(c => c.user_id),
                    ...(auditLogs || []).map(a => a.user_id)
                ].filter(Boolean)));

                const { data: userProfiles } = userIds.length > 0 ? await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', userIds) : { data: [] };

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

                // 6. Transform Audit Logs
                const formattedAudit: ActivityItem[] = (auditLogs || []).map(a => {
                    const project = projects?.find(p => p.id === a.project_id);
                    const profile = userProfiles?.find(p => p.id === a.user_id);
                    return {
                        id: a.id,
                        type: 'audit',
                        project_id: a.project_id,
                        project_title: project?.title || 'Unknown Project',
                        user_name: profile?.full_name || 'Someone',
                        content: getAuditDescription(a.field_name, a.new_value, a.old_value),
                        created_at: a.created_at,
                        field_name: a.field_name,
                        new_value: a.new_value,
                        old_value: a.old_value
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

    function getAuditDescription(field: string, value: string | null, oldValue: string | null = null) {
        const statusLabels: Record<string, string> = {
            todo: 'To Do',
            in_progress: 'In Progress',
            done: 'Done'
        };

        const formatCurrency = (val: string | null) => {
            const num = Number(val);
            if (isNaN(num)) return val || '$0';
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
        };

        const formatNumber = (val: string | null) => {
            const num = Number(val);
            if (isNaN(num)) return val || '0';
            return new Intl.NumberFormat('en-US').format(num);
        };

        const truncateText = (text: string | null, length: number = 60) => {
            if (!text) return '';
            return text.length > length ? text.substring(0, length) + '...' : text;
        };

        switch (field) {
            case 'title':
                return oldValue 
                    ? `Renamed project from "${truncateText(oldValue, 40)}" to "${truncateText(value, 40)}"`
                    : `Set project title to "${truncateText(value, 40)}"`;
            case 'status':
                return oldValue
                    ? `Changed project status from "${oldValue}" to "${value}"`
                    : `Set project status to "${value}"`;
            case 'category':
                return oldValue
                    ? `Changed category from "${oldValue}" to "${value}"`
                    : `Set category to "${value}"`;
            case 'subcategory':
                return oldValue
                    ? `Changed subcategory from "${oldValue}" to "${value}"`
                    : `Set subcategory to "${value}"`;
            case 'pdsa_cycle':
                return `Moved project to PDSA Cycle ${value}`;
            case 'faculty':
                return value
                    ? `Assigned Faculty Advisor "${value}"`
                    : `Removed Faculty Advisor (was "${oldValue}")`;
            case 'primary_outcome':
                return `Updated primary outcome measure to "${truncateText(value, 50)}"`;
            case 'updates_and_barriers':
                return `Updated progress updates & barriers`;
            case 'target_conference':
                return value
                    ? `Set target conference to "${value}"`
                    : `Removed target conference`;
            case 'total_patients_impacted': {
                const oldNum = Number(oldValue) || 0;
                const newNum = Number(value) || 0;
                if (newNum > oldNum) {
                    return `Increased patient impact to ${formatNumber(value)} patients (+${formatNumber(String(newNum - oldNum))})`;
                }
                return `Updated total patients impacted to ${formatNumber(value)}`;
            }
            case 'estimated_cost_savings': {
                const oldNum = Number(oldValue) || 0;
                const newNum = Number(value) || 0;
                if (newNum > oldNum) {
                    return `Increased estimated cost savings to ${formatCurrency(value)} (+${formatCurrency(String(newNum - oldNum))})`;
                }
                return `Updated estimated cost savings to ${formatCurrency(value)}`;
            }
            case 'abstract_summary':
                return `Updated abstract summary`;
            case 'protocol_url':
                return `Uploaded QI Protocol document`;
            case 'presentation_url':
                return `Updated presentation URL`;
            case 'project_file':
                return `Uploaded project resource file "${truncateText(value, 40)}"`;
            case 'project_file_link':
                return `Shared resource link "${truncateText(value, 50)}"`;
            case 'project_file_delete':
                return `Deleted resource attachment "${truncateText(oldValue, 40)}"`;
            case 'task_create':
                return `Created action item "${truncateText(value, 50)}"`;
            case 'task_status': {
                const [title, status] = (value || '').split('|');
                const label = statusLabels[status] || status;
                return `Marked action item "${truncateText(title, 40)}" as ${label}`;
            }
            case 'task_delete':
                return `Deleted action item "${truncateText(oldValue, 40)}"`;
            default:
                return `Updated ${field.replace(/_/g, ' ')}`;
        }
    }

    function getIcon(item: ActivityItem) {
        if (item.type === 'comment') return <MessageSquare className="w-4 h-4 text-advent-navy" />;

        switch (item.field_name) {
            case 'status': return <CircleDot className="w-4 h-4 text-emerald-500" />;
            case 'pdsa_cycle': return <TrendingUp className="w-4 h-4 text-amber-500" />;
            case 'protocol_url': return <FileText className="w-4 h-4 text-blue-500" />;
            case 'presentation_url': return <Presentation className="w-4 h-4 text-purple-500" />;
            case 'project_file': return <Paperclip className="w-4 h-4 text-indigo-500" />;
            case 'project_file_link': return <Link2 className="w-4 h-4 text-sky-500" />;
            case 'project_file_delete': return <Trash2 className="w-4 h-4 text-rose-500" />;
            case 'task_create': return <PlusCircle className="w-4 h-4 text-teal-500" />;
            case 'task_status': {
                const isDone = item.new_value?.endsWith('|done');
                return isDone 
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    : <ListTodo className="w-4 h-4 text-amber-500" />;
            }
            case 'task_delete': return <Trash2 className="w-4 h-4 text-rose-500" />;
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
