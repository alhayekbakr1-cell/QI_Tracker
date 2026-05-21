"use client"

import { createClient } from '@/utils/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, LayoutDashboard, List, BookOpen, Activity, Menu, X, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface HeaderProps {
    userEmail?: string;
    role?: string;
    fullName?: string | null;
}

export default function Header({ userEmail, role, fullName }: HeaderProps) {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const formatName = (email?: string, name?: string | null) => {
        if (name) return name;
        if (!email) return "User";
        // Clean dots and capitalize parts for dot-formatted emails
        return email.split('@')[0]
            .split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    };

    const displayName = formatName(userEmail, fullName);

    const getPageTitle = (path: string) => {
        if (path === '/') return 'Overview';
        if (path === '/projects') return 'Projects';
        if (path === '/projects/kanban') return 'Pipeline';
        if (path.startsWith('/projects/view')) return 'Detail';
        if (path.startsWith('/projects/new')) return 'New Initiative';
        if (path.startsWith('/projects/edit')) return 'Edit Initiative';
        if (path === '/metrics') return 'Analytics';
        if (path === '/portfolio') return 'My Portfolio';
        if (path === '/resources') return 'Resources';
        if (path === '/faculty') return 'Faculty Portal';
        if (path === '/admin') return 'Admin Panel';
        if (path === '/admin/dashboard') return 'Intelligence';
        return 'Dashboard';
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const navItems = [
        { href: '/', label: 'Overview', icon: LayoutDashboard },
        { href: '/projects', label: 'Projects', icon: List },
        { href: '/impact', label: 'Impact', icon: Activity },
        { href: '/portfolio', label: 'My Portfolio', icon: BookOpen },
        { href: '/resources', label: 'Resources', icon: BookOpen },
        ...(role === 'Faculty' ? [{ href: '/faculty', label: 'Faculty Portal', icon: Users }] : []),
        ...(role === 'Admin' ? [
            { href: '/admin', label: 'Admin', icon: Users },
            { href: '/admin/dashboard', label: 'Intelligence', icon: TrendingUp }
        ] : []),
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

                        <div className="hidden lg:flex items-center gap-2">
                            <span className="text-slate-300">/</span>
                            <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100/80 text-advent-navy px-3 py-1 rounded-full border border-slate-200/60 shadow-sm animate-in fade-in slide-in-from-left-2 duration-300">
                                {getPageTitle(pathname)}
                            </span>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1.5">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        prefetch={false}
                                        className={`relative px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2 border
                                            ${isActive
                                                ? 'bg-advent-navy/10 text-advent-navy border-advent-navy/10 shadow-sm'
                                                : 'text-slate-500 hover:text-advent-navy hover:bg-slate-50 border-transparent'
                                            }`}
                                    >
                                        <item.icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-advent-navy' : 'text-slate-400'}`} />
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 text-advent-navy hover:bg-slate-100 rounded-lg transition-colors border border-slate-100"
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>

                        {/* User Profile & Actions (Desktop) */}
                        <div className="hidden md:flex items-center gap-6">
                            <div className="flex flex-col items-end">
                                <span className="text-[11px] font-black text-slate-800 tracking-tight leading-none mb-1">
                                    {displayName}
                                </span>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border shadow-sm ${role === 'Admin'
                                    ? 'bg-rose-500/10 text-rose-600 border-rose-200'
                                    : role === 'Faculty'
                                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                                        : role === 'Operator'
                                            ? 'bg-advent-cobalt/10 text-advent-cobalt border-advent-cobalt/20'
                                            : 'bg-slate-100 text-slate-500 border-slate-200'
                                    }`}>
                                    {role === 'Admin' ? 'Overseer' : role || 'Viewer'}
                                </span>
                            </div>
                            <div className="h-8 w-px bg-slate-200" />
                            <button
                                onClick={handleLogout}
                                className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-rose-600 transition-all px-4 py-2 rounded-xl hover:bg-rose-50"
                            >
                                <LogOut className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-xl p-4 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
                    <nav className="flex flex-col gap-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    prefetch={false}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all
                                        ${isActive
                                            ? 'bg-advent-navy text-white shadow-md shadow-advent-navy/20'
                                            : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-advent-green' : 'text-slate-400'}`} />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="border-t border-slate-100 pt-4 mt-2">
                        <div className="flex items-center justify-between px-2 mb-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Signed in as</span>
                            <span className="text-sm font-bold text-advent-navy">{userEmail?.split('@')[0]}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </header>
    )
}
