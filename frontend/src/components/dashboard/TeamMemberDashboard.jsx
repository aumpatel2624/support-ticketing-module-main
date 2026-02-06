import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClipboardList, Loader2, PlayCircle, CheckCircle2, Clock, TrendingUp, Target, Zap, AlertCircle, Gauge } from 'lucide-react';
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
        fcrPercentage: 0,
        weeklyTarget: 0,
        slaCompliance: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);

                // Fetch personal performance stats and tickets in parallel
                const [performanceData, ticketsData] = await Promise.all([
                    analyticsService.getMyPerformance().catch(err => {
                        console.warn('Failed to load personal performance:', err);
                        return null;
                    }),
                    ticketService.getAssignedTickets({ limit: 100 }).catch(err => {
                        console.warn('Failed to load tickets:', err);
                        return { data: [] };
                    })
                ]);

                // Set stats from the dedicated my-performance API
                if (performanceData) {
                    // Calculate in-progress from tickets
                    const ticketArray = Array.isArray(ticketsData?.data) ? ticketsData.data : (Array.isArray(ticketsData) ? ticketsData : []);
                    const inProgressCount = ticketArray.filter(t => t.status === 'InProgress').length;

                    setStats({
                        assigned: performanceData.totalAssigned || 0,
                        inProgress: inProgressCount,
                        completed: performanceData.totalResolved || 0,
                        avgResolution: performanceData.avgResolutionHours ? `${performanceData.avgResolutionHours}h` : '0h',
                        completedToday: performanceData.completedToday || 0,
                        currentWorkload: performanceData.workloadPercentage || 0,
                        firstResponseTime: performanceData.avgResponseHours ? `${performanceData.avgResponseHours}h` : '0h',
                        fcrPercentage: performanceData.fcrPercentage || 0,
                        weeklyTarget: performanceData.completedThisWeek || 0,
                        slaCompliance: performanceData.slaCompliance || 100
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
                    <p className="text-muted-foreground mt-1">
                        Here&apos;s what&apos;s happening with your tickets today.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="shadow-sm border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-300" asChild>
                        <Link href="/tickets" prefetch={false}>
                            <ClipboardList className="mr-2 h-4 w-4" />
                            View All Tickets
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Primary KPI Cards - Row 1 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-in slide-in-from-bottom-4 fade-in duration-500 delay-100">
                <StatsCard
                    title="Assigned to Me"
                    value={stats.assigned}
                    icon={ClipboardList}
                    description="Total active tickets"
                    href="/tickets/assigned"
                    className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20"
                />
                <StatsCard
                    title="Resolved"
                    value={stats.completed}
                    icon={CheckCircle2}
                    className="bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20"
                    href="/tickets?status=Resolved&assignedToMe=true"
                />
                <StatsCard
                    title="Avg Resolution"
                    value={stats.avgResolution}
                    icon={Clock}
                    description="Average turnaround time"
                    className="bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/20"
                />
                <StatsCard
                    title="Completed Today"
                    value={stats.completedToday}
                    icon={Target}
                    description="vs daily target"
                    className="bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/20"
                />
            </div>


            {/* Charts Section - Row 1 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                <div className="col-span-1">
                    <MyTicketsPriorityChart data={tickets} />
                </div>
                <div className="col-span-1">
                    <MyTicketsStatusChart data={tickets} />
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
