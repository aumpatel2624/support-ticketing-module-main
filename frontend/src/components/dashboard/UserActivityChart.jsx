'use client';

import { useState } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Users, UserPlus } from 'lucide-react';

// Mock data for demonstration - in production, this would come from API
const mockDailyData = [
    { date: 'Mon', dau: 45, wau: 120, newRegistrations: 8 },
    { date: 'Tue', dau: 52, wau: 125, newRegistrations: 12 },
    { date: 'Wed', dau: 48, wau: 128, newRegistrations: 6 },
    { date: 'Thu', dau: 61, wau: 135, newRegistrations: 15 },
    { date: 'Fri', dau: 55, wau: 140, newRegistrations: 10 },
    { date: 'Sat', dau: 38, wau: 142, newRegistrations: 4 },
    { date: 'Sun', dau: 42, wau: 145, newRegistrations: 5 },
];

const mockWeeklyData = [
    { date: 'Week 1', dau: 48, wau: 120, newRegistrations: 45 },
    { date: 'Week 2', dau: 52, wau: 135, newRegistrations: 52 },
    { date: 'Week 3', dau: 58, wau: 148, newRegistrations: 48 },
    { date: 'Week 4', dau: 61, wau: 155, newRegistrations: 61 },
];

const mockMonthlyData = [
    { date: 'Jan', dau: 45, wau: 320, newRegistrations: 180 },
    { date: 'Feb', dau: 52, wau: 380, newRegistrations: 220 },
    { date: 'Mar', dau: 58, wau: 420, newRegistrations: 195 },
    { date: 'Apr', dau: 61, wau: 465, newRegistrations: 245 },
    { date: 'May', dau: 67, wau: 520, newRegistrations: 280 },
    { date: 'Jun', dau: 72, wau: 580, newRegistrations: 310 },
];

export default function UserActivityChart({ data, className }) {
    const [period, setPeriod] = useState('7d');

    // Use provided data or fallback to mock data
    const getChartData = () => {
        if (data && data.length > 0) return data;

        switch (period) {
            case '7d':
                return mockDailyData;
            case '30d':
                return mockWeeklyData;
            case '90d':
                return mockMonthlyData;
            default:
                return mockDailyData;
        }
    };

    const chartData = getChartData();
    const hasData = chartData && chartData.length > 0;

    // Calculate totals for summary
    const totalDAU = chartData.reduce((sum, item) => sum + (item.dau || 0), 0);
    const avgDAU = Math.round(totalDAU / chartData.length);
    const totalNewRegistrations = chartData.reduce((sum, item) => sum + (item.newRegistrations || 0), 0);

    return (
        <Card className={cn("border-none shadow-premium bg-card overflow-hidden", className)}>
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        User Activity
                    </CardTitle>
                    <CardDescription>Daily/Weekly active users and new registrations.</CardDescription>
                </div>
                <Tabs value={period} onValueChange={setPeriod} className="w-auto">
                    <TabsList className="h-8">
                        <TabsTrigger value="7d" className="text-xs px-3">7D</TabsTrigger>
                        <TabsTrigger value="30d" className="text-xs px-3">30D</TabsTrigger>
                        <TabsTrigger value="90d" className="text-xs px-3">90D</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent className="px-2 pt-4">
                {/* Summary Stats */}
                <div className="flex gap-6 mb-4 px-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Avg DAU</p>
                            <p className="text-lg font-bold">{avgDAU}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                            <UserPlus className="h-4 w-4 text-success" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">New Users</p>
                            <p className="text-lg font-bold">{totalNewRegistrations}</p>
                        </div>
                    </div>
                </div>

                <div className="min-h-[300px] flex flex-col">
                    {hasData ? (
                        <ResponsiveContainer width="100%" height={300}>
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
                                    dataKey="dau"
                                    stroke="hsl(217, 91%, 60%)"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: 'hsl(217, 91%, 60%)' }}
                                    activeDot={{ r: 5 }}
                                    name="Daily Active Users"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="wau"
                                    stroke="hsl(142, 76%, 36%)"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: 'hsl(142, 76%, 36%)' }}
                                    activeDot={{ r: 5 }}
                                    name="Weekly Active Users"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="newRegistrations"
                                    stroke="hsl(38, 92%, 50%)"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={{ r: 3, fill: 'hsl(38, 92%, 50%)' }}
                                    activeDot={{ r: 5 }}
                                    name="New Registrations"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4 text-center min-h-[300px]">
                            <p className="text-sm">No data available</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
