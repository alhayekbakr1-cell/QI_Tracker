"use client"

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

interface Notification {
    id: string;
    user_id: string;
    title: string;
    body: string | null;
    type: string | null;
    resource_id: string | null;
    read: boolean;
    created_at: string;
}

export default function NotificationBell({ userId }: { userId: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const supabase = createClient();

        // Load existing notifications
        supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(20)
            .then(({ data }) => {
                const items = (data || []) as Notification[];
                setNotifications(items);
                setUnreadCount(items.filter(n => !n.read).length);
            });

        // Subscribe to new notifications in real-time
        const channel = supabase
            .channel("user-notifications")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const newNotif = payload.new as Notification;
                    setNotifications(prev => [newNotif, ...prev]);
                    setUnreadCount(c => c + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    const markAllRead = async () => {
        const supabase = createClient();
        await supabase
            .from("notifications")
            .update({ read: true })
            .eq("user_id", userId)
            .eq("read", false);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:text-advent-navy hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown panel */}
                    <div className="absolute right-0 top-10 z-50 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">
                                Notifications
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-[10px] font-black text-advent-blue hover:underline uppercase tracking-widest"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                            {notifications.length === 0 ? (
                                <div className="py-10 text-center">
                                    <Bell className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        No notifications yet
                                    </p>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className={`px-4 py-3 flex gap-3 transition-colors ${n.read ? "bg-white" : "bg-blue-50/40"}`}
                                    >
                                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.read ? "bg-transparent" : "bg-advent-blue"}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-800 leading-snug">{n.title}</p>
                                            {n.body && (
                                                <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-2">{n.body}</p>
                                            )}
                                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                                                {timeAgo(n.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
