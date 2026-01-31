'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function MyTicketTrendChart({ data = [], className }) {
    // Transform data for chart: create 30-day trend from tickets
    const generateTrendData = () => {
        if (!Array.isArray(data) || data.length === 0) return [];

        const last30Days = {};
        const now = new Date();

        // Initialize last 30 days
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            last30Days[dateStr] = { assigned: 0, resolved: 0 };
        }

        // Count tickets by creation/completion date
        data.forEach(ticket => {
            if (ticket.createdAt) {
                const createdDate = new Date(ticket.createdAt).toISOString().split('T')[0];
                if (last30Days[createdDate]) {
                    last30Days[createdDate].assigned++;
                }
            }

            if (ticket.completedAt) {
                const completedDate = new Date(ticket.completedAt).toISOString().split('T')[0];
                if (last30Days[completedDate]) {
                    last30Days[completedDate].resolved++;
                }
            }
        });

        return Object.entries(last30Days).map(([date, counts]) => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            assigned: counts.assigned,
            resolved: counts.resolved
        }));
    };

    const chartData = generateTrendData();
    const hasData = chartData.length > 0 && chartData.some(d => d.assigned > 0 || d.resolved > 0);

    return (
        <Card className={cn("border-none shadow-premium bg-card", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">My Ticket Trend</CardTitle>
                <CardDescription>Assigned vs resolved tickets (30 days).</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    {hasData ? (
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                            <XAxis
                                dataKey="date"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
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
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                            <Line
                                type="monotone"
                                dataKey="assigned"
                                stroke="hsl(217, 91%, 60%)"
                                strokeWidth={2}
                                dot={false}
                                name="Assigned"
                            />
                            <Line
                                type="monotone"
                                dataKey="resolved"
                                stroke="hsl(142, 76%, 36%)"
                                strokeWidth={2}
                                dot={false}
                                name="Resolved"
                            />
                        </LineChart>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground italic animate-pulse">
                            No trend data available...
                        </div>
                    )}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
