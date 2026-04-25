"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Save, FileText, CheckCircle2, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { Project } from "@/types"
import { askAI } from "@/utils/ai"

interface Charter {
  problemStatement: string
  aimStatement: string
  teamMembers: string
  scopeIn: string
  scopeOut: string
  timeline: string
  resources: string
  successMeasures: string
}

const EMPTY_CHARTER: Charter = {
  problemStatement: "",
  aimStatement: "",
  teamMembers: "",
  scopeIn: "",
  scopeOut: "",
  timeline: "",
  resources: "",
  successMeasures: "",
}

const SECTIONS: { key: keyof Charter; label: string; placeholder: string; hint: string }[] = [
  {
    key: "problemStatement",
    label: "Problem Statement",
    placeholder: "Describe the specific problem and its impact on patients or care quality...",
    hint: "What is the gap between current and desired performance? Include data if available.",
  },
  {
    key: "aimStatement",
    label: "SMART Aim Statement",
    placeholder: "By [date], we will improve [measure] from [baseline] to [goal]...",
    hint: "Specific, Measurable, Achievable, Relevant, Time-bound.",
  },
  {
    key: "teamMembers",
    label: "Team Members & Roles",
    placeholder: "Project Lead: ...\nFaculty Advisor: ...\nData Support: ...",
    hint: "List each team member and their specific role in the project.",
  },
  {
    key: "scopeIn",
    label: "In Scope",
    placeholder: "What IS included in this project...",
    hint: "Define the boundaries — patient population, care setting, time period.",
  },
  {
    key: "scopeOut",
    label: "Out of Scope",
    placeholder: "What is NOT included in this project...",
    hint: "Explicitly naming exclusions prevents scope creep.",
  },
  {
    key: "timeline",
    label: "Timeline & Milestones",
    placeholder: "Month 1: Baseline data collection\nMonth 2-3: PDSA Cycle 1\nMonth 4: Analysis...",
    hint: "List key milestones with target dates.",
  },
  {
    key: "resources",
    label: "Resources Needed",
    placeholder: "Data access, IT support, faculty time, budget...",
    hint: "Identify what you need and who can provide it.",
  },
  {
    key: "successMeasures",
    label: "How Will We Know It Worked?",
    placeholder: "Primary outcome measure: ...\nProcess measure: ...\nBalancing measure: ...",
    hint: "List your process, outcome, and balancing measures.",
  },
]

export default function ProjectCharter({ project }: { project: Project }) {
  const storageKey = `qi-charter-${project.id}`
  const [charter, setCharter] = useState<Charter>(EMPTY_CHARTER)
  const [saved, setSaved] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [completionPct, setCompletionPct] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      try { setCharter(JSON.parse(stored)) } catch {}
    }
  }, [storageKey])

  useEffect(() => {
    const filled = Object.values(charter).filter(v => v.trim().length > 0).length
    setCompletionPct(Math.round((filled / SECTIONS.length) * 100))
  }, [charter])

  function update(key: keyof Charter, value: string) {
    setSaved(false)
    setCharter(prev => ({ ...prev, [key]: value }))
  }

  function save() {
    localStorage.setItem(storageKey, JSON.stringify(charter))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function aiPrefill() {
    setIsGenerating(true)
    try {
      const prompt = `You are a QI Academic Consultant. Generate a complete IHI-style project charter for this QI project.

Project Title: ${project.title}
Category: ${project.category || "General"}
Primary Outcome: ${project.primary_outcome || "Not specified"}
Current Status: ${project.status}
Updates/Context: ${project.updates_and_barriers || "None"}
Team: ${project.proponents?.join(", ") || "Not specified"}
Faculty: ${project.faculty || "Not specified"}

Return ONLY a JSON object with these exact keys:
{
  "problemStatement": "...",
  "aimStatement": "...",
  "teamMembers": "...",
  "scopeIn": "...",
  "scopeOut": "...",
  "timeline": "...",
  "resources": "...",
  "successMeasures": "..."
}

Make each section substantive (2-4 sentences), professional, and specific to the project context. SMART aim should follow the format: By [month year], [measure] will improve from [X%] to [Y%] among [population] at AdventHealth.`

      const raw = await askAI(prompt)
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        setCharter(parsed)
        localStorage.setItem(storageKey, JSON.stringify(parsed))
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } catch (err) {
      console.error("Charter AI error:", err)
    }
    setIsGenerating(false)
  }

  const completionColor =
    completionPct >= 80 ? "bg-green-500" :
    completionPct >= 50 ? "bg-amber-400" :
    "bg-slate-300"

  return (
    <Card className="border-slate-200 shadow-sm border-2">
      <CardHeader className="pb-3">
        <button
          onClick={() => setIsOpen(o => !o)}
          className="flex items-center justify-between w-full text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#004F9F]/10 flex items-center justify-center">
              <FileText size={15} className="text-[#004F9F]" />
            </div>
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">
                Project Charter
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${completionColor}`}
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400">{completionPct}% complete</span>
              </div>
            </div>
          </div>
          <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0">
          <div className="flex gap-2 mb-6">
            <button
              onClick={aiPrefill}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#004F9F] text-white rounded-lg hover:bg-[#003d7a] transition-colors disabled:opacity-60"
            >
              {isGenerating ? (
                <><Loader2 size={12} className="animate-spin" /> Generating...</>
              ) : (
                <><Sparkles size={12} /> AI Pre-fill Charter</>
              )}
            </button>
            <button
              onClick={save}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              {saved ? (
                <><CheckCircle2 size={12} className="text-green-500" /> Saved</>
              ) : (
                <><Save size={12} /> Save Charter</>
              )}
            </button>
          </div>

          <div className="space-y-5">
            {SECTIONS.map(({ key, label, placeholder, hint }) => (
              <div key={key}>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                  {label}
                </label>
                <p className="text-[11px] text-slate-400 mb-1.5">{hint}</p>
                <textarea
                  value={charter[key]}
                  onChange={e => update(key, e.target.value)}
                  placeholder={placeholder}
                  rows={key === "teamMembers" || key === "timeline" ? 4 : 3}
                  className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#004F9F]/30 focus:border-[#004F9F] placeholder-slate-300 transition-all"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={save}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-[#004F9F] text-white rounded-xl hover:bg-[#003d7a] transition-colors"
            >
              {saved ? (
                <><CheckCircle2 size={14} /> Charter Saved!</>
              ) : (
                <><Save size={14} /> Save Charter</>
              )}
            </button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
