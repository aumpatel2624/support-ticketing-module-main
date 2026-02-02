import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClipboardList, Loader2, PlayCircle, CheckCircle2, Star, Clock, TrendingUp, Target, Zap, AlertCircle, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import StatsCard from './StatsCard';
import MyTicketTrendChart from './MyTicketTrendChart';
import MyTicketsPriorityChart from './MyTicketsPriorityChart';
import MyTicketsStatusChart from './MyTicketsStatusChart';
import MyActiveTicketsTable from './MyActiveTicketsTable';
import RecentlyCompletedTable from './RecentlyCompletedTable';
import ticketService from '@/lib/services/ticketService';
import analyticsService from '@/lib/services/analyticsService';

export default function TeamMemberDashboard({ user }) {
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState({
        assigned: 0,
        inProgress: 0,
        completed: 0,
        avgResolution: '0h',
        completedToday: 0,
        currentWorkload: 0,
        firstResponseTime: '0h',
        reopenRate: 0,
        weeklyTarget: 0,
        slaCompliance: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                const [statsData, ticketsData] = await Promise.all([
                    analyticsService.getDashboardStats(),
                    ticketService.getAssignedTickets({ limit: 100 })
                ]);

                if (statsData) {
                    // Calculate additional metrics from tickets
                    const ticketArray = Array.isArray(ticketsData?.data) ? ticketsData.data : (Array.isArray(ticketsData) ? ticketsData : []);

                    const now = new Date();
                    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const weekStart = new Date(now);
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

                    const completedToday = ticketArray.filter(t =>
                        t.completedAt && new Date(t.completedAt) >= todayStart
                    ).length;

                    const completedThisWeek = ticketArray.filter(t =>
                        t.completedAt && new Date(t.completedAt) >= weekStart
                    ).length;

                    const reopenedTickets = ticketArray.filter(t =>
                        t.statusHistory && t.statusHistory.filter(h => h.newStatus === 'Completed' || h.newStatus === 'Closed').length > 1
                    ).length;

                    const reopenRate = ticketArray.length > 0
                        ? Math.round((reopenedTickets / ticketArray.length) * 100)
                        : 0;

                    const activeTickets = ticketArray.filter(t =>
                        t.status !== 'Completed' && t.status !== 'Closed'
                    ).length;

                    const currentWorkload = activeTickets > 0
                        ? Math.min(Math.round((activeTickets / 10) * 100), 100)
                        : 0;

                    const slaBreached = ticketArray.filter(t =>
                        t.slaStatus === 'Breached'
                    ).length;

                    const slaCompliance = ticketArray.length > 0
                        ? Math.round(((ticketArray.length - slaBreached) / ticketArray.length) * 100)
                        : 100;

                    setStats({
                        assigned: statsData.totalTickets || 0,
                        inProgress: statsData.statusStats?.['InProgress'] || 0,
                        completed: statsData.resolvedTickets || 0,
                        avgResolution: statsData.avgResolutionTime ? `${statsData.avgResolutionTime}h` : '0h',
                        completedToday,
                        currentWorkload,
                        firstResponseTime: statsData.avgResponseTime ? `${statsData.avgResponseTime}h` : '0h',
                        reopenRate,
                        weeklyTarget: completedThisWeek,
                        slaCompliance
                    });
                }

                if (ticketsData) {
                    setTickets(Array.isArray(ticketsData.data) ? ticketsData.data : (Array.isArray(ticketsData) ? ticketsData : []));
                }
            } catch (error) {
                console.error('Failed to load team member dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="space-y-8">
                {/* Header skeleton */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="h-8 w-48 rounded-lg animate-pulse bg-muted" />
                        <div className="h-4 w-64 rounded-lg animate-pulse bg-muted" />
                    </div>
                    <div className="h-10 w-36 rounded-lg animate-pulse bg-muted" />
                </div>

                {/* Row 1 - Primary KPIs */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-2xl animate-pulse bg-muted" />)}
                </div>

                {/* Row 2 - Secondary KPIs */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl animate-pulse bg-muted" />)}
                </div>

                {/* Row 3 - Tertiary KPIs */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="h-24 rounded-2xl animate-pulse bg-muted" />
                    <div className="h-24 rounded-2xl animate-pulse bg-muted" />
                </div>

                {/* Charts skeleton */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-2xl animate-pulse bg-muted" />)}
                </div>

                {/* Trend chart skeleton */}
                <div className="h-80 rounded-2xl animate-pulse bg-muted" />

                {/* Tables skeleton */}
                <div className="h-64 rounded-2xl animate-pulse bg-muted" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in-50">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Team Dashboard</h2>
                    <p className="text-muted-foreground">
                        Overview of your assigned tickets and performance metrics.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/tickets">
                            <ClipboardList className="mr-2 h-4 w-4" />
                            View All Tickets
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Primary KPI Cards - Row 1 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Assigned to Me"
                    value={stats.assigned}
                    icon={ClipboardList}
                    description="Total active tickets"
                />
                <StatsCard
                    title="In Progress"
                    value={stats.inProgress}
                    icon={PlayCircle}
                    className="bg-blue-50/50 dark:bg-blue-900/10"
                />
                <StatsCard
                    title="Completed"
                    value={stats.completed}
                    icon={CheckCircle2}
                    className="bg-green-50/50 dark:bg-green-900/10"
                />
                <StatsCard
                    title="Avg Resolution"
                    value={stats.avgResolution}
                    icon={Clock}
                />
            </div>

            {/* Secondary KPI Cards - Row 2 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-premium overflow-hidden">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Completed Today</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-extrabold">{stats.completedToday}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">vs daily target</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-success" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-premium overflow-hidden">
                    <CardContent className="p-5">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Workload</p>
                                <span className="text-xs font-bold text-primary">{stats.currentWorkload}%</span>
                            </div>
                            <Progress value={stats.currentWorkload} className="h-2" />
                            <div className="flex items-center justify-center">
                                <Gauge className="h-5 w-5 text-primary mr-2" />
                                <p className="text-xs text-muted-foreground">
                                    {stats.currentWorkload < 50 ? 'Low' : stats.currentWorkload < 80 ? 'Moderate' : 'High'} capacity
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-premium overflow-hidden">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">First Response Time</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-extrabold">{stats.firstResponseTime}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">vs team avg</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-blue/10 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-premium overflow-hidden">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reopen Rate</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-extrabold">{stats.reopenRate}%</span>
                                </div>
                                <p className="text-xs text-muted-foreground">of completed tickets</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-orange/10 flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-orange-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tertiary KPI Cards - Row 3 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                <Card className="border-none shadow-premium overflow-hidden">
                    <CardContent className="p-5">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Weekly Target</p>
                                <span className="text-xs font-bold text-primary">{stats.weeklyTarget} completed</span>
                            </div>
                            <Progress value={Math.min((stats.weeklyTarget / 10) * 100, 100)} className="h-2" />
                            <p className="text-xs text-muted-foreground">Target: 10 tickets/week</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-premium overflow-hidden">
                    <CardContent className="p-5">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">SLA Compliance</p>
                                <span className="text-xs font-bold text-success">{stats.slaCompliance}%</span>
                            </div>
                            <Progress value={stats.slaCompliance} className="h-2" />
                            <p className="text-xs text-muted-foreground">Within SLA targets</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section - Row 1 */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <MyTicketsPriorityChart data={tickets} />
                </div>
                <div className="lg:col-span-1">
                    <MyTicketsStatusChart data={tickets} />
                </div>
                <div className="lg:col-span-1">
                    <Card className="border-none shadow-premium">
                        <CardHeader>
                            <CardTitle>Performance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">Satisfaction Rating</p>
                                    <p className="text-sm text-muted-foreground">Based on feedback</p>
                                </div>
                                <div className="flex items-center text-amber-500 font-bold text-xl">
                                    {user?.rating || '4.8'} <Star className="ml-1 h-5 w-5 fill-current" />
                                </div>
                            </div>
                            <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 w-[96%]" />
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Tickets Target (Month)</span>
                                    <span className="text-sm text-muted-foreground">{stats.weeklyTarget * 4}/50</span>
                                </div>
                                <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${Math.min((stats.weeklyTarget * 4 / 50) * 100, 100)}%` }} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Trend Chart */}
            <MyTicketTrendChart data={tickets} />

            {/* Data Tables Section */}
            <div className="space-y-6">
                <Card className="border-none shadow-premium overflow-hidden">
                    <CardHeader className="px-6 py-5 bg-secondary">
                        <CardTitle className="text-xl font-bold">My Active Tickets</CardTitle>
                        <CardDescription>All tickets currently assigned to you with SLA countdowns.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <MyActiveTicketsTable tickets={tickets} loading={loading} />
                    </CardContent>
                </Card>

                <Card className="border-none shadow-premium overflow-hidden">
                    <CardHeader className="px-6 py-5 bg-secondary">
                        <CardTitle className="text-xl font-bold">Recently Completed</CardTitle>
                        <CardDescription>Your last 5 resolved tickets.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <RecentlyCompletedTable tickets={tickets} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
