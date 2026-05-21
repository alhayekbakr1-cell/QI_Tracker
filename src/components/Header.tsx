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
        <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl shadow-2xs border-b border-slate-200/50 transition-all duration-300">
            {/* Upper Tier: Institutional branding and User Session Profile */}
            <div className="w-full bg-slate-50/80 border-b border-slate-200/20 py-1.5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-advent-green animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                            AdventHealth GME Clinical Quality & Scholarly Registry
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-4 text-[10px] font-bold text-slate-600">
                        <div className="flex items-center gap-2 border-r border-slate-200/40 pr-4">
                            <span className="font-serif italic font-semibold text-slate-800 text-[11px]">
                                {displayName}
                            </span>
                            <span className={`text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded border shadow-3xs ${
                                role === 'Admin'
                                    ? 'bg-rose-500/5 text-rose-600 border-rose-200/40'
                                    : role === 'Faculty'
                                        ? 'bg-emerald-500/5 text-emerald-600 border-emerald-200/40'
                                        : 'bg-advent-cobalt/5 text-advent-cobalt border-advent-cobalt/10'
                            }`}>
                                {role === 'Admin' ? 'Overseer' : role || 'Viewer'}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="group flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-650 transition-all"
                        >
                            <LogOut className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Lower Tier: Main Branding and Navigation Links */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-14 items-center">
                    {/* Logo Section */}
                    <div className="flex items-center gap-6">
                        <Link href="/" prefetch={false} className="flex items-center gap-2.5 group">
                            <div className="bg-gradient-to-br from-advent-navy to-advent-cobalt text-white p-1.5 rounded-lg border border-white/10 transition-all duration-300">
                                <Activity className="w-3.5 h-3.5 text-advent-green" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-serif italic font-bold text-base tracking-tight text-advent-navy leading-none">
                                    QI Chief
                                </span>
                                <span className="text-[8px] font-black tracking-[0.2em] text-slate-400 uppercase leading-none mt-0.5">
                                    academic tracker
                                </span>
                            </div>
                        </Link>

                        <div className="hidden lg:flex items-center gap-2">
                            <span className="text-slate-300">/</span>
                            <span className="text-[8px] font-black uppercase tracking-[0.15em] bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-200/30">
                                {getPageTitle(pathname)}
                            </span>
                        </div>
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
                                    className={`relative px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 border
                                        ${isActive
                                            ? 'bg-slate-50 text-advent-navy border-slate-200/80 shadow-3xs font-black'
                                            : 'text-slate-500 hover:text-advent-navy hover:bg-slate-50/50 border-transparent font-bold'
                                        }`}
                                >
                                    <item.icon className={`w-3.5 h-3.5 ${isActive ? 'text-advent-navy' : 'text-slate-400'}`} />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Mobile Menu Toggle Button */}
                    <div className="flex items-center gap-3 md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-1.5 text-advent-navy hover:bg-slate-100 rounded-lg transition-colors border border-slate-200/60"
                        >
                            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Dropdown Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-200/40 shadow-xl p-4 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200 z-50">
                    <nav className="flex flex-col gap-1.5">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    prefetch={false}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all border
                                        ${isActive
                                            ? 'bg-slate-50 text-advent-navy border-slate-200/60 shadow-2xs'
                                            : 'text-slate-600 hover:bg-slate-50/50 border-transparent'
                                        }`}
                                >
                                    <item.icon className={`w-4 h-4 ${isActive ? 'text-advent-navy' : 'text-slate-400'}`} />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="border-t border-slate-200/60 pt-4 mt-2">
                        <div className="flex items-center justify-between px-2 mb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <span>Signed in as</span>
                            <span className="font-serif italic font-bold text-slate-800 tracking-tight lowercase">{userEmail}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-rose-100 transition-colors border border-rose-200/40"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </header>
    )
}
