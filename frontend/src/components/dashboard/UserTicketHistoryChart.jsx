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

export default function UserTicketHistoryChart({ data = [], className }) {
    // Generate 6-month trend from tickets
    const generateMonthlyTrend = () => {
        if (!Array.isArray(data) || data.length === 0) return [];

        const months = {};
        const now = new Date();

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            months[monthKey] = { created: 0, resolved: 0 };
        }

        // Count tickets by month
        data.forEach(ticket => {
            if (ticket.createdAt) {
                const createdDate = new Date(ticket.createdAt);
                const monthKey = createdDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                if (months[monthKey]) {
                    months[monthKey].created++;
                }
            }

            if (ticket.resolvedAt) {
                const resolvedDate = new Date(ticket.resolvedAt);
                const monthKey = resolvedDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                if (months[monthKey]) {
                    months[monthKey].resolved++;
                }
            }
        });

        return Object.entries(months).map(([month, counts]) => ({
            month,
            created: counts.created,
            resolved: counts.resolved
        }));
    };

    const chartData = generateMonthlyTrend();
    const hasData = chartData.length > 0 && chartData.some(d => d.created > 0 || d.resolved > 0);

    return (
        <Card className={cn("border-none shadow-premium bg-card", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">My Ticket History</CardTitle>
                <CardDescription>Created vs resolved tickets (6 months).</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    {hasData ? (
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                            <XAxis
                                dataKey="month"
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
                                dataKey="created"
                                stroke="hsl(217, 91%, 60%)"
                                strokeWidth={2}
                                dot={false}
                                name="Created"
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
                            No ticket history available...
                        </div>
                    )}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
