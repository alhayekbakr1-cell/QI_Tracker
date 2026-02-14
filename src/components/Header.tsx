"use client"

import { createClient } from '@/utils/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, LayoutDashboard, List, BookOpen, Activity } from 'lucide-react'
import Link from 'next/link'

export default function Header({ userEmail, role }: { userEmail?: string, role?: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const navItems = [
        { href: '/', label: 'Overview', icon: LayoutDashboard },
        { href: '/projects', label: 'Projects', icon: List },
        { href: '/resources', label: 'Resources', icon: BookOpen },
    ]

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/80 backdrop-blur-xl shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo Section */}
                    <div className="flex items-center gap-8">
                        <Link href="/" prefetch={false} className="flex items-center gap-3 group">
                            <div className="bg-gradient-to-br from-advent-navy to-advent-cobalt text-white p-2 rounded-lg shadow-lg group-hover:shadow-advent-cobalt/30 transition-all duration-300">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-lg leading-none text-transparent bg-clip-text bg-gradient-to-r from-advent-navy to-advent-cobalt">
                                    QI Chief
                                </span>
                                <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                                    tracker
                                </span>
                            </div>
                        </Link>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        prefetch={false}
                                        className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2
                                            ${isActive
                                                ? 'text-advent-navy bg-advent-navy/5 font-bold'
                                                : 'text-slate-500 hover:text-advent-cobalt hover:bg-slate-50'
                                            }`}
                                    >
                                        <item.icon className={`w-4 h-4 ${isActive ? 'text-advent-green' : 'text-slate-400'}`} />
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>

                    {/* User Profile & Actions */}
                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex flex-col items-end">
                            <span className="text-xs font-bold text-slate-700 leading-none mb-1">
                                {userEmail?.split('@')[0]}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${role === 'Operator'
                                    ? 'bg-advent-cobalt/10 text-advent-cobalt border-advent-cobalt/20'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                {role || 'Viewer'}
                            </span>
                        </div>

                        <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block" />

                        <button
                            onClick={handleLogout}
                            className="group flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
                        >
                            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}
