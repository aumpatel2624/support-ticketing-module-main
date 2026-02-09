'use client';

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const PRIORITY_COLORS = {
    'Urgent': 'hsl(0, 84.2%, 60.2%)',    // Red
    'High': 'hsl(24, 95%, 50%)',          // Orange
    'Medium': 'hsl(38, 92%, 50%)',        // Yellow
    'Low': 'hsl(217, 91%, 60%)',          // Blue
};

const PRIORITY_ORDER = ['Urgent', 'High', 'Medium', 'Low'];

export default function PriorityDonutChart({ data = [], className }) {
    // Sort data by priority order
    const sortedData = [...data].sort((a, b) => {
        const indexA = PRIORITY_ORDER.indexOf(a.name);
        const indexB = PRIORITY_ORDER.indexOf(b.name);
        return indexA - indexB;
    });

    const hasData = sortedData && sortedData.length > 0;
    const total = sortedData.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card className={cn("border-none shadow-premium bg-card flex flex-col h-full", className)}>
            <CardHeader className="pb-2 shrink-0">
                <CardTitle className="text-xl font-bold">By Priority</CardTitle>
                <CardDescription>Ticket distribution by priority level.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px] flex flex-col">
                <div className="flex-1 w-full h-full min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        {hasData ? (
                            <PieChart>
                                <Pie
                                    data={sortedData}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    animationBegin={200}
                                    animationDuration={1200}
                                >
                                    {sortedData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={PRIORITY_COLORS[entry.name] || 'hsl(var(--muted))'}
                                            strokeWidth={0}
                                            className="hover:opacity-80 transition-opacity cursor-pointer"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    isAnimationActive={false}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            const percentage = total > 0 ? Math.round((data.value / total) * 100) : 0;
                                            return (
                                                <div key={data.name} className="bg-background border border-border/50 rounded-lg p-3 shadow-premium animate-in fade-in zoom-in-95 duration-200 z-50">
                                                    <div className="flex items-center justify-between gap-4 mb-2">
                                                        <p className="font-bold text-sm text-foreground">{data.name}</p>
                                                        <p className="text-xs font-bold text-muted-foreground">{data.value} Total ({percentage}%)</p>
                                                    </div>

                                                    {/* Department Breakdown */}
                                                    {data.breakdown && data.breakdown.length > 0 && (
                                                        <div className="space-y-1 pt-2 border-t border-border/50">
                                                            {data.breakdown.slice(0, 5).map((dept, idx) => (
                                                                <div key={idx} className="flex justify-between items-center text-[11px]">
                                                                    <span className="text-muted-foreground truncate max-w-[120px]">{dept.name}</span>
                                                                    <span className="font-medium">{dept.value}</span>
                                                                </div>
                                                            ))}
                                                            {data.breakdown.length > 5 && (
                                                                <p className="text-[10px] text-muted-foreground italic pt-1">
                                                                    + {data.breakdown.length - 5} others...
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {(!data.breakdown || data.breakdown.length === 0) && (
                                                        <p className="text-xs text-muted-foreground italic">No breakdown available</p>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <text
                                    x="50%"
                                    y="45%"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="fill-foreground font-bold"
                                    style={{ fontSize: '24px' }}
                                >
                                    {total}
                                </text>
                                <text
                                    x="50%"
                                    y="55%"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="fill-muted-foreground"
                                    style={{ fontSize: '12px' }}
                                >
                                    Total
                                </text>
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '11px', fontWeight: '500', paddingTop: '10px' }}
                                />
                            </PieChart>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground animate-pulse p-4 text-center">
                                <p className="text-sm italic">No priority data available...</p>
                            </div>
                        )}
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
