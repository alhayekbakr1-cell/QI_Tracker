import { ProjectStatus } from '@/types'

const STATUS_CONFIG: Record<ProjectStatus, { color: string, bg: string, border: string, dot: string }> = {
    'Idea': { color: 'text-violet-700', bg: 'bg-violet-50/50', border: 'border-violet-200', dot: 'bg-violet-500' },
    'Pre-Intervention': { color: 'text-blue-700', bg: 'bg-blue-50/50', border: 'border-blue-200', dot: 'bg-blue-500' },
    'Intervention Ongoing': { color: 'text-amber-700', bg: 'bg-amber-50/50', border: 'border-amber-200', dot: 'bg-amber-500 animate-pulse' },
    'Sustain the Gains': { color: 'text-cyan-700', bg: 'bg-cyan-50/50', border: 'border-cyan-200', dot: 'bg-cyan-500' },
    'Impacted (Completed)': { color: 'text-emerald-700', bg: 'bg-emerald-50/50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
}

export default function StatusBadge({ status }: { status: ProjectStatus }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['Idea']

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${config.bg} ${config.color} ${config.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {status}
        </span>
    )
}

