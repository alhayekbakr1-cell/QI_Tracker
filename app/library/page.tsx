"use client"

import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import { Project } from "@/types"
import StatusBadge from "@/components/StatusBadge"
import Link from "next/link"
import {
  Search, ArrowLeft, BookOpen, Users, TrendingUp,
  Filter, ChevronRight, Award, Lightbulb, X
} from "lucide-react"

const CATEGORIES = ["All", "Inpatient", "Outpatient", "Perioperative", "ED", "ICU", "Other"]
const STATUSES = ["All", "Idea", "Pre-Intervention", "Intervention Ongoing", "Sustain the Gains", "Impacted (Completed)"]

export default function LibraryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      const { data } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false })
      setProjects((data || []) as Project[])
      setIsLoading(false)
    }
    load()
  }, [supabase, router])

  const filtered = useMemo(() => {
    return projects.filter(p => {
      const matchSearch = !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.primary_outcome || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.faculty || "").toLowerCase().includes(search.toLowerCase()) ||
        p.proponents.some(pr => pr.toLowerCase().includes(search.toLowerCase()))
      const matchCat = categoryFilter === "All" || p.category === categoryFilter
      const matchStatus = statusFilter === "All" || p.status === statusFilter
      return matchSearch && matchCat && matchStatus
    })
  }, [projects, search, categoryFilter, statusFilter])

  const stats = useMemo(() => ({
    total: projects.length,
    completed: projects.filter(p => p.status === "Impacted (Completed)").length,
    active: projects.filter(p => ["Intervention Ongoing", "Sustain the Gains"].includes(p.status)).length,
    patientsImpacted: projects.reduce((sum, p) => sum + (p.total_patients_impacted || 0), 0),
  }), [projects])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-[#004F9F] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#004F9F] flex items-center justify-center">
              <BookOpen size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900">Project Library</h1>
              <p className="text-[11px] text-slate-400 font-medium">Searchable archive of all QI projects</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Projects", value: stats.total, icon: <BookOpen size={14} />, color: "text-[#004F9F]" },
            { label: "Completed", value: stats.completed, icon: <Award size={14} />, color: "text-emerald-600" },
            { label: "Active", value: stats.active, icon: <TrendingUp size={14} />, color: "text-amber-500" },
            { label: "Patients Impacted", value: stats.patientsImpacted.toLocaleString(), icon: <Users size={14} />, color: "text-purple-600" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div className={`flex items-center gap-1.5 ${s.color} mb-1`}>
                {s.icon}
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{s.label}</span>
              </div>
              <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, outcome, faculty, or resident name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004F9F]/30 focus:border-[#004F9F] placeholder-slate-300"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter size={12} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</span>
              <div className="flex gap-1 flex-wrap">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-full border transition-all ${
                      categoryFilter === cat
                        ? "bg-[#004F9F] text-white border-[#004F9F]"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-1 flex-wrap">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-full border transition-all ${
                  statusFilter === s
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          {filtered.length} project{filtered.length !== 1 ? "s" : ""} found
        </div>

        <div className="grid gap-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <Lightbulb size={28} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-bold text-sm">No projects match your search</p>
              <p className="text-slate-300 text-xs mt-1">Try adjusting the filters or search terms</p>
            </div>
          ) : (
            filtered.map(project => (
              <div
                key={project.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[#004F9F]/20 transition-all cursor-pointer group"
                onClick={() => setSelectedProject(selectedProject?.id === project.id ? null : project)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <StatusBadge status={project.status} />
                        {project.category && (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {project.category}
                          </span>
                        )}
                        {project.pdsa_cycle > 0 && (
                          <span className="text-[10px] font-bold text-[#004F9F] bg-[#004F9F]/10 px-2 py-0.5 rounded-full">
                            PDSA ×{project.pdsa_cycle}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-black text-slate-900 leading-snug group-hover:text-[#004F9F] transition-colors">
                        {project.title}
                      </h3>
                      {project.primary_outcome && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {project.primary_outcome}
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      size={16}
                      className={`text-slate-300 group-hover:text-[#004F9F] flex-shrink-0 transition-all mt-1 ${
                        selectedProject?.id === project.id ? "rotate-90" : ""
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    {project.faculty && (
                      <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        <Users size={10} className="text-slate-400" />
                        {project.faculty}
                      </span>
                    )}
                    {project.proponents.length > 0 && (
                      <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        <Users size={10} className="text-slate-400" />
                        {project.proponents.slice(0, 2).join(", ")}
                        {project.proponents.length > 2 && ` +${project.proponents.length - 2}`}
                      </span>
                    )}
                    {project.total_patients_impacted ? (
                      <span className="text-[10px] text-emerald-600 font-bold">
                        {project.total_patients_impacted.toLocaleString()} pts impacted
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Expanded detail */}
                {selectedProject?.id === project.id && (
                  <div className="border-t border-slate-100 px-4 py-4 space-y-3 bg-slate-50/50 rounded-b-2xl">
                    {project.updates_and_barriers && (
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Updates & Barriers</span>
                        <p className="text-xs text-slate-600 leading-relaxed">{project.updates_and_barriers}</p>
                      </div>
                    )}
                    {project.abstract_summary && (
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Abstract Summary</span>
                        <p className="text-xs text-slate-600 leading-relaxed">{project.abstract_summary}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Link
                        href={`/projects/view?id=${project.id}`}
                        onClick={e => e.stopPropagation()}
                        className="px-3 py-1.5 text-xs font-bold bg-[#004F9F] text-white rounded-lg hover:bg-[#003d7a] transition-colors"
                      >
                        Open Full Project →
                      </Link>
                      {project.protocol_url && (
                        <a
                          href={project.protocol_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="px-3 py-1.5 text-xs font-bold bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                        >
                          View Protocol
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
