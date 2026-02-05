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
    'Urgent': 'hsl(0, 84.2%, 60.2%)',
    'High': 'hsl(24, 95%, 50%)',
    'Medium': 'hsl(38, 92%, 50%)',
    'Low': 'hsl(217, 91%, 60%)',
};

const PRIORITY_ORDER = ['Urgent', 'High', 'Medium', 'Low'];

export default function UserPriorityChart({ data = [], className }) {
    // Transform tickets data to priority distribution (only non-closed)
    const activeTickets = data.filter(t => t.status !== 'Completed' && t.status !== 'Closed');

    const priorityDistribution = activeTickets.reduce((acc, ticket) => {
        const priority = ticket.priority || 'Low';
        const existing = acc.find(p => p.name === priority);
        if (existing) {
            existing.value++;
        } else {
            acc.push({ name: priority, value: 1 });
        }
        return acc;
    }, []);

    // Sort by priority order
    const sortedData = [...priorityDistribution].sort((a, b) => {
        const indexA = PRIORITY_ORDER.indexOf(a.name);
        const indexB = PRIORITY_ORDER.indexOf(b.name);
        return indexA - indexB;
    });

    const hasData = sortedData && sortedData.length > 0;
    const total = sortedData.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card className={cn("border-none shadow-premium bg-card", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">My Tickets by Priority</CardTitle>
                <CardDescription>Current open ticket distribution.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
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
                                            <div key={data.name} className="bg-background border border-border/50 rounded-lg p-3 shadow-premium animate-in fade-in zoom-in-95 duration-200">
                                                <p className="font-bold text-sm">{data.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {data.value} tickets ({percentage}%)
                                                </p>
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
                                className="fill-foreground"
                                style={{ fontSize: '24px', fontWeight: 'bold' }}
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
                                Open
                            </text>
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ fontSize: '11px', fontWeight: '500', paddingTop: '10px' }}
                            />
                        </PieChart>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground italic animate-pulse">
                            No ticket data available...
                        </div>
                    )}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
