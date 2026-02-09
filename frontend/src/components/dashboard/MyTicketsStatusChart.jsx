'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
    'New': 'hsl(217, 91%, 60%)',
    'Assigned': 'hsl(262, 80%, 50%)',
    'InProgress': 'hsl(24, 95%, 50%)',
    'Completed': 'hsl(142, 76%, 36%)',
    'Reopened': 'hsl(38, 92%, 50%)',
    'Closed': 'hsl(215, 14%, 34%)',
    'Escalated': 'hsl(0, 84.2%, 60.2%)',
};

export default function MyTicketsStatusChart({ data = [], className }) {
    // Transform tickets data to status breakdown
    const statusDistribution = data.reduce((acc, ticket) => {
        const status = ticket.status || 'New';
        const existing = acc.find(s => s.name === status);
        if (existing) {
            existing.count++;
        } else {
            acc.push({ name: status, count: 1 });
        }
        return acc;
    }, []);

    const hasData = statusDistribution && statusDistribution.length > 0;

    return (
        <Card className={cn("border-none shadow-premium bg-card", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">My Tickets by Status</CardTitle>
                <CardDescription>Ticket status breakdown.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px] flex flex-col">
                <div className="flex-1 w-full h-full min-h-[250px] flex flex-col">
                    {hasData ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={statusDistribution}
                                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                                <XAxis
                                    dataKey="name"
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: 'hsl(var(--foreground))', fontWeight: 500 }}
                                />
                                <YAxis
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        backgroundColor: 'hsl(var(--background))',
                                        borderColor: 'hsl(var(--border)/0.5)',
                                        boxShadow: 'var(--shadow-premium)',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                    formatter={(value) => [`${value} tickets`, 'Count']}
                                />
                                <Bar
                                    dataKey="count"
                                    radius={[8, 8, 0, 0]}
                                    animationBegin={100}
                                    animationDuration={800}
                                >
                                    {statusDistribution.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={STATUS_COLORS[entry.name] || 'hsl(var(--muted))'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                            <p className="text-sm">No data available</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
