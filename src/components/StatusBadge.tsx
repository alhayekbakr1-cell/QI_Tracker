import { ProjectStatus } from '@/types'

const STATUS_CONFIG: Record<ProjectStatus, { color: string, bg: string, border: string, dot: string, ping: string }> = {
    'Idea': { color: 'text-violet-700', bg: 'bg-violet-50/80', border: 'border-violet-200/80', dot: 'bg-violet-500', ping: 'bg-violet-400' },
    'Pre-Intervention': { color: 'text-blue-700', bg: 'bg-blue-50/80', border: 'border-blue-200/80', dot: 'bg-blue-500', ping: 'bg-blue-400' },
    'Intervention Ongoing': { color: 'text-amber-700', bg: 'bg-amber-50/80', border: 'border-amber-200/80', dot: 'bg-amber-500', ping: 'bg-amber-400' },
    'Sustain the Gains': { color: 'text-cyan-700', bg: 'bg-cyan-50/80', border: 'border-cyan-200/80', dot: 'bg-cyan-500', ping: 'bg-cyan-400' },
    'Impacted (Completed)': { color: 'text-emerald-700', bg: 'bg-emerald-50/80', border: 'border-emerald-200/80', dot: 'bg-emerald-500', ping: 'bg-emerald-400' },
}

export default function StatusBadge({ status }: { status: ProjectStatus }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['Idea']

    return (
        <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-xs transition-all duration-300 ${config.bg} ${config.color} ${config.border}`}>
            <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.ping}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
            </span>
            {status}
        </span>
    )
}


