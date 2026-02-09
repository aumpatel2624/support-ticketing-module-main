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

const STATUS_COLORS = {
    'New': 'hsl(217, 91%, 60%)',
    'Assigned': 'hsl(199, 89%, 48%)',
    'InProgress': 'hsl(38, 92%, 50%)',
    'Completed': 'hsl(142, 76%, 36%)',
    'Resolved': 'hsl(142, 76%, 36%)', // Added Resolved color (Same as Completed)
    'Reopened': 'hsl(24, 95%, 50%)',
    'Closed': 'hsl(220, 13%, 40%)',
    'Escalated': 'hsl(0, 84.2%, 60.2%)',
};

export default function TicketStatusPieChart({ data = [], className }) {
    const hasData = data && data.length > 0;

    return (
        <Card className={cn("border-none shadow-premium bg-card flex flex-col h-full", className)}>
            <CardHeader className="pb-2 shrink-0">
                <CardTitle className="text-xl font-bold">Health Metrics</CardTitle>
                <CardDescription>Live distribution of ticket states across the system.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px] flex flex-col">
                <div className="flex-1 w-full h-full min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        {hasData ? (
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    animationBegin={200}
                                    animationDuration={1200}
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={STATUS_COLORS[entry.name] || 'hsl(var(--muted))'}
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
                                            return (
                                                <div key={data.name} className="bg-background border border-border/50 rounded-lg p-3 shadow-premium animate-in fade-in zoom-in-95 duration-200 z-50">
                                                    <div className="flex items-center justify-between gap-4 mb-2">
                                                        <p className="font-bold text-sm text-foreground">{data.name}</p>
                                                        <p className="text-xs font-bold text-muted-foreground">{data.value} Total</p>
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
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }}
                                />
                            </PieChart>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground animate-pulse p-4 text-center">
                                <p className="text-sm italic">Awaiting status updates...</p>
                            </div>
                        )}
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
