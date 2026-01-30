'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const data = [
    { day: 'Mon', created: 4, resolved: 2 },
    { day: 'Tue', created: 7, resolved: 5 },
    { day: 'Wed', created: 5, resolved: 6 },
    { day: 'Thu', created: 10, resolved: 8 },
    { day: 'Fri', created: 8, resolved: 7 },
    { day: 'Sat', created: 3, resolved: 3 },
    { day: 'Sun', created: 2, resolved: 1 },
];

export default function TicketTrendChart({ className }) {
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Ticket Trends (Wait vs Resolved)</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px' }} />
                        <Line type="monotone" dataKey="created" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Created" />
                        <Line type="monotone" dataKey="resolved" stroke="hsl(var(--success))" strokeWidth={2} dot={false} name="Resolved" />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
