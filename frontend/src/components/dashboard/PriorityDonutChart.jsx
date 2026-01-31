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
        <Card className={cn("border-none shadow-premium bg-card", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">By Priority</CardTitle>
                <CardDescription>Ticket distribution by priority level.</CardDescription>
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
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        const percentage = total > 0 ? Math.round((data.value / total) * 100) : 0;
                                        return (
                                            <div className="bg-background border border-border/50 rounded-lg p-3 shadow-premium">
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
                        <div className="flex items-center justify-center h-full text-muted-foreground italic animate-pulse">
                            No priority data available...
                        </div>
                    )}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
