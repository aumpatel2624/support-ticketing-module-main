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
    'Pending': 'hsl(24, 95%, 50%)',
    'Completed': 'hsl(142, 76%, 36%)',
    'Closed': 'hsl(220, 13%, 91%)',
    'Escalated': 'hsl(0, 84.2%, 60.2%)',
};

export default function TicketStatusPieChart({ data = [], className }) {
    const hasData = data && data.length > 0;

    return (
        <Card className={cn("border-none shadow-premium bg-card", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">Health Metrics</CardTitle>
                <CardDescription>Live distribution of ticket states across the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    {hasData ? (
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                paddingAngle={8}
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
                                contentStyle={{
                                    borderRadius: '12px',
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border)/0.5)',
                                    boxShadow: 'var(--shadow-premium)',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }}
                            />
                        </PieChart>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground italic animate-pulse">
                            Awaiting status updates...
                        </div>
                    )}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
