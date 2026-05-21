"use client"

import { Trash2 } from "lucide-react";

export default function DeleteProjectButton({ onClick, isPending }: { onClick: () => void, isPending?: boolean }) {
    return (
        <button
            type="button"
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 border border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 active:scale-95"
            onClick={onClick}
        >
            <Trash2 className="w-4 h-4" />
            {isPending ? 'Deleting...' : 'Delete Initiative'}
        </button>
    );
}
