"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine
} from "recharts"
import { TrendingUp, BarChart2 } from "lucide-react"
import { Metric } from "@/types"

interface MetricChartsProps {
  data: Metric[]
}

function calcMedian(vals: number[]): number {
  if (!vals.length) return 0
  const s = [...vals].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 !== 0 ? s[m] : (s[m - 1] + s[m]) / 2
}

function calcMean(vals: number[]): number {
  if (!vals.length) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function calcStdDev(vals: number[]): number {
  if (vals.length < 2) return 0
  const avg = calcMean(vals)
  return Math.sqrt(calcMean(vals.map(v => Math.pow(v - avg, 2))))
}

function formatMonth(month: string): string {
  try {
    const [year, m] = month.split("-")
    const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    return `${names[parseInt(m) - 1]} '${year.slice(2)}`
  } catch { return month }
}

function formatVal(val: number): string {
  if (val >= 0 && val <= 1) return `${(val * 100).toFixed(1)}%`
  return val % 1 === 0 ? val.toString() : val.toFixed(2)
}

export default function MetricCharts({ data }: MetricChartsProps) {
  const [mode, setMode] = useState<"run" | "control">("run")
  const [activeLabel, setActiveLabel] = useState<string | null>(null)

  const labels = useMemo(() => [...new Set(data.map(d => d.label))], [data])
  const currentLabel = activeLabel || labels[0] || ""

  const chartData = useMemo(() => {
    const filtered = data
      .filter(d => d.label === currentLabel)
      .sort((a, b) => a.month.localeCompare(b.month))
    const map: Record<string, any> = {}
    filtered.forEach(d => {
      map[d.month] = { month: d.month, value: d.value, pdsa: d.pdsa_cycle_id }
    })
    return Object.values(map)
  }, [data, currentLabel])

  const values = chartData.map(d => d.value as number)
  const med = calcMedian(values)
  const avg = calcMean(values)
  const sd = calcStdDev(values)
  const ucl = avg + 3 * sd
  const lcl = Math.max(0, avg - 3 * sd)

  // Detect PDSA cycle boundaries
  const pdsaBoundaries: string[] = []
  let lastCycle: number | null = null
  chartData.forEach(d => {
    if (d.pdsa !== lastCycle && lastCycle !== null) pdsaBoundaries.push(d.month)
    lastCycle = d.pdsa
  })

  const currentVal = values[values.length - 1] ?? 0
  const prevVal = values[values.length - 2]
  const trend = prevVal !== undefined ? currentVal - prevVal : 0
  const outOfControlCount = values.filter(v => v > ucl || v < lcl).length

  const BLUE = "#004F9F"
  const GREEN = "#7AB800"
  const RED = "#EF4444"
  const AMBER = "#F59E0B"

  return (
    <div className="space-y-4">
      {labels.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {labels.map(label => (
            <button
              key={label}
              onClick={() => setActiveLabel(label)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${
                (activeLabel || labels[0]) === label
                  ? "bg-[#004F9F] text-white border-[#004F9F]"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <Card className="border-slate-200 shadow-sm border-2">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">
              {mode === "run" ? "Run Chart" : "Control Chart (3σ)"}
              {currentLabel && (
                <span className="ml-2 text-[#004F9F] normal-case font-semibold">
                  — {currentLabel}
                </span>
              )}
            </CardTitle>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setMode("run")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  mode === "run" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <TrendingUp size={11} /> Run
              </button>
              <button
                onClick={() => setMode("control")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  mode === "control" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <BarChart2 size={11} /> Control
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm font-medium">
              No data yet — add metric entries to see your chart
            </div>
          ) : (
            <>
              <div className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 70, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 700 }}
                      tickFormatter={formatMonth}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 700 }}
                      tickFormatter={formatVal}
                      domain={["auto", "auto"]}
                      width={48}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontSize: "12px" }}
                      formatter={(val: any) => [formatVal(val), currentLabel || "Value"]}
                      labelFormatter={formatMonth}
                    />

                    {pdsaBoundaries.map(month => (
                      <ReferenceLine
                        key={`pdsa-${month}`}
                        x={month}
                        stroke={AMBER}
                        strokeDasharray="4 4"
                        strokeWidth={2}
                        label={{ value: "▲ PDSA", position: "insideTopRight", fill: AMBER, fontSize: 9, fontWeight: 900 }}
                      />
                    ))}

                    {mode === "run" && (
                      <ReferenceLine
                        y={med}
                        stroke={BLUE}
                        strokeDasharray="6 3"
                        strokeWidth={2}
                        label={{ value: `Median ${formatVal(med)}`, position: "right", fill: BLUE, fontSize: 9, fontWeight: 900 }}
                      />
                    )}

                    {mode === "control" && (
                      <>
                        <ReferenceLine
                          y={avg}
                          stroke={BLUE}
                          strokeWidth={2}
                          label={{ value: `x̄ ${formatVal(avg)}`, position: "right", fill: BLUE, fontSize: 9, fontWeight: 900 }}
                        />
                        <ReferenceLine
                          y={ucl}
                          stroke={RED}
                          strokeDasharray="5 3"
                          strokeWidth={1.5}
                          label={{ value: `UCL ${formatVal(ucl)}`, position: "right", fill: RED, fontSize: 9, fontWeight: 900 }}
                        />
                        {lcl > 0 && (
                          <ReferenceLine
                            y={lcl}
                            stroke={RED}
                            strokeDasharray="5 3"
                            strokeWidth={1.5}
                            label={{ value: `LCL ${formatVal(lcl)}`, position: "right", fill: RED, fontSize: 9, fontWeight: 900 }}
                          />
                        )}
                      </>
                    )}

                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={BLUE}
                      strokeWidth={3}
                      dot={(props: any) => {
                        const v = props.payload.value as number
                        const oor = mode === "control" && (v > ucl || v < lcl)
                        return (
                          <circle
                            key={`dot-${props.index}`}
                            cx={props.cx}
                            cy={props.cy}
                            r={oor ? 7 : 5}
                            fill={oor ? RED : BLUE}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        )
                      }}
                      activeDot={{ r: 8, strokeWidth: 0, fill: GREEN }}
                      name={currentLabel || "Value"}
                      animationDuration={800}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className={`mt-6 grid gap-3 ${mode === "control" ? "grid-cols-4" : "grid-cols-3"}`}>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Latest</span>
                  <span className="text-xl font-black text-slate-900">{formatVal(currentVal)}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    {mode === "run" ? "Median" : "Mean (x̄)"}
                  </span>
                  <span className="text-xl font-black text-slate-900">{formatVal(mode === "run" ? med : avg)}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Trend</span>
                  <span className={`text-xl font-black ${trend > 0 ? "text-green-600" : trend < 0 ? "text-red-500" : "text-slate-400"}`}>
                    {trend > 0 ? "▲" : trend < 0 ? "▼" : "—"} {trend !== 0 ? formatVal(Math.abs(trend)) : "Stable"}
                  </span>
                </div>
                {mode === "control" && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">In Control</span>
                    <span className={`text-xl font-black ${outOfControlCount === 0 ? "text-green-600" : "text-red-500"}`}>
                      {outOfControlCount === 0 ? "Yes ✓" : `${outOfControlCount} pts out`}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-5 flex-wrap text-[10px] text-slate-500 font-medium">
                {mode === "run" ? (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="w-5 border-t-2 border-dashed border-[#004F9F] inline-block" />
                      Median line
                    </span>
                    {pdsaBoundaries.length > 0 && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 border-t-2 border-dashed border-amber-400 inline-block" />
                        PDSA cycle change
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="w-5 border-t-2 border-[#004F9F] inline-block" />
                      Mean (x̄)
                    </span>
                    <span className="flex items-center gap-1.5 text-red-400">
                      <span className="w-5 border-t-2 border-dashed border-red-400 inline-block" />
                      UCL / LCL (±3σ)
                    </span>
                    <span className="flex items-center gap-1.5 text-red-500">
                      <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                      Out-of-control point
                    </span>
                  </>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
