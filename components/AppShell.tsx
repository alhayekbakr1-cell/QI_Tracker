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

    useEffect(() => {
        const supabase = createClient()

        async function fetchProfile(userId: string) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, full_name')
                .eq('id', userId)
                .single()
            if (profile) {
                setRole(profile.role)
                setFullName(profile.full_name)
            }
        }

        async function checkAuth() {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            if (user) await fetchProfile(user.id)
            setIsLoading(false)
        }
        checkAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                await fetchProfile(session.user.id)
            } else {
                setRole('Viewer')
                setFullName(null)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>
    }

    return (
        <>
            {user && <Header userEmail={user.email} role={role} fullName={fullName} />}
            <main clas