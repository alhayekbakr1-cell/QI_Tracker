"use client"

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, LayoutDashboard, List, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function Header({ userEmail, role }: { userEmail?: string, role?: string }) {
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <header className="border-b bg-white border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center gap-8">
                        <Link href="/" prefetch={false} className="flex items-center gap-2 font-bold text-xl text-advent-blue">
                            <span className="bg-advent-blue text-white p-1 rounded-md">QI</span>
                            <span>Chief Tracker</span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-6">
                            <Link href="/" prefetch={false} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-advent-lightblue border-b-2 border-transparent hover:border-advent-lightblue py-5 transition-all">
                                <LayoutDashboard className="w-4 h-4" />
                                Dashboard
                            </Link>
                            <Link href="/projects" prefetch={false} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-advent-lightblue border-b-2 border-transparent hover:border-advent-lightblue py-5 transition-all">
                                <List className="w-4 h-4" />
                                Projects
                            </Link>
                            <Link href="/resources" prefetch={false} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-advent-lightblue border-b-2 border-transparent hover:border-advent-lightblue py-5 transition-all">
                                <BookOpen className="w-4 h-4" />
                                Resources
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex flex-col items-end mr-2">
                            <span className="text-xs font-semibold text-slate-900 leading-none mb-1">{userEmail}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${role === 'Operator' ? 'bg-advent-blue/10 text-advent-blue' : 'bg-slate-100 text-slate-600'}`}>
                                {role || 'Viewer'}
                            </span>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-red-600 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}
