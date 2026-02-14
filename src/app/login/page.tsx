"use client"

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ShieldAlert, Mail, Lock, User, Info } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSignup, setIsSignup] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const validateDomain = (emailAddr: string) => {
        return emailAddr.toLowerCase().endsWith('@adventhealth.com')
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccess(null)

        const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (loginError) {
            setError(loginError.message)
            setIsLoading(false)
        } else {
            router.push('/')
            router.refresh()
        }
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccess(null)

        if (!validateDomain(email)) {
            setError("Registration is restricted to @adventhealth.com email addresses.")
            setIsLoading(false)
            return
        }

        if (!fullName.trim()) {
            setError("Please enter your full name.")
            setIsLoading(false)
            return
        }

        const { error: signupError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName.trim(),
                }
            }
        })

        if (signupError) {
            setError(signupError.message)
            setIsLoading(false)
        } else {
            setSuccess("Verification email sent! Please check your inbox.")
            setIsLoading(false)
        }
    }

    return (
        <div className="flex-1 min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-advent-blue to-advent-green" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-advent-blue/5 blur-3xl -mr-48 -mt-48 rounded-full" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-advent-green/5 blur-3xl -ml-32 -mb-32 rounded-full" />

            <div className="w-full max-w-md z-10 space-y-8">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center bg-gradient-to-br from-advent-blue to-advent-cobalt text-white w-14 h-14 rounded-2xl text-2xl font-black mb-4 shadow-xl shadow-advent-blue/20">
                        QI
                    </div>
                    <h1 className="text-4xl font-black text-advent-blue tracking-tight italic">AdventHealth</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-2">Resident Quality Improvement Tracker</p>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/60 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-100" />

                    <div className="mb-8 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800">
                            {isSignup ? "Create Account" : "Welcome Back"}
                        </h2>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            <ShieldAlert className="w-3 h-3" />
                            Secure Access
                        </div>
                    </div>

                    <form onSubmit={isSignup ? handleSignup : handleLogin} className="flex flex-col gap-6">
                        {isSignup && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                                    Full Name
                                </label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-advent-blue transition-colors" />
                                    <input
                                        className="w-full rounded-xl pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-advent-blue focus:ring-4 focus:ring-advent-blue/10 outline-none transition-all placeholder:text-slate-400 font-medium"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Dr. John Doe"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                                Institutional Email
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-advent-blue transition-colors" />
                                <input
                                    className="w-full rounded-xl pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-advent-blue focus:ring-4 focus:ring-advent-blue/10 outline-none transition-all placeholder:text-slate-400 font-medium"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@adventhealth.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                                Security Password
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-advent-blue transition-colors" />
                                <input
                                    className="w-full rounded-xl pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-advent-blue focus:ring-4 focus:ring-advent-blue/10 outline-none transition-all placeholder:text-slate-400 font-medium"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 mt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-advent-blue text-white py-4 rounded-xl font-bold hover:bg-advent-dark-blue active:scale-[0.98] transition-all shadow-xl shadow-advent-blue/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <span>{isSignup ? "Create Account" : "Secure Sign In"}</span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsSignup(!isSignup)
                                    setError(null)
                                    setSuccess(null)
                                }}
                                className="text-slate-400 py-1 text-[11px] font-bold hover:text-advent-blue transition-colors"
                            >
                                {isSignup ? "Already have an account? Sign In" : "New resident or faculty? Join System"}
                            </button>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 text-center rounded-xl border border-red-100 text-xs font-bold animate-in fade-in slide-in-from-top-1 duration-200">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-green-50 text-green-600 text-center rounded-xl border border-green-100 text-xs font-bold animate-in fade-in slide-in-from-top-1 duration-200">
                                {success}
                            </div>
                        )}
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <div className="flex items-start gap-3 text-slate-400">
                            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <p className="text-[10px] leading-relaxed font-medium">
                                Access is strictly restricted to verified **@adventhealth.com** personnel. Faculty registration automates elevated access.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100 flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">
                            PHI Data Integrity Warning
                        </h2>
                        <p className="text-[11px] text-amber-700/80 leading-relaxed font-medium">
                            DO NOT enter Protected Health Information (PHI). System is for aggregate tracker metrics ONLY.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

