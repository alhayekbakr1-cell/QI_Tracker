"use client"

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import Header from '@/components/Header'
import QIConsultantChat from '@/components/QIConsultantChat'

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
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>
    }

    return (
        <>
            {user && <Header userEmail={user.email} role={role} fullName={fullName} />}
            <main className="flex-1 flex flex-col">
                {children}
            </main>
            {user && <QIConsultantChat />}
        </>
    )
}
