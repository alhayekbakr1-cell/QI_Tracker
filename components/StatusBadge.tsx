import { ProjectStatus } from '@/types'

const STATUS_CONFIG: Record<ProjectStatus, { color: string, bg: string, border: string }> = {
    'Idea': { color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
    'Pre-Intervention': { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    'Intervention Ongoing': { color: 'text-advent-blue', bg: 'bg-advent-blue/10', border: 'border-advent-blue/20' },
    'Sustain the Gains': { color: 'text-advent-green', bg: 'bg-advent-green/10', border: 'border-advent-green/20' },
    'Impacted (Completed)': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
}

export default function StatusBadge({ status }: { status: ProjectStatus }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['Idea']

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${config.bg} ${config.color} ${config.border}`}>
            {status}
        </span>
    )
}
