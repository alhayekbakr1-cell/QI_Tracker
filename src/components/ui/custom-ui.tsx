"use client"

import React, { useState, useEffect } from 'react'
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react'

// --- SKELETON COMPONENT ---
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-slate-200/80 ${className}`}
      {...props}
    />
  )
}

// --- TOAST TYPES AND EVENT-BASED EMITTER ---
export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
}

const TOAST_EVENT = 'ah_qi_custom_toast_event'

export const toast = {
  success: (message: string) => dispatchToast(message, 'success'),
  error: (message: string) => dispatchToast(message, 'error'),
  info: (message: string) => dispatchToast(message, 'info'),
  warning: (message: string) => dispatchToast(message, 'warning'),
}

function dispatchToast(message: string, type: ToastType) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent(TOAST_EVENT, { detail: { message, type } })
    window.dispatchEvent(event)
  }
}

// --- TOAST CONTAINER COMPONENT ---
export function CustomToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const handleToast = (e: Event) => {
      const { message, type } = (e as CustomEvent).detail
      const id = Math.random().toString(36).substring(2, 9)
      setToasts((prev) => [...prev, { id, message, type }])

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4000)
    }

    window.addEventListener(TOAST_EVENT, handleToast)
    return () => window.removeEventListener(TOAST_EVENT, handleToast)
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const styles = {
          success: 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-100',
          error: 'bg-rose-50 border-rose-200 text-rose-800 shadow-rose-100',
          warning: 'bg-amber-50 border-amber-200 text-amber-800 shadow-amber-100',
          info: 'bg-blue-50 border-blue-200 text-blue-800 shadow-blue-100',
        }[t.type]

        const Icon = {
          success: CheckCircle,
          error: AlertCircle,
          warning: AlertTriangle,
          info: Info,
        }[t.type]

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${styles}`}
          >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs font-bold leading-relaxed">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 rounded-lg p-0.5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

// --- CUSTOM DIALOG COMPONENT ---
interface CustomConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'info'
}

export function CustomConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'info',
}: CustomConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onCancel} />

      {/* Modal Card */}
      <div className="relative bg-white max-w-md w-full rounded-3xl border border-slate-100 p-8 shadow-2xl z-10 animate-in zoom-in-95 duration-200 flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              variant === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-advent-navy'
            }`}
          >
            {variant === 'danger' ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <Info className="w-6 h-6" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">{title}</h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
                : 'bg-advent-navy hover:bg-advent-cobalt shadow-advent-navy/10'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
