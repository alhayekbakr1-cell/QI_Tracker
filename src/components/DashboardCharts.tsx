"use client"

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
    AreaChart,
    Area
} from 'recharts';

interface DashboardChartsProps {
    statusData: { name: string; value: number }[];
    categoryData: { name: string; value: number }[];
    timelineData?: { name: string; value: number }[];
}

const STATUS_COLORS: Record<string, string> = {
    'Idea': '#8B5CF6',                  // Violet
    'Pre-Intervention': '#3B82F6',      // Blue
    'Intervention Ongoing': '#F59E0B',  // Amber
    'Sustain the Gains': '#06B6D4',     // Cyan
    'Impacted (Completed)': '#10B981',  // Emerald
};

export default function DashboardCharts({ statusData, categoryData, timelineData }: DashboardChartsProps) {
    
    // Status custom tooltip
    const StatusTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const color = STATUS_COLORS[data.name] || '#1E293B';
            return (
                <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-xl max-w-[200px] z-50">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">{data.name}</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 leading-none">
                        {data.value} <span className="text-xs font-semibold text-slate-400">{data.value === 1 ? 'project' : 'projects'}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Category custom tooltip
    const CategoryTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-xl max-w-[200px] z-50">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">{data.name}</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 leading-none">
                        {data.value} <span className="text-xs font-semibold text-slate-400">{data.value === 1 ? 'project' : 'projects'}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Timeline custom tooltip
    const TimelineTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-xl max-w-[200px] z-50">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">{data.name}</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 leading-none">
                        {data.value} <span className="text-xs font-semibold text-slate-400">{data.value === 1 ? 'project' : 'projects'}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            {/* Status Distribution Pie Chart */}
            <div className="bg-white rounded-3xl border border-slate-150 p-6 flex flex-col h-[400px] hover:shadow-md transition-all duration-300">
                <div className="flex flex-col mb-4">
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">Distribution</span>
                    <h3 className="text-base font-black text-advent-navy tracking-tight">Initiative Stages</h3>
                </div>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="45%"
                                innerRadius={60}
                                outerRadius={85}
                                paddingAngle={4}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => {
                                    const color = STATUS_COLORS[entry.name] || '#64748B';
                                    return (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={color} 
                                            stroke="rgba(255,255,255,0.8)" 
                                            strokeWidth={3}
                                            className="hover:opacity-90 transition-opacity duration-200 outline-none cursor-pointer"
                                        />
                                    );
                                })}
                            </Pie>
                            <Tooltip content={<StatusTooltip />} />
                            <Legend 
                                verticalAlign="bottom" 
                                align="center"
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ paddingTop: 20, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Category Breakdown Bar Chart */}
            <div className="bg-white rounded-3xl border border-slate-150 p-6 flex flex-col h-[400px] hover:shadow-md transition-all duration-300">
                <div className="flex flex-col mb-4">
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">Settings</span>
                    <h3 className="text-base font-black text-advent-navy tracking-tight">Category Split</h3>
                </div>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F1F5F9" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 900, fill: '#475569', style: { textTransform: 'uppercase', letterSpacing: '0.05em' } }}
                                width={85}
                            />
                            <Tooltip cursor={{ fill: '#F8FAFC' }} content={<CategoryTooltip />} />
                            <Bar dataKey="value" fill="#005CAB" radius={[0, 8, 8, 0]} barSize={24}>
                                {categoryData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={index % 2 === 0 ? '#1B365D' : '#005CAB'} 
                                        className="hover:opacity-90 transition-opacity duration-200 cursor-pointer"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Timeline Area Chart */}
            {timelineData && (
                <div className="bg-white rounded-3xl border border-slate-150 p-6 flex flex-col h-[400px] hover:shadow-md transition-all duration-300 md:col-span-2 lg:col-span-1">
                    <div className="flex flex-col mb-4">
                        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">Progress</span>
                        <h3 className="text-base font-black text-advent-navy tracking-tight">Growth Trend</h3>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 9, fill: '#64748B', fontWeight: 700 }}
                                    minTickGap={20}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 9, fill: '#64748B', fontWeight: 700 }}
                                />
                                <Tooltip content={<TimelineTooltip />} />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#10B981" 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#colorValue)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
