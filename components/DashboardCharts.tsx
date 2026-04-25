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

const COLORS = [
    '#003E70', // Navy
    '#009639', // Green
    '#005CAB', // Cobalt
    '#00A3E0', // Sky
    '#64748B'  // Slate
];

export default function DashboardCharts({ statusData, categoryData, timelineData }: DashboardChartsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {/* Status Distribution Pie Chart */}
            <div className="glass p-6 rounded-2xl flex flex-col h-[400px]">
                <h3 className="text-sm font-bold text-advent-navy uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Project Status</h3>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Category Breakdown Bar Chart */}
            <div className="glass p-6 rounded-2xl flex flex-col h-[400px]">
                <h3 className="text-sm font-bold text-advent-navy uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Category Split</h3>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fontWeight: 600, fill: '#64748B' }}
                                width={70}
                            />
                            <Tooltip
                                cursor={{ fill: '#F1F5F9' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" fill="#005CAB" radius={[0, 6, 6, 0]} barSize={32}>
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#003E70' : '#005CAB'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Timeline Area Chart (Only shows if data provided) */}
            {timelineData && (
                <div className="glass p-6 rounded-2xl flex flex-col h-[400px] md:col-span-2 lg:col-span-1">
                    <h3 className="text-sm font-bold text-advent-navy uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Growth Trend</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#009639" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#009639" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                                    minTickGap={30}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#009639" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
