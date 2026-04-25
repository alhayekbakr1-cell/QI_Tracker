"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Project } from "@/types"
import { BellRing, Loader2, CheckCircle2, AlertTriangle, Users, Clock, Send } from "lucide-react"
import emailjs from "@emailjs/browser"
import { differenceInDays, format } from "date-fns"

interface StaleProject {
  project: Project
  daysSince: number
  recipientEmails: string[]
  status: "pending" | "sending" | "sent" | "error"
}

const STALE_THRESHOLD_DAYS = 30
const EMAILJS_SERVICE = "service_cmylzni"
const EMAILJS_TEMPLATE = "template_zp4ihsn"
const EMAILJS_KEY = "FUMeORBrHGR5uaims"

export default function StaleNudgePanel() {
  const supabase = createClient()
  const [staleProjects, setStaleProjects] = useState<StaleProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSendingAll, setIsSendingAll] = useState(false)
  const [sentCount, setSentCount] = useState(0)

  useEffect(() => {
    async function loadStale() {
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .not("status", "eq", "Impacted (Completed)")
        .order("last_updated_date", { ascending: true })

      if (!projects) { setIsLoading(false); return }

      const now = new Date()
      const stale = projects
        .filter(p => differenceInDays(now, new Date(p.last_updated_date)) >= STALE_THRESHOLD_DAYS)
        .map(p => {
          // Build fallback emails from lead proponent names
          const fallbackEmails = (p.lead_proponents || []).map(
            (name: string) => name.replace(/ /g, ".") + "@AdventHealth.com"
          )
          return {
            project: p as Project,
            daysSince: differenceInDays(now, new Date(p.last_updated_date)),
            recipientEmails: fallbackEmails,
            status: "pending" as const,
          }
        })

      // Enrich with directory emails where possible
      const allNames = stale.flatMap(s => s.project.lead_proponents)
      if (allNames.length > 0) {
        const { data: dirEntries } = await supabase
          .from("directory")
          .select("name, email")
          .in("name", allNames)

        if (dirEntries && dirEntries.length > 0) {
          const emailMap: Record<string, string> = {}
          dirEntries.forEach(d => { emailMap[d.name] = d.email })
          stale.forEach(s => {
            const enriched = s.project.lead_proponents
              .map((n: string) => emailMap[n] || n.replace(/ /g, ".") + "@AdventHealth.com")
            s.recipientEmails = enriched
          })
        }
      }

      setStaleProjects(stale)
      setIsLoading(false)
    }
    loadStale()
  }, [supabase])

  async function nudgeOne(index: number) {
    const item = staleProjects[index]
    setStaleProjects(prev => prev.map((s, i) => i === index ? { ...s, status: "sending" } : s))

    try {
      await emailjs.send(
        EMAILJS_SERVICE,
        EMAILJS_TEMPLATE,
        {
          // TEST MODE: always sends to director's email
          lead_email: "bakr.alhayek.md@adventhealth.com",
          to_name: item.project.lead_proponents[0] || "Resident",
          project_title: item.project.title,
          days_inactive: item.daysSince,
          last_update: format(new Date(item.project.last_updated_date), "MMM d, yyyy"),
          message: `Your QI project "${item.project.title}" hasn't been updated in ${item.daysSince} days. Please log in to the QI Tracker and add your latest updates, data points, or barriers to keep your project current.`,
          reply_to: "noreply@qitracker.com",
        },
        EMAILJS_KEY
      )
      setStaleProjects(prev => prev.map((s, i) => i === index ? { ...s, status: "sent" } : s))
      setSentCount(c => c + 1)
    } catch (err) {
      console.error("Nudge error:", err)
      setStaleProjects(prev => prev.map((s, i) => i === index ? { ...s, status: "error" } : s))
    }
  }

  async function nudgeAll() {
    setIsSendingAll(true)
    for (let i = 0; i < staleProjects.length; i++) {
      if (staleProjects[i].status !== "sent") {
        await nudgeOne(i)
        // Small delay to avoid rate-limiting
        await new Promise(r => setTimeout(r, 600))
      }
    }
    setIsSendingAll(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-6 text-slate-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading stale projects...
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <BellRing className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">Stale Project Nudger</h3>
            <p className="text-[10px] text-slate-400 font-medium">
              Projects not updated in {STALE_THRESHOLD_DAYS}+ days
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {sentCount > 0 && (
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
              {sentCount} nudge{sentCount !== 1 ? "s" : ""} sent
            </span>
          )}
          {staleProjects.length > 0 && (
            <button
              onClick={nudgeAll}
              disabled={isSendingAll || staleProjects.every(s => s.status === "sent")}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-xs font-black rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {isSendingAll
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</>
                : <><Send className="w-3.5 h-3.5" /> Nudge All ({staleProjects.filter(s => s.status !== "sent").length})</>
              }
            </button>
          )}
        </div>
      </div>

      {/* Project list */}
      {staleProjects.length === 0 ? (
        <div className="py-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">No stale projects!</p>
          <p className="text-xs text-slate-400 mt-1">All active projects were updated within the last {STALE_THRESHOLD_DAYS} days.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {staleProjects.map((item, i) => (
            <div key={item.project.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50/50 transition-colors">
              {/* Staleness indicator */}
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.daysSince > 60 ? "bg-rose-500" : "bg-amber-400"}`} />

              {/* Project info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{item.project.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {item.project.lead_proponents.length > 0 && (
                    <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                      <Users className="w-3 h-3" /> {item.project.lead_proponents.join(", ")}
                    </span>
                  )}
                  <span className={`text-[10px] font-black flex items-center gap-1 ${item.daysSince > 60 ? "text-rose-600" : "text-amber-600"}`}>
                    <Clock className="w-3 h-3" /> {item.daysSince}d stale
                  </span>
                </div>
              </div>

              {/* Recipients */}
              <div className="hidden md:block text-[10px] text-slate-400 text-right max-w-[180px] truncate">
                {item.recipientEmails.join(", ")}
              </div>

              {/* Action button */}
              <button
                onClick={() => nudgeOne(i)}
                disabled={item.status === "sending" || item.status === "sent" || isSendingAll}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex-shrink-0 ${
                  item.status === "sent"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : item.status === "error"
                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                } disabled:opacity-50`}
              >
                {item.status === "sending" ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Sending</>
                ) : item.status === "sent" ? (
                  <><CheckCircle2 className="w-3 h-3" /> Sent</>
                ) : item.status === "error" ? (
                  <><AlertTriangle className="w-3 h-3" /> Retry</>
                ) : (
                  <><BellRing className="w-3 h-3" /> Nudge</>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {staleProjects.length > 0 && (
        <div className="px-6 py-3 bg-amber-50/50 border-t border-amber-100">
          <p className="text-[10px] text-amber-700 font-medium">
            ⚠️ Currently in test mode — all emails route to bakr.alhayek.md@adventhealth.com for verification. Remove the override in StaleNudgePanel.tsx to send to residents.
          </p>
        </div>
      )}
    </div>
  )
}
