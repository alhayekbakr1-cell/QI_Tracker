"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { Bell, CheckCheck, Shield, MessageSquare, BellRing, Info, X, ExternalLink } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  project_id: string | null
  is_read: boolean
  created_at: string
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  faculty_approval: { icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50" },
  comment:          { icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50" },
  nudge:            { icon: BellRing, color: "text-amber-600", bg: "bg-amber-50" },
  stale_warning:    { icon: BellRing, color: "text-rose-600", bg: "bg-rose-50" },
  general:          { icon: Info, color: "text-slate-600", bg: "bg-slate-50" },
}

export default function NotificationBell({ userId }: { userId: string }) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.is_read).length

  // Load notifications + subscribe to realtime
  useEffect(() => {
    if (!userId) return

    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30)
      setNotifications((data || []) as Notification[])
    }
    load()

    // Realtime subscription for new notifications
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase])

  // Close panel on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read).map(n => n.id)
    if (!unread.length) return
    await supabase.from("notifications").update({ is_read: true }).in("id", unread)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => { setIsOpen(o => !o); if (!isOpen && unreadCount > 0) markAllRead() }}
        className="relative p-2 rounded-lg text-slate-500 hover:text-advent-navy hover:bg-slate-100 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl shadow-slate-900/15 border border-slate-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] font-bold text-advent-navy hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.general
                const Icon = config.icon
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`flex gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-default border-b border-slate-50 last:border-0 ${
                      !n.is_read ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${config.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-bold leading-snug ${!n.is_read ? "text-slate-900" : "text-slate-600"}`}>
                          {n.title}
                        </p>
                        {n.project_id && (
                          <Link
                            href={`/projects/view?id=${n.project_id}`}
                            onClick={() => setIsOpen(false)}
                            className="flex-shrink-0 text-slate-300 hover:text-advent-navy transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
