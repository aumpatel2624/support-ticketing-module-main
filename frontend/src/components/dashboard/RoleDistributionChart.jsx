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
import { Shield, UserCog, Users, User } from 'lucide-react';

// Role colors mapping
const ROLE_COLORS = {
    'SuperAdmin': 'hsl(0, 84.2%, 60.2%)',    // Red
    'Admin': 'hsl(217, 91%, 60%)',            // Blue
    'TeamMember': 'hsl(142, 76%, 36%)',      // Green
    'NormalUser': 'hsl(38, 92%, 50%)',        // Yellow/Orange
};

// Role display names
const ROLE_NAMES = {
    'SuperAdmin': 'Super Admin',
    'Admin': 'Admin',
    'TeamMember': 'Team Member',
    'NormalUser': 'Normal User',
};

// Role icons
const ROLE_ICONS = {
    'SuperAdmin': Shield,
    'Admin': UserCog,
    'TeamMember': Users,
    'NormalUser': User,
};

// Default/mock data
const defaultData = [
    { name: 'SuperAdmin', value: 2, label: 'Super Admin' },
    { name: 'Admin', value: 8, label: 'Admin' },
    { name: 'TeamMember', value: 24, label: 'Team Member' },
    { name: 'NormalUser', value: 156, label: 'Normal User' },
];

export default function RoleDistributionChart({ data = [], className }) {
    // Use provided data or fallback to default
    const chartData = data.length > 0 ? data : defaultData;

    // Sort data by value descending
    const sortedData = [...chartData].sort((a, b) => b.value - a.value);

    const hasData = sortedData && sortedData.length > 0;
    const total = sortedData.reduce((sum, item) => sum + item.value, 0);

    // Calculate percentages
    const dataWithPercentage = sortedData.map(item => ({
        ...item,
        percentage: total > 0 ? Math.round((item.value / total) * 100) : 0
    }));

    return (
        <Card className={cn("border-none shadow-premium bg-card overflow-hidden", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">Role Distribution</CardTitle>
                <CardDescription>User breakdown by role across the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div className="min-h-[280px] flex flex-col">
                        {hasData ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={sortedData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={4}
                                        dataKey="value"
                                        animationBegin={200}
                                        animationDuration={1200}
                                    >
                                        {sortedData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={ROLE_COLORS[entry.name] || `hsl(${index * 90}, 70%, 50%)`}
                                                strokeWidth={0}
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
                                        }}
                                        formatter={(value, name) => {
                                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                            return [`${value} (${percentage}%)`, ROLE_NAMES[name] || name];
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4 text-center min-h-[280px]">
                                <p className="text-sm">No data available</p>
                            </div>
                        )}
                    </div>

                    {/* Legend / Stats List */}
                    <div className="flex flex-col justify-center space-y-3">
                        {dataWithPercentage.map((item, index) => {
                            const Icon = ROLE_ICONS[item.name] || User;
                            const color = ROLE_COLORS[item.name] || `hsl(${index * 90}, 70%, 50%)`;

                            return (
                                <div
                                    key={item.name}
                                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-10 w-10 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: `${color}20` }}
                                        >
                                            <Icon className="h-5 w-5" style={{ color }} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">
                                                {ROLE_NAMES[item.name] || item.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.value} users
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg" style={{ color }}>
                                            {item.percentage}%
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Total */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10 mt-2">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Total Users</p>
                                    <p className="text-xs text-muted-foreground">All roles combined</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg text-primary">
                                    {total}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
