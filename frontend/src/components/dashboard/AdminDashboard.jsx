'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Users,
    Ticket,
    AlertCircle,
    CheckCircle,
    BarChart3,
    ArrowRight,
    Search,
    Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsCard from './StatsCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/utils';
import RecentTicketsList from './RecentTicketsList';
import TicketVolumeChart from './TicketVolumeChart';
import TicketStatusPieChart from './TicketStatusPieChart';
import analyticsService from '@/lib/services/analyticsService';
import ticketService from '@/lib/services/ticketService';
import toast from 'react-hot-toast';

export default function AdminDashboard({ user }) {
    const [stats, setStats] = useState({
        totalTickets: 0,
        pendingTickets: 0,
        slaBreached: 0,
        activeAgents: 0,
        avgResolution: '0h'
    });
    const [recentTickets, setRecentTickets] = useState([]);
    const [monthlyTrend, setMonthlyTrend] = useState([]);
    const [statusDistribution, setStatusDistribution] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const statsDataPromise = analyticsService.getDashboardStats().catch(err => {
                    console.warn('Dashboard stats failed:', err);
                    return null;
                });

                const ticketsPromise = ticketService.getTickets({ limit: 5, sort: '-createdAt' }).catch(err => ({ data: [] }));

                const [statsData, ticketsOutput] = await Promise.all([statsDataPromise, ticketsPromise]);

                if (statsData) {
                    setStats({
                        totalTickets: statsData.totalTickets || 0,
                        slaBreached: statsData.slaBreached || 0,
                        activeAgents: statsData.activeAgents || 0,
                        avgResolution: statsData.avgResolutionTime ? `${statsData.avgResolutionTime}h` : '0h'
                    });
                    setMonthlyTrend(statsData.monthlyTrend || []);
                    setStatusDistribution(statsData.statusDistribution || []);
                }

                let t_list = [];
                if (ticketsOutput.data && Array.isArray(ticketsOutput.data)) t_list = ticketsOutput.data;
                else if (Array.isArray(ticketsOutput)) t_list = ticketsOutput;

                setRecentTickets(t_list);

            } catch (error) {
                console.error('Error loading dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return (
        <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-2xl animate-pulse bg-muted" />)}
            </div>
            <div className="grid gap-6 lg:grid-cols-7">
                <div className="lg:col-span-4 h-96 rounded-2xl animate-pulse bg-muted" />
                <div className="lg:col-span-3 h-96 rounded-2xl animate-pulse bg-muted" />
            </div>
        </div>
    );

    return (
        <div className="space-y-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-gradient">
                        Analytics Overview
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-[600px]">
                        Welcome back, <span className="font-bold text-foreground">{user?.name}</span>. Here&apos;s what&apos;s happening in your department today.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl h-12 px-6">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                    </Button>
                    <Button className="rounded-xl h-12 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" asChild>
                        <Link href="/analytics">
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Deep Insights
                        </Link>
                    </Button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Active Tickets"
                    value={stats.totalTickets}
                    icon={Ticket}
                    trend={{ value: 12, label: "from last week" }}
                    trendDirection="up"
                />
                <StatsCard
                    title="SLA Risk"
                    value={stats.slaBreached}
                    icon={AlertCircle}
                    trend={{ value: 5, label: "tickets at risk" }}
                    trendDirection="neutral"
                    invertedTrend={true}
                    className={stats.slaBreached > 0 ? "border-l-4 border-l-destructive" : ""}
                />
                <StatsCard
                    title="Response Time"
                    value={stats.avgResolution}
                    icon={CheckCircle}
                    trend={{ value: 8, label: "faster than avg" }}
                    trendDirection="up"
                />
                <StatsCard
                    title="Team Capacity"
                    value={`${stats.activeAgents}%`}
                    icon={Users}
                    description="Current load status"
                />
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-7">
                <div className="lg:col-span-4 transition-all hover:z-10">
                    <TicketVolumeChart data={monthlyTrend} className="border-none shadow-premium h-full" />
                </div>

                <div className="lg:col-span-3 transition-all">
                    <TicketStatusPieChart data={statusDistribution} className="border-none shadow-premium h-full" />
                </div>
            </div>

            {/* Recent Tickets Table Section */}
            <div className="grid gap-6">
                <Card className="border-none shadow-premium overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-secondary">
                        <div>
                            <CardTitle className="text-2xl font-bold">Priority Resolution</CardTitle>
                            <CardDescription>Most critical tickets requiring immediate attention across all departments.</CardDescription>
                        </div>
                        <Button variant="ghost" className="rounded-xl group" asChild>
                            <Link href="/tickets">
                                View Full Console
                                <ArrowRight className="ml-2 h-4 w-4 transition-all group-hover:translate-x-1" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <RecentTicketsList tickets={recentTickets} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
