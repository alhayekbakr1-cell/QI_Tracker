export default function Section({ title, icon, children, className }: { title: string, icon: React.ReactNode, children: React.ReactNode, className?: string }) {
    return (
        <div className={`space-y-4 ${className}`}>
            <h3 className="font-black text-slate-400 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
                {icon}
                {title}
            </h3>
            {children}
        </div>
    )
}
