'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Users,
    Ticket,
    AlertCircle,
    CheckCircle,
    ArrowRight,
    Clock,
    TrendingUp,
    TrendingDown,
    Minus,
    Target,
    Inbox,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import StatsCard from './StatsCard';
import RecentTicketsList from './RecentTicketsList';
import TicketVolumeChart from './TicketVolumeChart';
import TicketStatusPieChart from './TicketStatusPieChart';
import PriorityDonutChart from './PriorityDonutChart';
import CategoryBarChart from './CategoryBarChart';
import SLAPerformanceChart from './SLAPerformanceChart';
import PeakHoursHeatmap from './PeakHoursHeatmap';
import SLAComplianceGauge from './SLAComplianceGauge';
import AgentPerformanceTable from './AgentPerformanceTable';
import CriticalTicketsTable from './CriticalTicketsTable';
import analyticsService from '@/lib/services/analyticsService';
import ticketService from '@/lib/services/ticketService';
import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import toast from 'react-hot-toast';

// Secondary KPI Card Component
function SecondaryKPICard({ title, value, subtext, icon: Icon, trend, trendDirection, alert = false, progress, href }) {
    const getTrendIcon = () => {
        if (trendDirection === 'up') return <TrendingUp className="h-3 w-3" />;
        if (trendDirection === 'down') return <TrendingDown className="h-3 w-3" />;
        return <Minus className="h-3 w-3" />;
    };

    const getTrendColor = () => {
        if (alert) return 'text-destructive bg-destructive/10';
        if (trendDirection === 'up') return 'text-success bg-success/10';
        if (trendDirection === 'down') return 'text-destructive bg-destructive/10';
        return 'text-muted-foreground bg-muted';
    };

    const Content = () => (
        <Card className={cn(
            "border-none shadow-premium bg-card overflow-hidden",
            alert && "border-l-4 border-l-destructive",
            href && "hover:shadow-lg transition-shadow cursor-pointer" // Add hover effect if clickable
        )}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold">{value}</span>
                            {trend !== undefined && (
                                <span className={cn(
                                    "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold",
                                    getTrendColor()
                                )}>
                                    {getTrendIcon()}
                                    {trend}%
                                </span>
                            )}
                        </div>
                        {subtext && (
                            <p className="text-xs text-muted-foreground">{subtext}</p>
                        )}
                        {progress !== undefined && (
                            <div className="w-full mt-2">
                                <Progress value={progress} className="h-1.5" />
                            </div>
                        )}
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    if (href) {
        return (
            <Link href={href} prefetch={false} className="block">
                <Content />
            </Link>
        );
    }

    return <Content />;
}

// Line Chart Component for Ticket Trends
function TicketTrendLineChart({ data, period, onPeriodChange }) {
    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = require('recharts');

    // Transform data for the chart
    const chartData = data.created?.map((item, index) => ({
        date: item.date,
        created: item.count,
        resolved: data.resolved?.[index]?.count || 0
    })) || [];

    const hasData = chartData.length > 0;

    return (
        <Card className="border-none shadow-premium bg-card overflow-hidden flex flex-col h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between shrink-0">
                <div>
                    <CardTitle className="text-xl font-bold">Ticket Volume Trends</CardTitle>
                    <CardDescription>Created vs Resolved tickets over time.</CardDescription>
                </div>
                <Tabs value={period} onValueChange={onPeriodChange} className="w-auto">
                    <TabsList className="h-8">
                        <TabsTrigger value="7d" className="text-xs px-3">7D</TabsTrigger>
                        <TabsTrigger value="30d" className="text-xs px-3">30D</TabsTrigger>
                        <TabsTrigger value="90d" className="text-xs px-3">90D</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent className="px-2 pt-4 flex-1 min-h-[350px] flex flex-col">
                <div className="flex-1 w-full h-full min-h-[300px] flex flex-col">
                    {hasData ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                                <XAxis
                                    dataKey="date"
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => {
                                        const date = new Date(value);
                                        return `${date.getMonth() + 1}/${date.getDate()}`;
                                    }}
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
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground italic animate-pulse p-4 text-center">
                            No trend data available...
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function AdminDashboard({ user }) {
    const [stats, setStats] = useState({
        totalTickets: 0,
        pendingTickets: 0,
        slaBreached: 0,
        activeAgents: 0,
        avgResolution: '0h',
        avgResponseTime: '0h',
        trends: {
            activeTickets: 0,
            slaRisk: 0,
            responseTime: 0,
            resolutionTime: 0
        },
        teamCapacity: { active: 0, total: 0, percentage: 0 },
        firstContactResolution: { percentage: 0 },
        ticketBacklog: 0,
        resolutionRateToday: { percentage: 0, resolvedToday: 0, createdToday: 0 },
        slaCompliance: 0
    });
    const [recentTickets, setRecentTickets] = useState([]);
    const [monthlyTrend, setMonthlyTrend] = useState([]);
    const [statusDistribution, setStatusDistribution] = useState([]);
    const [priorityDistribution, setPriorityDistribution] = useState([]);
    const [trendPeriod, setTrendPeriod] = useState('7d');
    const [trendData, setTrendData] = useState({ created: [], resolved: [] });
    const [categoryStats, setCategoryStats] = useState([]);
    const [slaPerformance, setSlaPerformance] = useState([]);
    const [peakHoursData, setPeakHoursData] = useState([]);
    const [agentStats, setAgentStats] = useState([]);
    const [criticalTickets, setCriticalTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                // Fetch all stats in parallel
                const [
                    dashboardStats,
                    ticketsOutput,
                    trendsOutput,
                    categoriesOutput,
                    slaOutput,
                    peakHoursOutput,
                    agentsOutput,
                    criticalOutput
                ] = await Promise.all([
                    analyticsService.getDashboardStats().catch(err => {
                        console.warn('Dashboard stats failed:', err);
                        return null;
                    }),
                    ticketService.getTickets({ limit: 5, sort: '-createdAt' }).catch(err => ({ data: [] })),
                    api.get(`${API_ENDPOINTS.ANALYTICS}/trends?period=${trendPeriod}`).catch(err => ({ data: { data: { created: [], resolved: [] } } })),
                    api.get(`${API_ENDPOINTS.ANALYTICS}/categories`).catch(err => ({ data: { data: [] } })),
                    api.get(`${API_ENDPOINTS.ANALYTICS}/sla-performance`).catch(err => ({ data: { data: { byPriority: [] } } })),
                    api.get(`${API_ENDPOINTS.ANALYTICS}/peak-hours`).catch(err => ({ data: { data: { heatmap: [] } } })),
                    api.get(`${API_ENDPOINTS.ANALYTICS}/agents`).catch(err => ({ data: { data: [] } })),
                    api.get(`${API_ENDPOINTS.ANALYTICS}/critical-tickets`).catch(err => ({ data: { data: [] } }))
                ]);

                // Process dashboard stats
                if (dashboardStats) {
                    setStats({
                        totalTickets: dashboardStats.totalTickets || 0,
                        pendingTickets: dashboardStats.pendingTickets || 0,
                        slaBreached: dashboardStats.slaBreached || 0,
                        activeAgents: dashboardStats.activeAgents || 0,
                        avgResolution: dashboardStats.avgResolutionTime ? `${dashboardStats.avgResolutionTime}h` : '0h',
                        avgResponseTime: dashboardStats.avgResponseTime ? `${dashboardStats.avgResponseTime}h` : '0h',
                        trends: dashboardStats.trends || {
                            activeTickets: 0,
                            slaRisk: 0,
                            responseTime: 0,
                            resolutionTime: 0
                        },
                        teamCapacity: dashboardStats.teamCapacity || { active: 0, total: 0, percentage: 0 },
                        firstContactResolution: dashboardStats.firstContactResolution || { percentage: 0 },
                        ticketBacklog: dashboardStats.ticketBacklog || 0,
                        resolutionRateToday: dashboardStats.resolutionRateToday || { percentage: 0, resolvedToday: 0, createdToday: 0 },
                        slaCompliance: dashboardStats.slaCompliance || 0
                    });
                    setMonthlyTrend(dashboardStats.monthlyTrend || []);

                    // Transform status distribution
                    setStatusDistribution(dashboardStats.statusDistribution || []);

                    // Transform priority distribution
                    setPriorityDistribution(dashboardStats.priorityDistribution || []);
                }

                // Process tickets
                let t_list = [];
                if (ticketsOutput.data && Array.isArray(ticketsOutput.data)) t_list = ticketsOutput.data;
                else if (Array.isArray(ticketsOutput)) t_list = ticketsOutput;
                setRecentTickets(t_list);

                // Process trends
                if (trendsOutput.data?.data) {
                    setTrendData(trendsOutput.data.data);
                }

                // Process categories
                if (categoriesOutput.data?.data) {
                    setCategoryStats(categoriesOutput.data.data);
                }

                // Process SLA performance
                if (slaOutput.data?.data?.byPriority) {
                    setSlaPerformance(slaOutput.data.data.byPriority);
                }

                // Process peak hours
                if (peakHoursOutput.data?.data?.heatmap) {
                    setPeakHoursData(peakHoursOutput.data.data.heatmap);
                }

                // Process agents
                if (agentsOutput.data?.data) {
                    setAgentStats(agentsOutput.data.data);
                }

                // Process critical tickets
                if (criticalOutput.data?.data) {
                    setCriticalTickets(criticalOutput.data.data);
                }

            } catch (error) {
                console.error('Error loading dashboard:', error);
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [trendPeriod]);

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="grid gap-6 md:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-2xl animate-pulse bg-muted" />)}
                </div>
                <div className="grid gap-6 md:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl animate-pulse bg-muted" />)}
                </div>
                <div className="grid gap-6 lg:grid-cols-7">
                    <div className="lg:col-span-4 h-96 rounded-2xl animate-pulse bg-muted" />
                    <div className="lg:col-span-3 h-96 rounded-2xl animate-pulse bg-muted" />
                </div>
            </div>
        );
    }

    // Calculate active tickets count
    const activeTicketsCount = stats.pendingTickets;

    // Calculate SLA risk percentage
    const slaRiskPercentage = activeTicketsCount > 0
        ? Math.round((stats.slaBreached / activeTicketsCount) * 100)
        : 0;

    return (
        <div className="space-y-8">
            {/* Primary KPIs Section */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <StatsCard
                    title="Active Tickets"
                    value={activeTicketsCount}
                    icon={Ticket}
                    trend={{ value: Math.abs(stats.trends.activeTickets), label: "from last week" }}
                    trendDirection={stats.trends.activeTickets >= 0 ? 'up' : 'down'}
                    invertedTrend={true}
                    href="/tickets?status=New,Assigned,InProgress,Reopened,Escalated"
                />
                <StatsCard
                    title="SLA Risk"
                    value={`${stats.slaBreached} (${slaRiskPercentage}%)`}
                    icon={AlertCircle}
                    trend={{ value: Math.abs(stats.trends.slaRisk), label: "from last week" }}
                    trendDirection={stats.trends.slaRisk >= 0 ? 'up' : 'down'}
                    invertedTrend={true}
                    className={stats.slaBreached > 0 ? "border-l-4 border-l-destructive" : ""}
                    href="/tickets?slaStatus=AtRisk,Breached"
                />
                <StatsCard
                    title="Avg Response Time"
                    value={stats.avgResponseTime}
                    icon={Clock}
                    trend={{ value: Math.abs(stats.trends.responseTime), label: "from last week" }}
                    trendDirection={stats.trends.responseTime <= 0 ? 'up' : 'down'}
                    invertedTrend={true}
                    href="/tickets?status=New" // Avg Response is most relevant for New tickets
                />
                <StatsCard
                    title="Avg Resolution Time"
                    value={stats.avgResolution}
                    icon={CheckCircle}
                    trend={{ value: Math.abs(stats.trends.resolutionTime), label: "from last week" }}
                    trendDirection={stats.trends.resolutionTime <= 0 ? 'up' : 'down'}
                    invertedTrend={true}
                    href="/tickets?status=Resolved,Closed"
                />
            </div>



            {/* Secondary Metrics Section */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <SecondaryKPICard
                    title="Team Capacity"
                    value={`${stats.teamCapacity.active}/${stats.teamCapacity.total}`}
                    subtext={`${stats.teamCapacity.percentage}% agents active`}
                    icon={Users}
                    progress={stats.teamCapacity.percentage}
                />
                <SecondaryKPICard
                    title="First Contact Resolution"
                    value={`${stats.firstContactResolution.percentage}%`}
                    subtext={`${stats.firstContactResolution.fcrCount || 0} of ${stats.firstContactResolution.totalResolved || 0} tickets`}
                    icon={Target}
                    trend={5}
                    trendDirection="up"
                />
                <SecondaryKPICard
                    title="Ticket Backlog"
                    value={stats.ticketBacklog}
                    subtext="Tickets >48h unassigned"
                    icon={Inbox}
                    alert={stats.ticketBacklog > 10}
                    href="/tickets?status=New&assignedTo=unassigned" // Map to unassigned new tickets (logic might need check)
                />
                <SecondaryKPICard
                    title="Resolution Rate Today"
                    value={`${stats.resolutionRateToday.percentage}%`}
                    subtext={`Resolved ${stats.resolutionRateToday.resolvedToday} / Created ${stats.resolutionRateToday.createdToday}`}
                    icon={Zap}
                    trend={stats.resolutionRateToday.percentage >= 100 ? 10 : -5}
                    trendDirection={stats.resolutionRateToday.percentage >= 100 ? 'up' : 'down'}
                />
            </div>

            {/* Charts Section - Row 1 */}
            <div className="grid gap-6 xl:grid-cols-7">
                <div className="xl:col-span-4">
                    <TicketTrendLineChart
                        data={trendData}
                        period={trendPeriod}
                        onPeriodChange={setTrendPeriod}
                    />
                </div>
                <div className="xl:col-span-3">
                    <SLAComplianceGauge percentage={stats.slaCompliance} />
                </div>
            </div>

            {/* Charts Section - Row 2: Distribution Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
                <TicketStatusPieChart data={statusDistribution} />
                <PriorityDonutChart data={priorityDistribution} />
            </div>

            {/* Charts Section - Row 3: Category & SLA */}
            <div className="grid gap-6 lg:grid-cols-2">
                <CategoryBarChart data={categoryStats} />
                <SLAPerformanceChart data={slaPerformance} />
            </div>

            {/* Peak Hours Heatmap */}
            <PeakHoursHeatmap data={peakHoursData} />

            {/* Data Tables Section */}
            <div className="grid gap-6 xl:grid-cols-2">
                {/* Critical Tickets Table */}
                <Card className="border-none shadow-premium overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-secondary">
                        <div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                                Critical Tickets
                            </CardTitle>
                            <CardDescription>High priority tickets requiring immediate attention.</CardDescription>
                        </div>
                        <Button variant="ghost" className="rounded-xl group" asChild>
                            <Link href="/tickets?priority=Urgent,High" prefetch={false}>
                                View All
                                <ArrowRight className="ml-2 h-4 w-4 transition-all group-hover:translate-x-1" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <CriticalTicketsTable tickets={criticalTickets} />
                    </CardContent>
                </Card>

                {/* Agent Performance Table */}
                <Card className="border-none shadow-premium overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-secondary">
                        <div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Agent Performance
                            </CardTitle>
                            <CardDescription>Performance metrics for all active agents.</CardDescription>
                        </div>
                        <Button variant="ghost" className="rounded-xl group" asChild>
                            <Link href="/users" prefetch={false}>
                                View All
                                <ArrowRight className="ml-2 h-4 w-4 transition-all group-hover:translate-x-1" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <AgentPerformanceTable agents={agentStats} />
                    </CardContent>
                </Card>
            </div>

            {/* Recent Tickets Section */}
            <Card className="border-none shadow-premium overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-5 bg-secondary">
                    <div>
                        <CardTitle className="text-2xl font-bold">Recent Activity</CardTitle>
                        <CardDescription>Latest tickets across all departments.</CardDescription>
                    </div>
                    <Button variant="ghost" className="rounded-xl group" asChild>
                        <Link href="/tickets" prefetch={false}>
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
    );
}
