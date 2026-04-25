import { AlertTriangle } from 'lucide-react'

export default function PHIWarning() {
    return (
        <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-6 flex gap-4 mb-8">
            <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
                <h2 className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">
                    Zero-PHI Policy
                </h2>
                <p className="text-[11px] text-amber-700/80 leading-relaxed font-semibold">
                    DO NOT enter Protected Health Information (PHI) such as patient names, MRNs, or specific care dates.
                    Only use aggregate data or project-level metadata.
                </p>
            </div>
        </div>
    )
}
