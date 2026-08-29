"use client"

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ShieldAlert, Mail, User, Info, Loader2, ArrowRight, KeyRound } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [fullName, setFullName] = useState('')
    const [otpCode, setOtpCode] = useState('')
    const [showOtpInput, setShowOtpInput] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSignup, setIsSignup] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const validateDomain = (emailAddr: string) => {
        return emailAddr.trim().toLowerCase().endsWith('@adventhealth.com')
    }

    // STEP 1: Trigger the 6-Digit OTP Email
    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccess(null)

        try {
            if (!validateDomain(email)) {
                setError("Access is restricted to @adventhealth.com email addresses.")
                setIsLoading(false)
                return
            }

            if (isSignup && !fullName.trim()) {
                setError("Please enter your full academic name.")
                setIsLoading(false)
                return
            }

            if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                throw new Error("Supabase configuration is missing. Please check your environment variables.")
            }

            // Call Supabase native OTP endpoint
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email: email.trim().toLowerCase(),
                options: {
                    // Create account automatically on sign up, block creation on direct login
                    shouldCreateUser: isSignup, 
                    data: isSignup ? {
                        full_name: fullName.trim()
                    } : undefined
                }
            })

            if (otpError) {
                // Friendly error if they try logging in but have not registered yet
                if (otpError.message.includes("Signups are disabled") || otpError.message.includes("not authorized")) {
                    setError("Account not registered. Please click 'Register' below to create your academic profile first.")
                } else {
                    setError(otpError.message)
                }
                setIsLoading(false)
            } else {
                setSuccess(`Secure One-Time Passcode sent! Check your adventhealth.com inbox.`)
                setShowOtpInput(true)
                setIsLoading(false)
            }
        } catch (err: any) {
            console.error("OTP send catch block:", err)
            setError(err.message || "An unexpected error occurred.")
            setIsLoading(false)
        }
    }

    // STEP 2: Verify the 6-Digit Code
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccess(null)

        try {
            if (!otpCode.trim() || otpCode.trim().length !== 6) {
                setError("Please enter the complete 6-digit verification code.")
                setIsLoading(false)
                return
            }

            const { data, error: verifyError } = await supabase.auth.verifyOtp({
                email: email.trim().toLowerCase(),
                token: otpCode.trim(),
                type: 'email'
            })

            if (verifyError) {
                setError(verifyError.message === "Token has expired or is invalid" 
                    ? "Invalid or expired passcode. Please verify the code or request a new one." 
                    : verifyError.message)
                setIsLoading(false)
            } else {
                setSuccess("Access Granted! Loading your dashboard...")
                // Derive the basePath from where this page actually lives instead of
                // hardcoding /QI_Tracker/, which 404s on local dev where basePath is "".
                const basePath = window.location.pathname.replace(/\/login\/?$/, '')
                router.push('/')
                setTimeout(() => {
                    window.location.href = `${basePath}/`
                }, 500)
            }
        } catch (err: any) {
            console.error("OTP verify catch block:", err)
            setError(err.message || "An unexpected error occurred during verification.")
            setIsLoading(false)
        }
    }

    return (
        <div className="flex-1 min-h-screen flex flex-col items-center justify-center p-6 bg-[#F8FAFC] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-advent-navy via-advent-sky to-advent-green" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-advent-navy/5 blur-[120px] -mr-64 -mt-64 rounded-full" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-advent-green/5 blur-[100px] -ml-48 -mb-48 rounded-full" />

            <div className="w-full max-w-lg z-10 space-y-10">
                <div className="text-center space-y-4">
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="flex gap-1 animate-pulse duration-[3000ms]">
                                <div className="w-4 h-4 rounded-tr-xl rounded-bl-xl bg-advent-sky" />
                                <div className="w-4 h-4 rounded-tl-xl rounded-br-xl bg-advent-navy" />
                            </div>
                            <div className="flex gap-1 mt-1 animate-pulse duration-[4000ms]">
                                <div className="w-4 h-4 rounded-tl-xl rounded-br-xl bg-advent-green" />
                                <div className="w-4 h-4 rounded-tr-xl rounded-bl-xl bg-advent-cobalt" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-6xl font-black text-advent-navy tracking-tighter leading-none">
                            Advent<span className="text-advent-navy font-black">Health</span>
                        </h1>
                        <div className="flex items-center justify-center gap-3 mt-4">
                            <div className="h-px w-8 bg-slate-200" />
                            <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">Resident Project Tracker</p>
                            <div className="h-px w-8 bg-slate-200" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-50" />

                    <div className="mb-10 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                                {showOtpInput ? "Enter Passcode" : isSignup ? "Create Profile" : "Physician Portal"}
                            </h2>
                            <p className="text-slate-400 text-xs font-bold mt-2">Secure Academic Environment</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-advent-navy/5 text-advent-navy rounded-xl text-[9px] font-black uppercase tracking-wider border border-advent-navy/10">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Verified
                        </div>
                    </div>

                    <form onSubmit={showOtpInput ? handleVerifyOtp : handleSendCode} className="flex flex-col gap-8">
                        {!showOtpInput ? (
                            <>
                                {isSignup && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">
                                            Full Academic Name
                                        </label>
                                        <div className="relative group">
                                            <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-advent-navy transition-colors" />
                                            <input
                                                className="w-full rounded-2xl pl-12 pr-6 py-4.5 bg-slate-50 border border-slate-200 focus:border-advent-navy focus:ring-4 focus:ring-advent-navy/5 outline-none transition-all placeholder:text-slate-300 font-bold"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="e.g. Bakr Alhayek, MD"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">
                                        Institutional Email
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-advent-navy transition-colors" />
                                        <input
                                            className="w-full rounded-2xl pl-12 pr-6 py-4.5 bg-slate-50 border border-slate-200 focus:border-advent-navy focus:ring-4 focus:ring-advent-navy/5 outline-none transition-all placeholder:text-slate-300 font-bold"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@adventhealth.com"
                                            required
                                        />
                                        {email && !validateDomain(email) && isSignup && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-red-500 uppercase">
                                                Invalid Domain
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">
                                        6-Digit Verification Code
                                    </label>
                                    <div className="relative group">
                                        <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-advent-navy transition-colors animate-pulse" />
                                        <input
                                            className="w-full rounded-2xl pl-12 pr-6 py-4.5 bg-slate-50 border border-slate-200 focus:border-advent-navy focus:ring-4 focus:ring-advent-navy/5 outline-none transition-all placeholder:text-slate-300 font-black text-lg text-center tracking-[0.4em]"
                                            type="text"
                                            maxLength={6}
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                            placeholder="000000"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed px-1">
                                    We emailed a secure passcode to <strong className="text-advent-navy">{email.toLowerCase()}</strong>. Code expires in 15 minutes. Be sure to check your spam or junk folder.
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-5 mt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-advent-navy text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-advent-cobalt active:scale-[0.98] transition-all shadow-xl shadow-advent-navy/20 disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden group"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                                        <span>Verifying...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{showOtpInput ? "Verify & Access" : isSignup ? "Register & Send Code" : "Send Login Code"}</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            {showOtpInput ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowOtpInput(false)
                                        setOtpCode('')
                                        setError(null)
                                        setSuccess(null)
                                    }}
                                    className="text-slate-400 py-2 text-xs font-black uppercase tracking-[0.2em] hover:text-slate-600 transition-colors"
                                >
                                    Change Email Address
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSignup(!isSignup)
                                        setError(null)
                                        setSuccess(null)
                                    }}
                                    className="text-slate-400 py-2 text-xs font-black uppercase tracking-[0.2em] hover:text-advent-navy transition-colors"
                                >
                                    {isSignup ? "Existing Member? Sign In" : "New Faculty or Resident? Register"}
                                </button>
                            )}
                        </div>

                        {error && (
                            <div className="p-5 bg-red-50 text-red-600 text-center rounded-2xl border border-red-100 text-xs font-black tracking-wide animate-in fade-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-5 bg-emerald-50 text-emerald-600 text-center rounded-2xl border border-emerald-100 text-xs font-black tracking-wide animate-in fade-in slide-in-from-top-2">
                                {success}
                            </div>
                        )}
                    </form>

                    <div className="mt-10 pt-8 border-t border-slate-100">
                        <div className="flex items-start gap-4 text-slate-400 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            <Info className="w-5 h-5 mt-0.5 flex-shrink-0 text-advent-sky" />
                            <p className="text-[10px] leading-relaxed font-bold">
                                Access is restricted to institutional personnel. One-Time Passcodes inherit corporate-grade inbox MFA policies with zero database passwords saved.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex gap-5">
                    <div className="flex-shrink-0 w-12 h-12 bg-amber-100/50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-200">
                        <ShieldAlert className="w-6 h-6 outline-none" />
                    </div>
                    <div>
                        <h2 className="text-[10px] font-black text-amber-800 uppercase tracking-[0.2em] mb-1">
                            HIPAA & PHI Compliance
                        </h2>
                        <p className="text-[11px] text-amber-700/70 leading-relaxed font-bold">
                            DO NOT enter Protected Health Information. This dashboard is for aggregate metrics and initiative tracking ONLY.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
