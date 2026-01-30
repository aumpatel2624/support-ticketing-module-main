import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClipboardList, Loader2, PlayCircle, CheckCircle2, Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCard from './StatsCard';
import RecentTicketsList from './RecentTicketsList';
import ticketService from '@/lib/services/ticketService';
import analyticsService from '@/lib/services/analyticsService';

export default function TeamMemberDashboard({ user }) {
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState({
        assigned: 0,
        inProgress: 0,
        completed: 0,
        avgResolution: '0h'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                const [statsData, ticketsData] = await Promise.all([
                    analyticsService.getDashboardStats(),
                    ticketService.getAssignedTickets({ limit: 5 })
                ]);

                if (statsData) {
                    setStats({
                        assigned: statsData.totalTickets || 0,
                        inProgress: statsData.statusStats?.['In Progress'] || 0,
                        completed: statsData.resolvedTickets || 0,
                        avgResolution: statsData.avgResolutionTime ? `${statsData.avgResolutionTime}h` : '0h'
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
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Team Dashboard</h2>
                    <p className="text-muted-foreground">
                        Overview of your assigned tickets and performance.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/tickets">
                            <ClipboardList className="mr-2 h-4 w-4" />
                            View Assigned
                        </Link>
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
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

            <div className="grid gap-4 lg:grid-cols-3">
                {/* Recent Tickets */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold tracking-tight">My Assigned Tickets</h3>
                    </div>
                    <RecentTicketsList tickets={tickets} loading={loading} />
                </div>

                {/* Performance Widget */}
                <div className="lg:col-span-1 space-y-4">
                    <Card>
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
                                    <span className="text-sm text-muted-foreground">0/50</span>
                                </div>
                                <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-[0%]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
