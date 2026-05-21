"use client"

import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    useDroppable,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Project, ProjectStatus } from '@/types';
import { createClient } from '@/utils/supabase/client';
import { Loader2, GripVertical } from 'lucide-react';

const STAGES: ProjectStatus[] = ['Idea', 'Pre-Intervention', 'Intervention Ongoing', 'Sustain the Gains', 'Impacted (Completed)'];

const COLUMN_STYLES: Record<ProjectStatus, { border: string, bg: string, text: string, pill: string, headerBorder: string }> = {
    'Idea': {
        border: 'border-violet-100/80',
        bg: 'bg-violet-50/5',
        text: 'text-violet-700',
        pill: 'bg-violet-50 text-violet-700 border-violet-100',
        headerBorder: 'border-b-2 border-violet-400'
    },
    'Pre-Intervention': {
        border: 'border-blue-100/80',
        bg: 'bg-blue-50/5',
        text: 'text-blue-700',
        pill: 'bg-blue-50 text-blue-700 border-blue-100',
        headerBorder: 'border-b-2 border-blue-400'
    },
    'Intervention Ongoing': {
        border: 'border-amber-100/80',
        bg: 'bg-amber-50/5',
        text: 'text-amber-700',
        pill: 'bg-amber-50 text-amber-700 border-amber-100',
        headerBorder: 'border-b-2 border-amber-400'
    },
    'Sustain the Gains': {
        border: 'border-cyan-100/80',
        bg: 'bg-cyan-50/5',
        text: 'text-cyan-700',
        pill: 'bg-cyan-50 text-cyan-700 border-cyan-100',
        headerBorder: 'border-b-2 border-cyan-400'
    },
    'Impacted (Completed)': {
        border: 'border-emerald-100/80',
        bg: 'bg-emerald-50/5',
        text: 'text-emerald-700',
        pill: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        headerBorder: 'border-b-2 border-emerald-400'
    }
};

interface KanbanCardProps {
    project: Project;
}

function KanbanCard({ project }: KanbanCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: project.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 group relative"
        >
            <div
                {...attributes}
                {...listeners}
                className="absolute right-4 top-4 p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-50 cursor-grab active:cursor-grabbing transition-colors"
            >
                <GripVertical className="w-4 h-4" />
            </div>
            <div className="pr-8">
                <h4 className="text-sm font-black text-slate-900 leading-tight mb-2 line-clamp-2">{project.title}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{project.faculty || 'No Mentor'}</p>
                <div className="mt-4 flex items-center justify-between">
                    <div className="flex -space-x-2">
                        {project.lead_proponents.slice(0, 3).map((name, i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">
                                {name.split(' ').map(n => n[0]).join('')}
                            </div>
                        ))}
                    </div>
                    <span className="text-[10px] font-black text-advent-navy/40">#{project.id.slice(0, 4)}</span>
                </div>
            </div>
        </div>
    );
}

interface KanbanColumnProps {
    status: ProjectStatus;
    projects: Project[];
}

function KanbanColumn({ status, projects }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({
        id: status,
    });
    const styles = COLUMN_STYLES[status] || COLUMN_STYLES['Idea'];

    return (
        <div 
            ref={setNodeRef}
            className={`flex flex-col h-full rounded-[2.5rem] border p-4 min-w-[300px] transition-all duration-300 ${styles.border} ${styles.bg}`}
        >
            <div className={`px-4 py-3 mb-4 flex items-center justify-between pb-3 ${styles.headerBorder}`}>
                <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${styles.text}`}>
                    {status}
                    <span className={`ml-3 px-2 py-0.5 rounded-full text-[10px] border tabular-nums ${styles.pill}`}>
                        {projects.length}
                    </span>
                </h3>
            </div>

            <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 space-y-4 overflow-y-auto min-h-[500px] scrollbar-hide pb-20">
                    {projects.map(project => (
                        <KanbanCard key={project.id} project={project} />
                    ))}
                    {projects.length === 0 && (
                        <div className={`h-32 border-2 border-dashed rounded-3xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-colors duration-300 bg-white/40 ${styles.text} ${styles.border}`}>
                            Empty Stage
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}

export default function KanbanBoard({ initialProjects }: { initialProjects: Project[] }) {
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [activeId, setActiveId] = useState<string | null>(null);
    const supabase = createClient();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragOver = (event: any) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const activeProject = projects.find(p => p.id === activeId);
        const overProject = projects.find(p => p.id === overId);

        // Handle dragging over a column/sortable-item
        const isOverAProject = !!overProject;
        const overStatus = isOverAProject ? overProject.status : (over.id as ProjectStatus);

        if (activeProject && activeProject.status !== overStatus) {
            setProjects(prev => {
                const activeIndex = prev.findIndex(p => p.id === activeId);
                const updated = [...prev];
                updated[activeIndex] = { ...activeProject, status: overStatus };
                return updated;
            });
        }
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeProject = projects.find(p => p.id === activeId);
        const overProject = projects.find(p => p.id === overId);

        if (activeProject) {
            // Update Supabase
            const { error } = await supabase
                .from('projects')
                .update({ status: activeProject.status, last_updated_date: new Date().toISOString() })
                .eq('id', activeProject.id);

            if (error) {
                console.error("Failed to update status in DB:", error);
            }
        }

        if (activeId !== overId) {
            setProjects((prev) => {
                const activeIndex = prev.findIndex((p) => p.id === activeId);
                const overIndex = prev.findIndex((p) => p.id === overId);
                return arrayMove(prev, activeIndex, overIndex);
            });
        }
    };

    const activeProject = activeId ? projects.find(p => p.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-6 overflow-x-auto pb-10 scrollbar-hide -mx-8 px-8">
                {STAGES.map(status => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        projects={projects.filter(p => p.status === status)}
                    />
                ))}
            </div>

            <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                        active: {
                            opacity: '0.4',
                        },
                    },
                }),
            }}>
                {activeProject ? (
                    <div className="bg-white p-5 rounded-2xl border-2 border-advent-navy/20 shadow-2xl opacity-90 scale-105 rotate-2 transition-transform cursor-grabbing w-[300px]">
                        <h4 className="text-sm font-black text-slate-900 leading-tight mb-2">{activeProject.title}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeProject.faculty || 'No Mentor'}</p>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

