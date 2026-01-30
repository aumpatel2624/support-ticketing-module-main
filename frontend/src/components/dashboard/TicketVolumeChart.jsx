'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Defs,
    LinearGradient
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function TicketVolumeChart({ data = [], className }) {
    const hasData = data && data.length > 0;

    return (
        <Card className={cn("border-none shadow-premium bg-card overflow-hidden", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">Ticket Volume Trend</CardTitle>
                <CardDescription>Visual representation of support requests over the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent className="px-2 pt-4">
                <ResponsiveContainer width="100%" height={350}>
                    {hasData ? (
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                            <XAxis
                                dataKey="name"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                                dy={10}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border)/0.5)',
                                    boxShadow: 'var(--shadow-premium)',
                                    border: '1px solid hsl(var(--border)/0.5)',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}
                                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '5 5' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke="hsl(var(--primary))"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                                animationDuration={1500}
                                animationEasing="ease-in-out"
                            />
                        </AreaChart>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground font-medium italic animate-pulse">
                            No telemetry data available for this cycle
                        </div>
                    )}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
