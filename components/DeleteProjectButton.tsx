"use client"

import { Trash2 } from "lucide-react";
import { useTransition } from "react";

export default function DeleteProjectButton({ onDelete }: { onDelete: () => Promise<void> }) {
    const [isPending, startTransition] = useTransition();

    return (
        <button
            type="button"
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
            onClick={() => {
                if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                    startTransition(async () => {
                        await onDelete();
                    });
                }
            }}
        >
            <Trash2 className="w-4 h-4" />
            {isPending ? 'Deleting...' : 'Delete Project'}
        </button>
    );
}
