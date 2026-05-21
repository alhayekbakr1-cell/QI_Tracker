"use client"

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import Header from '@/components/Header'
import QIConsultantChat from '@/components/QIConsultantChat'
import { CustomToastContainer } from '@/components/ui/custom-ui'

export default function AppShell({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<any>(null)
    const [role, setRole] = useState<string>('Viewer')
    const [fullName, setFullName] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function checkAuth() {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, full_name')
                    .eq('id', user.id)
                    .single()
                if (profile) {
                    setRole(profile.role)
                    setFullName(profile.full_name)
                }
            }
            setIsLoading(false)
        }
        checkAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (!session?.user) {
                setRole('Viewer')
            }
        })

        return () => subscription.unsubscribe()
    }, [supabase, router])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col p-6 animate-pulse">
                {/* Header Skeleton */}
                <div className="h-16 bg-white border border-slate-200/60 rounded-3xl mb-8 flex items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
                        <div className="h-4 w-24 bg-slate-200 rounded-md animate-pulse" />
                    </div>
                    <div className="flex gap-4">
                        <div className="w-16 h-3 bg-slate-200 rounded animate-pulse" />
                        <div className="w-16 h-3 bg-slate-200 rounded animate-pulse" />
                        <div className="w-16 h-3 bg-slate-200 rounded animate-pulse" />
                    </div>
                </div>
                {/* Body Layout Skeleton */}
                <div className="flex-1 max-w-7xl w-full mx-auto space-y-8">
                    <div className="h-12 bg-slate-200 rounded-2xl w-1/3 animate-pulse" />
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-32 bg-white border border-slate-200 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                    <div className="h-96 bg-white border border-slate-200 rounded-[2.5rem] animate-pulse" />
                </div>
            </div>
        )
    }

    return (
        <>
            {user && <Header userEmail={user.email} role={role} fullName={fullName} />}
            <main className="flex-1 flex flex-col">
                {children}
            </main>
            {user && <QIConsultantChat />}
            <CustomToastContainer />
        </>
    )
}

