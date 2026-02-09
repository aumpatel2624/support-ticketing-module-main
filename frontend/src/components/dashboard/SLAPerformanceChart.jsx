'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const COLORS = {
    met: 'hsl(142, 76%, 36%)',      // Green
    atRisk: 'hsl(38, 92%, 50%)',    // Yellow/Orange
    breached: 'hsl(0, 84.2%, 60.2%)' // Red
};

const PRIORITY_ORDER = ['Critical', 'High', 'Medium', 'Low'];

export default function SLAPerformanceChart({ data = [], className }) {
    // Transform data for stacked bar chart
    const transformedData = data.map(item => ({
        priority: item.priority,
        Met: item.met || 0,
        'At Risk': item.atRisk || 0,
        Breached: item.breached || 0,
        total: item.total || 0
    }));

    // Sort by priority order
    const sortedData = transformedData.sort((a, b) => {
        const indexA = PRIORITY_ORDER.indexOf(a.priority);
        const indexB = PRIORITY_ORDER.indexOf(b.priority);
        return indexA - indexB;
    });

    const hasData = sortedData && sortedData.length > 0;

    return (
        <Card className={cn("border-none shadow-premium bg-card flex flex-col h-full", className)}>
            <CardHeader className="pb-2 shrink-0">
                <CardTitle className="text-xl font-bold">SLA Performance</CardTitle>
                <CardDescription>SLA compliance by priority level.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px] flex flex-col">
                <div className="flex-1 w-full h-full min-h-[250px] flex flex-col">
                    {hasData ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={sortedData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                                <XAxis
                                    dataKey="priority"
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: 'hsl(var(--foreground))', fontWeight: 500 }}
                                />
                                <YAxis
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
                                            return (
                                                <div className="bg-background border border-border/50 rounded-lg p-3 shadow-premium z-50">
                                                    <p className="font-bold text-sm mb-2">{label} Priority</p>
                                                    {payload.map((entry, index) => (
                                                        <div key={index} className="flex items-center justify-between gap-4 text-xs">
                                                            <span className="flex items-center gap-2">
                                                                <span
                                                                    className="w-2 h-2 rounded-full"
                                                                    style={{ backgroundColor: entry.color }}
                                                                />
                                                                {entry.name}
                                                            </span>
                                                            <span className="font-semibold">
                                                                {entry.value} ({total > 0 ? Math.round((entry.value / total) * 100) : 0}%)
                                                            </span>
                                                        </div>
                                                    ))}
                                                    <div className="border-t border-border/50 mt-2 pt-2">
                                                        <span className="text-xs text-muted-foreground">Total: </span>
                                                        <span className="text-xs font-bold">{total}</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                                    iconType="square"
                                />
                                <Bar dataKey="Met" stackId="a" fill={COLORS.met} radius={[0, 0, 4, 4]} />
                                <Bar dataKey="At Risk" stackId="a" fill={COLORS.atRisk} />
                                <Bar dataKey="Breached" stackId="a" fill={COLORS.breached} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground animate-pulse p-4 text-center">
                            <p className="text-sm italic">No SLA data available...</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
