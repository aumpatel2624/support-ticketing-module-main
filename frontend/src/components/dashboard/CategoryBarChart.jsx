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

export default function CategoryBarChart({ data = [], className }) {
    // Sort data by total tickets descending and take top 10
    const sortedData = [...data]
        .sort((a, b) => b.totalTickets - a.totalTickets)
        .slice(0, 10)
        .map(item => ({
            name: item.categoryName,
            total: item.totalTickets,
            open: item.openTickets,
            resolved: item.resolvedTickets
        }));

    const hasData = sortedData && sortedData.length > 0;

    return (
        <Card className={cn("border-none shadow-premium bg-card", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">Top Categories</CardTitle>
                <CardDescription>Ticket volume by category (top 10).</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    {hasData ? (
                        <BarChart
                            data={sortedData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                            <XAxis
                                type="number"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                width={90}
                                tick={{ fill: 'hsl(var(--foreground))', fontWeight: 500 }}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-background border border-border/50 rounded-lg p-3 shadow-premium">
                                                <p className="font-bold text-sm mb-1">{label}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Total: <span className="font-semibold text-foreground">{data.total}</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Open: <span className="font-semibold text-warning">{data.open}</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Resolved: <span className="font-semibold text-success">{data.resolved}</span>
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar
                                dataKey="total"
                                radius={[0, 4, 4, 0]}
                                animationDuration={1500}
                                animationEasing="ease-out"
                            >
                                {sortedData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={`hsl(${200 + index * 10}, 70%, ${50 + index * 2}%)`}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground italic animate-pulse">
                            No category data available...
                        </div>
                    )}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
