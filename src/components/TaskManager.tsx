"use client"

import { useState, useEffect } from "react";
import {
    CheckCircle2,
    Circle,
    Clock,
    Plus,
    Trash2,
    Loader2,
    ListTodo,
    User,
    AlertCircle,
    ChevronDown,
    Pencil,
    Trello,
    Calendar,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Task, Profile, TaskStatus } from "@/types";
import { format, isPast, parseISO } from "date-fns";
import { sendEmailNotification, getProfileDetails } from "@/utils/notifications";

interface TaskManagerProps {
    projectId: string;
    currentUserProfile: Profile | null;
    projectTitle?: string;
}

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
    todo: 'in_progress',
    in_progress: 'done',
    done: 'todo'
};

const STATUS_LABEL: Record<TaskStatus, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done'
};

const STATUS_COLORS: Record<TaskStatus, string> = {
    todo: 'text-slate-400 bg-slate-50 border-slate-200',
    in_progress: 'text-amber-600 bg-amber-50 border-amber-200',
    done: 'text-emerald-600 bg-emerald-50 border-emerald-200'
};

export default function TaskManager({ projectId, currentUserProfile, projectTitle }: TaskManagerProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assignee_id: '',
        assignee_name: '',
        due_date: ''
    });
    const supabase = createClient();

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        assignee_id: '',
        due_date: ''
    });
    const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
    const [nudgingTaskId, setNudgingTaskId] = useState<string | null>(null);
    const [nudgedTaskId, setNudgedTaskId] = useState<string | null>(null);

    const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('list');
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    const handleMoveStatus = async (task: Task, newStatus: TaskStatus) => {
        const { error } = await supabase
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', task.id);

        if (!error) {
            await supabase.from('audit_logs').insert({
                project_id: projectId,
                user_id: currentUserProfile?.id,
                field_name: 'task_status',
                old_value: `${task.title}|${task.status}`,
                new_value: `${task.title}|${newStatus}`,
                action: 'UPDATE'
            });

            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
        }
    };

    const renderKanbanColumn = (status: TaskStatus, columnTasks: Task[], colStyle: string, pillStyle: string) => {
        return (
            <div className={`flex flex-col rounded-2xl border p-4 ${colStyle} min-h-[400px]`}>
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black uppercase tracking-wider">
                        {STATUS_LABEL[status]}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${pillStyle}`}>
                        {columnTasks.length}
                    </span>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
                    {columnTasks.length === 0 ? (
                        <div 
                            onClick={() => {
                                setNewTask({ title: '', description: '', assignee_id: '', assignee_name: '', due_date: '' });
                                setIsAdding(true);
                            }}
                            className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-200/50 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-all text-slate-400 bg-white/50"
                        >
                            <Plus className="w-4 h-4 mb-1" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Add Task</span>
                        </div>
                    ) : (
                        columnTasks.map(task => {
                            const isOverdue = task.due_date && task.status !== 'done' && isPast(parseISO(task.due_date));
                            if (editingTaskId === task.id) {
                                return (
                                    <div
                                        key={task.id}
                                        className="bg-slate-50 border border-advent-blue/20 rounded-xl p-3 space-y-2.5 animate-in fade-in duration-200"
                                    >
                                        <div className="space-y-1.5">
                                            <input
                                                type="text"
                                                value={editForm.title}
                                                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                                className="w-full px-2 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-advent-blue/10 outline-none"
                                                placeholder="Task Title"
                                                required
                                            />
                                            <input
                                                type="text"
                                                value={editForm.description}
                                                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                                className="w-full px-2 py-1 text-[10px] bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-advent-blue/10 outline-none"
                                                placeholder="Optional Description"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            <div>
                                                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5 block">
                                                    Assign To
                                                </label>
                                                <select
                                                    value={editForm.assignee_id}
                                                    onChange={e => setEditForm({ ...editForm, assignee_id: e.target.value })}
                                                    className="w-full px-2 py-1 text-[10px] font-semibold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-advent-blue/10 outline-none"
                                                >
                                                    <option value="">Unassigned</option>
                                                    {profiles.map(p => (
                                                        <option key={p.id} value={p.id}>{p.full_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5 block">
                                                    Due Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={editForm.due_date}
                                                    onChange={e => setEditForm({ ...editForm, due_date: e.target.value })}
                                                    className="w-full px-2 py-1 text-[10px] bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-advent-blue/10 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-1.5 pt-1">
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSaveEdit(task.id)}
                                                disabled={savingTaskId === task.id || !editForm.title.trim()}
                                                className="flex items-center gap-1 px-3 py-1 bg-advent-blue text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-advent-navy disabled:opacity-50 transition-all"
                                            >
                                                {savingTaskId === task.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : 'Save'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={task.id}
                                    className="bg-white border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all rounded-xl p-3 flex flex-col justify-between gap-3 group relative"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`text-xs font-bold leading-snug ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                                {task.title}
                                            </p>
                                        </div>
                                        {task.description && (
                                            <p className="text-[10px] text-slate-400 mt-1 font-medium italic line-clamp-2">{task.description}</p>
                                        )}
                                        
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            {task.assignee_name && (
                                                <span className="inline-flex items-center gap-1 text-[8px] text-slate-500 font-bold bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
                                                    <User className="w-2 h-2" />
                                                    {task.assignee_name}
                                                </span>
                                            )}
                                            {task.due_date && (
                                                <span className={`inline-flex items-center gap-1 text-[8px] font-bold bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                                                    <Clock className="w-2 h-2" />
                                                    {format(parseISO(task.due_date), 'MMM d')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-slate-50 pt-2 mt-1">
                                        <div className="flex items-center gap-1">
                                            {status !== 'todo' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleMoveStatus(task, status === 'done' ? 'in_progress' : 'todo')}
                                                    className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-400 hover:text-advent-blue hover:bg-white transition-all"
                                                    title="Move back"
                                                >
                                                    <ChevronLeft className="w-3 h-3" />
                                                </button>
                                            )}
                                            {status !== 'done' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleMoveStatus(task, status === 'todo' ? 'in_progress' : 'done')}
                                                    className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-400 hover:text-advent-blue hover:bg-white transition-all"
                                                    title="Move forward"
                                                >
                                                    <ChevronRight className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {(currentUserProfile?.role === 'Admin' || currentUserProfile?.role === 'Faculty' || task.created_by === currentUserProfile?.id) && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStartEdit(task)}
                                                        className="p-1 text-slate-300 hover:text-advent-blue transition-all"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(task.id)}
                                                        className="p-1 text-slate-300 hover:text-red-500 transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    };

    useEffect(() => {
        fetchTasks();
        fetchProfiles();
    }, [projectId]);

    const fetchTasks = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (!error) setTasks((data || []) as Task[]);
        setIsLoading(false);
    };

    const fetchProfiles = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, role, created_at')
            .order('full_name');
        setProfiles((data || []) as Profile[]);
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.title.trim() || isSaving) return;

        setIsSaving(true);
        const selectedProfile = profiles.find(p => p.id === newTask.assignee_id);

        const { data, error } = await supabase
            .from('tasks')
            .insert([{
                project_id: projectId,
                title: newTask.title.trim(),
                description: newTask.description.trim() || null,
                assignee_id: newTask.assignee_id || null,
                assignee_name: selectedProfile?.full_name || null,
                due_date: newTask.due_date || null,
                status: 'todo' as TaskStatus,
                created_by: currentUserProfile?.id || null
            }])
            .select()
            .single();

        if (!error && data) {
            // Trigger audit log for task creation
            await supabase.from('audit_logs').insert({
                project_id: projectId,
                user_id: currentUserProfile?.id,
                field_name: 'task_create',
                old_value: null,
                new_value: newTask.title.trim(),
                action: 'INSERT'
            });

            // Trigger notification email if assignee is set
            if (newTask.assignee_id) {
                getProfileDetails([newTask.assignee_id]).then(async (recipients) => {
                    if (recipients && recipients.length > 0) {
                        const recipient = recipients[0];
                        const dueDateStr = newTask.due_date 
                            ? format(parseISO(newTask.due_date), 'MMM d, yyyy') 
                            : 'No due date set';
                        const descriptionStr = newTask.description.trim() 
                            ? `\n\nTask Description: ${newTask.description.trim()}` 
                            : '';
                        
                        await sendEmailNotification({
                            to_email: recipient.email,
                            to_name: recipient.name,
                            subject: `[QI Tracker] New Action Item Assigned: ${data.title}`,
                            message: `You have been assigned a new action item: "${data.title}" in the project "${projectTitle || 'QI Project'}".${descriptionStr}\n\nDue Date: ${dueDateStr}`,
                            project_title: projectTitle || 'QI Project',
                            action_url: `${window.location.origin}/projects/view?id=${projectId}`
                        });
                    }
                }).catch(err => {
                    console.error('❌ Failed to send task assignment notification email:', err);
                });
            }

            setTasks([...tasks, data as Task]);
            setNewTask({ title: '', description: '', assignee_id: '', assignee_name: '', due_date: '' });
            setIsAdding(false);
        }
        setIsSaving(false);
    };

    const handleCycleStatus = async (task: Task) => {
        const nextStatus = STATUS_CYCLE[task.status];
        const { error } = await supabase
            .from('tasks')
            .update({ status: nextStatus })
            .eq('id', task.id);

        if (!error) {
            // Trigger audit log for task status update
            await supabase.from('audit_logs').insert({
                project_id: projectId,
                user_id: currentUserProfile?.id,
                field_name: 'task_status',
                old_value: `${task.title}|${task.status}`,
                new_value: `${task.title}|${nextStatus}`,
                action: 'UPDATE'
            });

            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
        }
    };

    const handleDelete = async (taskId: string) => {
        const taskToDelete = tasks.find(t => t.id === taskId);
        if (!taskToDelete) return;
        if (!confirm(`Are you sure you want to remove the task "${taskToDelete.title}"?`)) return;

        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (!error) {
            // Trigger audit log for task delete
            await supabase.from('audit_logs').insert({
                project_id: projectId,
                user_id: currentUserProfile?.id,
                field_name: 'task_delete',
                old_value: taskToDelete.title,
                new_value: null,
                action: 'DELETE'
            });

            setTasks(tasks.filter(t => t.id !== taskId));
        }
    };

    const handleStartEdit = (task: Task) => {
        setEditingTaskId(task.id);
        setEditForm({
            title: task.title || '',
            description: task.description || '',
            assignee_id: task.assignee_id || '',
            due_date: task.due_date || ''
        });
    };

    const handleCancelEdit = () => {
        setEditingTaskId(null);
    };

    const handleSaveEdit = async (taskId: string) => {
        if (!editForm.title.trim() || savingTaskId) return;

        setSavingTaskId(taskId);
        const originalTask = tasks.find(t => t.id === taskId);
        if (!originalTask) {
            setSavingTaskId(null);
            return;
        }

        const selectedProfile = profiles.find(p => p.id === editForm.assignee_id);
        const updatedFields = {
            title: editForm.title.trim(),
            description: editForm.description.trim() || null,
            assignee_id: editForm.assignee_id || null,
            assignee_name: selectedProfile?.full_name || null,
            due_date: editForm.due_date || null
        };

        const { error } = await supabase
            .from('tasks')
            .update(updatedFields)
            .eq('id', taskId);

        if (!error) {
            const assigneeChanged = originalTask.assignee_id !== updatedFields.assignee_id;
            const dueDateChanged = originalTask.due_date !== updatedFields.due_date;

            // Update local state
            setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updatedFields, status: t.status } : t));

            if (assigneeChanged) {
                // Log audit log
                await supabase.from('audit_logs').insert({
                    project_id: projectId,
                    user_id: currentUserProfile?.id,
                    field_name: 'task_assignee',
                    old_value: originalTask.assignee_name || 'Unassigned',
                    new_value: updatedFields.assignee_name || 'Unassigned',
                    action: 'UPDATE'
                });

                // Send email to the NEW assignee if set
                if (updatedFields.assignee_id) {
                    getProfileDetails([updatedFields.assignee_id]).then(async (recipients) => {
                        if (recipients && recipients.length > 0) {
                            const recipient = recipients[0];
                            const dueDateStr = updatedFields.due_date 
                                ? format(parseISO(updatedFields.due_date), 'MMM d, yyyy') 
                                : 'No due date set';
                            const descriptionStr = updatedFields.description 
                                ? `\n\nTask Description: ${updatedFields.description}` 
                                : '';

                            await sendEmailNotification({
                                to_email: recipient.email,
                                to_name: recipient.name,
                                subject: `[QI Tracker] Action Item Reassigned: ${updatedFields.title}`,
                                message: `You have been reassigned the action item: "${updatedFields.title}" in the project "${projectTitle || 'QI Project'}".${descriptionStr}\n\nDue Date: ${dueDateStr}`,
                                project_title: projectTitle || 'QI Project',
                                action_url: `${window.location.origin}/projects/view?id=${projectId}`
                            });
                        }
                    }).catch(err => {
                        console.error('❌ Failed to send task reassignment email:', err);
                    });
                }
            }

            if (dueDateChanged) {
                // Log audit log
                await supabase.from('audit_logs').insert({
                    project_id: projectId,
                    user_id: currentUserProfile?.id,
                    field_name: 'task_due_date',
                    old_value: originalTask.due_date || 'No due date',
                    new_value: updatedFields.due_date || 'No due date',
                    action: 'UPDATE'
                });

                // Send email to the CURRENT/NEW assignee notifying of deadline shift
                const targetAssigneeId = updatedFields.assignee_id || originalTask.assignee_id;
                if (targetAssigneeId) {
                    getProfileDetails([targetAssigneeId]).then(async (recipients) => {
                        if (recipients && recipients.length > 0) {
                            const recipient = recipients[0];
                            const oldDateStr = originalTask.due_date 
                                ? format(parseISO(originalTask.due_date), 'MMM d, yyyy') 
                                : 'No due date set';
                            const newDateStr = updatedFields.due_date 
                                ? format(parseISO(updatedFields.due_date), 'MMM d, yyyy') 
                                : 'No due date set';

                            await sendEmailNotification({
                                to_email: recipient.email,
                                to_name: recipient.name,
                                subject: `[QI Tracker] Deadline Shifted: ${updatedFields.title}`,
                                message: `The deadline for your assigned action item: "${updatedFields.title}" in the project "${projectTitle || 'QI Project'}" has been updated.\n\nOld Due Date: ${oldDateStr}\nNew Due Date: ${newDateStr}`,
                                project_title: projectTitle || 'QI Project',
                                action_url: `${window.location.origin}/projects/view?id=${projectId}`
                            });
                        }
                    }).catch(err => {
                        console.error('❌ Failed to send deadline shift email:', err);
                    });
                }
            }

            setEditingTaskId(null);
        }
        setSavingTaskId(null);
    };

    const handleNudge = async (task: Task) => {
        if (!task.assignee_id || nudgingTaskId) return;

        setNudgingTaskId(task.id);
        try {
            const recipients = await getProfileDetails([task.assignee_id]);
            if (recipients && recipients.length > 0) {
                const recipient = recipients[0];
                const daysOverdue = Math.max(0, Math.floor((Date.now() - parseISO(task.due_date!).getTime()) / (1000 * 60 * 60 * 24)));
                const formattedDueDate = format(parseISO(task.due_date!), 'MMM d, yyyy');
                
                const response = await sendEmailNotification({
                    to_email: recipient.email,
                    to_name: recipient.name,
                    subject: `[QI Tracker] Task Overdue Nudge: ${task.title}`,
                    message: `This is a reminder that your assigned task "${task.title}" is overdue. Please log in to update your progress.`,
                    project_title: projectTitle || 'QI Project',
                    template_id: process.env.NEXT_PUBLIC_EMAILJS_NUDGE_TEMPLATE_ID || 'template_zp4ihsn',
                    days_inactive: String(daysOverdue),
                    last_update: formattedDueDate,
                    action_url: `${window.location.origin}/projects/view?id=${projectId}`
                });

                if (response?.success) {
                    setNudgedTaskId(task.id);
                    setTimeout(() => {
                        setNudgedTaskId(null);
                    }, 3000);
                }
            }
        } catch (err) {
            console.error('❌ Failed to send task nudge notification email:', err);
        } finally {
            setNudgingTaskId(null);
        }
    };

    // Calendar helper
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    const daysArray: { date: Date; isCurrentMonth: boolean; dateStr: string }[] = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const d = new Date(year, month - 1, prevMonthTotalDays - i);
        const dateStr = format(d, 'yyyy-MM-dd');
        daysArray.push({ date: d, isCurrentMonth: false, dateStr });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
        const d = new Date(year, month, i);
        const dateStr = format(d, 'yyyy-MM-dd');
        daysArray.push({ date: d, isCurrentMonth: true, dateStr });
    }

    // Next month padding to fill complete calendar rows (42 cells)
    const remaining = 42 - daysArray.length;
    for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        const dateStr = format(d, 'yyyy-MM-dd');
        daysArray.push({ date: d, isCurrentMonth: false, dateStr });
    }

    const todoCount = tasks.filter(t => t.status === 'todo').length;
    const doneCount = tasks.filter(t => t.status === 'done').length;

    return (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-advent-blue" />
                    Action Items
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Premium Segmented Toggle View Switches */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                viewMode === 'list'
                                    ? 'bg-white text-advent-blue shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            <ListTodo className="w-3 h-3" />
                            List
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('kanban')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                viewMode === 'kanban'
                                    ? 'bg-white text-advent-blue shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            <Trello className="w-3 h-3" />
                            Kanban
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('calendar')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                viewMode === 'calendar'
                                    ? 'bg-white text-advent-blue shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            <Calendar className="w-3 h-3" />
                            Calendar
                        </button>
                    </div>

                    {tasks.length > 0 && (
                        <span className="text-[10px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm">
                            {doneCount}/{tasks.length} done
                        </span>
                    )}
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-advent-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-advent-navy transition-all active:scale-95 shadow-sm"
                    >
                        <Plus className="w-3 h-3" />
                        Add Task
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-3">
                {/* Add task form */}
                {isAdding && (
                    <form
                        onSubmit={handleAddTask}
                        className="bg-slate-50 border border-advent-blue/20 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200"
                    >
                        <input
                            autoFocus
                            type="text"
                            placeholder="Task title (e.g. Submit IRB amendment)"
                            value={newTask.title}
                            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                            className="w-full px-3 py-2 text-sm font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-advent-blue/10 outline-none"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Optional description or notes"
                            value={newTask.description}
                            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-advent-blue/10 outline-none"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                                    Assign To
                                </label>
                                <select
                                    value={newTask.assignee_id}
                                    onChange={e => setNewTask({ ...newTask, assignee_id: e.target.value })}
                                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-advent-blue/10 outline-none appearance-none"
                                >
                                    <option value="">Unassigned</option>
                                    {profiles.map(p => (
                                        <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    value={newTask.due_date}
                                    onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-advent-blue/10 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-2 bg-advent-blue text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-advent-navy disabled:opacity-50 transition-all shadow-sm"
                            >
                                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                Add
                            </button>
                        </div>
                    </form>
                )}

                {/* View 1: List View */}
                {viewMode === 'list' && (
                    isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
                        </div>
                    ) : tasks.length === 0 && !isAdding ? (
                        <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
                            <ListTodo className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No action items yet</p>
                            <p className="text-[10px] text-slate-300 mt-1">Click "Add Task" to create your first action item</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {tasks.map(task => {
                                const isOverdue = task.due_date && task.status !== 'done' && isPast(parseISO(task.due_date));
                                
                                if (editingTaskId === task.id) {
                                    return (
                                        <div
                                            key={task.id}
                                            className="bg-slate-50 border border-advent-blue/20 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200"
                                        >
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={editForm.title}
                                                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                                    className="w-full px-3 py-2 text-sm font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-advent-blue/10 outline-none"
                                                    placeholder="Task Title"
                                                    required
                                                />
                                                <input
                                                    type="text"
                                                    value={editForm.description}
                                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-advent-blue/10 outline-none"
                                                    placeholder="Optional Description"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                                                        Assign To
                                                    </label>
                                                    <select
                                                        value={editForm.assignee_id}
                                                        onChange={e => setEditForm({ ...editForm, assignee_id: e.target.value })}
                                                        className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-advent-blue/10 outline-none"
                                                    >
                                                        <option value="">Unassigned</option>
                                                        {profiles.map(p => (
                                                            <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                                                        Due Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={editForm.due_date}
                                                        onChange={e => setEditForm({ ...editForm, due_date: e.target.value })}
                                                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-advent-blue/10 outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={handleCancelEdit}
                                                    className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveEdit(task.id)}
                                                    disabled={savingTaskId === task.id || !editForm.title.trim()}
                                                    className="flex items-center gap-2 px-6 py-2 bg-advent-blue text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-advent-navy disabled:opacity-50 transition-all shadow-sm"
                                                >
                                                    {savingTaskId === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={task.id}
                                        className={`flex items-start gap-3 p-3 rounded-2xl border transition-all group ${task.status === 'done'
                                            ? 'bg-slate-50/50 border-slate-100 opacity-70'
                                            : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                                            }`}
                                    >
                                        {/* Status toggle button */}
                                        <button
                                            onClick={() => handleCycleStatus(task)}
                                            className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110"
                                            title={`Click to advance: ${STATUS_LABEL[task.status]} → ${STATUS_LABEL[STATUS_CYCLE[task.status]]}`}
                                        >
                                            {task.status === 'done' ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            ) : task.status === 'in_progress' ? (
                                                <div className="w-5 h-5 rounded-full border-2 border-amber-400 flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                                                </div>
                                            ) : (
                                                <Circle className="w-5 h-5 text-slate-300 hover:text-advent-blue" />
                                            )}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold leading-tight ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                                {task.title}
                                            </p>
                                            {task.description && (
                                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium italic">{task.description}</p>
                                            )}
                                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_COLORS[task.status]}`}>
                                                    {STATUS_LABEL[task.status]}
                                                </span>
                                                {task.assignee_name && (
                                                    <span className="inline-flex items-center gap-1 text-[9px] text-slate-500 font-bold">
                                                        <User className="w-2.5 h-2.5" />
                                                        {task.assignee_name}
                                                    </span>
                                                )}
                                                {task.due_date && (
                                                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                                                        {isOverdue && <AlertCircle className="w-2.5 h-2.5" />}
                                                        <Clock className="w-2.5 h-2.5" />
                                                        {format(parseISO(task.due_date), 'MMM d, yyyy')}
                                                        {isOverdue && ' (Overdue)'}
                                                    </span>
                                                )}
                                                {isOverdue && task.assignee_id && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleNudge(task);
                                                        }}
                                                        disabled={nudgingTaskId === task.id}
                                                        className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border transition-all ${
                                                            nudgedTaskId === task.id
                                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                                                : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 active:scale-95'
                                                        }`}
                                                    >
                                                        {nudgingTaskId === task.id ? (
                                                            <>
                                                                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                                                Nudging...
                                                            </>
                                                        ) : nudgedTaskId === task.id ? (
                                                            <>
                                                                <CheckCircle2 className="w-2.5 h-2.5" />
                                                                Nudged!
                                                            </>
                                                        ) : (
                                                            <>
                                                                <AlertCircle className="w-2.5 h-2.5" />
                                                                Nudge Assignee
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions (visible on hover) */}
                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 flex-shrink-0 transition-all">
                                            {(currentUserProfile?.role === 'Admin' || currentUserProfile?.role === 'Faculty' || task.created_by === currentUserProfile?.id) && (
                                                <>
                                                    <button
                                                        onClick={() => handleStartEdit(task)}
                                                        className="p-1 text-slate-300 hover:text-advent-blue transition-all"
                                                        title="Edit Task"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(task.id)}
                                                        className="p-1 text-slate-300 hover:text-red-500 transition-all"
                                                        title="Delete Task"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}

                {/* View 2: Kanban Board View */}
                {viewMode === 'kanban' && (
                    isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                            {renderKanbanColumn('todo', tasks.filter(t => t.status === 'todo'), 'bg-slate-50/50 border-slate-200/60', 'bg-slate-200/80 text-slate-700')}
                            {renderKanbanColumn('in_progress', tasks.filter(t => t.status === 'in_progress'), 'bg-amber-50/30 border-amber-200/40', 'bg-amber-100/80 text-amber-700')}
                            {renderKanbanColumn('done', tasks.filter(t => t.status === 'done'), 'bg-emerald-50/30 border-emerald-200/40', 'bg-emerald-100/80 text-emerald-700')}
                        </div>
                    )
                )}

                {/* View 3: Calendar Grid View */}
                {viewMode === 'calendar' && (
                    isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
                        </div>
                    ) : (
                        <div className="space-y-4 pt-2">
                            {/* Month switcher */}
                            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 p-3 rounded-2xl shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
                                        setCurrentMonth(prev);
                                    }}
                                    className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-600 transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                                    {format(currentMonth, 'MMMM yyyy')}
                                </h4>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
                                        setCurrentMonth(next);
                                    }}
                                    className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-600 transition-all"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Calendar Grid Header */}
                            <div className="grid grid-cols-7 gap-1.5 text-center text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                <div>Sun</div>
                                <div>Mon</div>
                                <div>Tue</div>
                                <div>Wed</div>
                                <div>Thu</div>
                                <div>Fri</div>
                                <div>Sat</div>
                            </div>

                            {/* Calendar Grid Days */}
                            <div className="grid grid-cols-7 gap-1.5">
                                {daysArray.map((cell, idx) => {
                                    const dayTasks = tasks.filter(t => t.due_date && format(parseISO(t.due_date), 'yyyy-MM-dd') === cell.dateStr);
                                    const isToday = format(new Date(), 'yyyy-MM-dd') === cell.dateStr;
                                    
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                setNewTask({
                                                    title: '',
                                                    description: '',
                                                    assignee_id: '',
                                                    assignee_name: '',
                                                    due_date: cell.dateStr
                                                });
                                                setIsAdding(true);
                                            }}
                                            className={`min-h-[90px] p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all hover:bg-slate-50 shadow-sm ${
                                                cell.isCurrentMonth
                                                    ? isToday
                                                        ? 'bg-advent-blue/5 border-advent-blue/30 text-advent-blue shadow-sm font-semibold'
                                                        : 'bg-white border-slate-100 text-slate-800'
                                                    : 'bg-slate-50/40 border-slate-100/60 text-slate-300'
                                            }`}
                                        >
                                            <span className={`text-[10px] font-black self-end ${
                                                isToday
                                                    ? 'bg-advent-blue text-white w-5 h-5 flex items-center justify-center rounded-full -mr-1 -mt-1 shadow-sm'
                                                    : ''
                                            }`}>
                                                {cell.date.getDate()}
                                            </span>
                                            <div className="space-y-1 mt-1.5 flex-1 overflow-y-auto max-h-[60px] pr-0.5">
                                                {dayTasks.map(task => (
                                                    <div
                                                        key={task.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStartEdit(task);
                                                        }}
                                                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded border truncate transition-all active:scale-95 shadow-sm ${
                                                            task.status === 'done'
                                                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600 line-through'
                                                                : task.status === 'in_progress'
                                                                    ? 'bg-amber-50 border-amber-100 text-amber-700'
                                                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                                        }`}
                                                        title={`${task.title} (${STATUS_LABEL[task.status]})`}
                                                    >
                                                        {task.title}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )
                )}

                {/* Calendar Edit Task Modal */}
                {editingTaskId && viewMode === 'calendar' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                                    Edit Action Item
                                </h4>
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                                        Task Title
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                        className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-advent-blue/10 outline-none"
                                        placeholder="Task Title"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                                        Description
                                    </label>
                                    <textarea
                                        value={editForm.description}
                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-advent-blue/10 outline-none min-h-[60px]"
                                        placeholder="Optional Description"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                                            Assign To
                                        </label>
                                        <select
                                            value={editForm.assignee_id}
                                            onChange={e => setEditForm({ ...editForm, assignee_id: e.target.value })}
                                            className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-advent-blue/10 outline-none"
                                        >
                                            <option value="">Unassigned</option>
                                            {profiles.map(p => (
                                                <option key={p.id} value={p.id}>{p.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                                            Due Date
                                        </label>
                                        <input
                                            type="date"
                                            value={editForm.due_date}
                                            onChange={e => setEditForm({ ...editForm, due_date: e.target.value })}
                                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-advent-blue/10 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSaveEdit(editingTaskId)}
                                    disabled={savingTaskId === editingTaskId || !editForm.title.trim()}
                                    className="flex items-center gap-2 px-6 py-2 bg-advent-blue text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-advent-navy disabled:opacity-50 transition-all shadow-sm"
                                >
                                    {savingTaskId === editingTaskId ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress bar */}
                {tasks.length > 0 && (
                    <div className="pt-3">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                            <span>Progress</span>
                            <span>{Math.round((doneCount / tasks.length) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-advent-blue to-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${(doneCount / tasks.length) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
