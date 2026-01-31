'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Loader2, Calendar, MessageSquare, AlertCircle, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StatsCard from './StatsCard';
import UserTicketHistoryChart from './UserTicketHistoryChart';
import UserPriorityChart from './UserPriorityChart';
import UserActiveTicketsTable from './UserActiveTicketsTable';
import UserRecentResolutionsTable from './UserRecentResolutionsTable';
import ticketService from '@/lib/services/ticketService';
import { TICKET_STATUS, TICKET_PRIORITY } from '@/lib/constants';
import { cn, getInitials, getAvatarColor, formatDate } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function NormalUserDashboard({ user }) {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    myOpenTickets: 0,
    awaitingResponse: 0,
    resolvedThisMonth: 0,
    avgResolutionTime: '0h'
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('dashboard');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch all user's tickets (limit 100)
        const ticketsData = await ticketService.getMyTickets({ limit: 100 });

        if (ticketsData) {
          const ticketArray = Array.isArray(ticketsData.data) ? ticketsData.data : (Array.isArray(ticketsData) ? ticketsData : []);
          setTickets(ticketArray);

          // Calculate stats
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

          const myOpenTickets = ticketArray.filter(t =>
            t.status !== 'Completed' && t.status !== 'Closed'
          ).length;

          const awaitingResponse = ticketArray.filter(t =>
            t.status !== 'Completed' && t.status !== 'Closed' && t.status !== 'InProgress'
          ).length;

          const resolvedThisMonth = ticketArray.filter(t =>
            (t.status === 'Completed' || t.status === 'Closed') &&
            t.completedAt && new Date(t.completedAt) >= monthStart
          ).length;

          // Calculate average resolution time
          const resolvedTickets = ticketArray.filter(t => t.completedAt && t.createdAt);
          let avgResolutionTime = '0h';
          if (resolvedTickets.length > 0) {
            const totalHours = resolvedTickets.reduce((sum, t) => {
              const created = new Date(t.createdAt);
              const completed = new Date(t.completedAt);
              return sum + ((completed - created) / (1000 * 60 * 60));
            }, 0);
            const avgHours = Math.round(totalHours / resolvedTickets.length);
            avgResolutionTime = avgHours > 24 ? `${Math.round(avgHours / 24)}d` : `${avgHours}h`;
          }

          setStats({
            myOpenTickets,
            awaitingResponse,
            resolvedThisMonth,
            avgResolutionTime
          });
        }

      } catch (error) {
        console.error('Failed to load user dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Group tickets by status
  const groupedTickets = {
    [TICKET_STATUS.NEW]: [],
    [TICKET_STATUS.ASSIGNED]: [],
    [TICKET_STATUS.IN_PROGRESS]: [],
    [TICKET_STATUS.PENDING]: [],
    [TICKET_STATUS.COMPLETED]: [],
    [TICKET_STATUS.CLOSED]: [],
    // catch-all for others if needed, using a generic 'Other' or sticking to main flow
  };

  tickets.forEach(ticket => {
    if (groupedTickets[ticket.status]) {
      groupedTickets[ticket.status].push(ticket);
    } else {
      // If status matches none of the keys (e.g. escalated), maybe put in progress or separate
      // For now, let's add them to Pending or In Progress if active
      if (!groupedTickets[ticket.status]) groupedTickets[ticket.status] = [];
      groupedTickets[ticket.status].push(ticket);
    }
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case TICKET_PRIORITY.URGENT: return 'text-red-600 bg-red-100 border-red-200';
      case TICKET_PRIORITY.HIGH: return 'text-orange-600 bg-orange-100 border-orange-200';
      case TICKET_PRIORITY.MEDIUM: return 'text-blue-600 bg-blue-100 border-blue-200';
      case TICKET_PRIORITY.LOW: return 'text-slate-600 bg-slate-100 border-slate-200';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-100px)]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  // If viewing in dashboard mode, show the dashboard
  if (viewMode === 'dashboard') {
    return (
      <div className="space-y-8 animate-in fade-in-50">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">My Support Tickets</h2>
            <p className="text-muted-foreground">
              Track and manage your service requests
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setViewMode('kanban')}>
              <Calendar className="mr-2 h-4 w-4" />
              Board View
            </Button>
            <Button asChild>
              <Link href="/tickets/new">
                <Plus className="mr-2 h-4 w-4" />
                New Ticket
              </Link>
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="My Open Tickets"
            value={stats.myOpenTickets}
            icon={AlertCircle}
            description="Tickets needing action"
          />
          <StatsCard
            title="Awaiting Response"
            value={stats.awaitingResponse}
            icon={MessageSquare}
            className="bg-blue-50/50 dark:bg-blue-900/10"
          />
          <StatsCard
            title="Resolved This Month"
            value={stats.resolvedThisMonth}
            icon={CheckCircle2}
            className="bg-green-50/50 dark:bg-green-900/10"
          />
          <StatsCard
            title="Avg Resolution Time"
            value={stats.avgResolutionTime}
            icon={Clock}
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <UserTicketHistoryChart data={tickets} />
          <UserPriorityChart data={tickets} />
        </div>

        {/* Data Tables Section */}
        <div className="space-y-6">
          <Card className="border-none shadow-premium overflow-hidden">
            <CardHeader className="px-6 py-5 bg-secondary">
              <CardTitle className="text-xl font-bold">My Active Tickets</CardTitle>
              <CardDescription>All your open service requests</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <UserActiveTicketsTable tickets={tickets} loading={loading} />
            </CardContent>
          </Card>

          <Card className="border-none shadow-premium overflow-hidden">
            <CardHeader className="px-6 py-5 bg-secondary">
              <CardTitle className="text-xl font-bold">Recently Resolved</CardTitle>
              <CardDescription>Your last 3 resolved tickets</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <UserRecentResolutionsTable tickets={tickets} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Kanban view
  const kanbanColumns = [
    { id: TICKET_STATUS.NEW, label: 'New', color: 'bg-blue-500/10 border-blue-500/20 text-blue-700' },
    { id: TICKET_STATUS.ASSIGNED, label: 'Assigned', color: 'bg-purple-500/10 border-purple-500/20 text-purple-700' },
    { id: TICKET_STATUS.IN_PROGRESS, label: 'In Progress', color: 'bg-amber-500/10 border-amber-500/20 text-amber-700' },
    { id: TICKET_STATUS.PENDING, label: 'Pending', color: 'bg-orange-500/10 border-orange-500/20 text-orange-700' },
    { id: TICKET_STATUS.COMPLETED, label: 'Resolved', color: 'bg-green-500/10 border-green-500/20 text-green-700' },
    { id: TICKET_STATUS.CLOSED, label: 'Closed', color: 'bg-slate-500/10 border-slate-500/20 text-slate-700' },
  ];

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tickets Board</h1>
          <p className="text-muted-foreground">Manage and track your service requests</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode('dashboard')}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button asChild>
            <Link href="/tickets/new">
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Link>
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex h-full gap-6 min-w-max px-2">
          {kanbanColumns.map(col => (
            <div key={col.id} className="w-80 flex flex-col gap-4">
              {/* Column Header */}
              <div className={cn("flex items-center justify-between px-4 py-3 rounded-xl border font-semibold", col.color)}>
                <span>{col.label}</span>
                <Badge variant="secondary" className="bg-white/50 text-foreground shadow-sm">
                  {groupedTickets[col.id]?.length || 0}
                </Badge>
              </div>

              {/* Tickets Area */}
              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-3 pb-4">
                  {groupedTickets[col.id]?.map(ticket => (
                    <Link key={ticket._id || ticket.id} href={`/tickets/${ticket._id || ticket.id}`}>
                      <Card className="hover:shadow-md transition-all cursor-pointer border-l-4 group"
                        style={{
                          borderLeftColor: ticket.priority === 'Urgent' ? '#ef4444' :
                            ticket.priority === 'High' ? '#f97316' :
                              ticket.priority === 'Medium' ? '#3b82f6' : '#94a3b8'
                        }}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-mono text-xs text-muted-foreground shrink-0">
                              #{ticket.ticketId?.split('-').pop()}
                            </span>
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 font-medium border", getPriorityColor(ticket.priority))}>
                              {ticket.priority}
                            </Badge>
                          </div>

                          <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {ticket.subject}
                          </h4>

                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {ticket.description}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t mt-2">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                            </div>

                            {ticket.assignedTo ? (
                              <Avatar className="h-5 w-5 border">
                                <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                  {ticket.assignedTo.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">Unassigned</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}

                  {(!groupedTickets[col.id] || groupedTickets[col.id].length === 0) && (
                    <div className="h-24 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground text-sm opacity-50">
                      Empty
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
