'use client';

import Link from 'next/link';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { getPriorityColor, cn, formatRelativeTime } from '@/lib/utils';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Helper to format ticket age
function formatTicketAge(createdAt) {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHrs / 24);

    if (diffDays > 0) {
        const remainingHrs = diffHrs % 24;
        return `${diffDays}d ${remainingHrs}h`;
    }
    return `${diffHrs}h`;
}

export default function CriticalTicketsTable({ tickets = [], loading = false }) {
    // Sort tickets by SLA status (Breached first, then At Risk, then On Track)
    const sortedTickets = [...tickets].sort((a, b) => {
        const priorityOrder = { 'Breached': 0, 'At Risk': 1, 'On Track': 2 };
        const priorityA = priorityOrder[a.slaStatus] ?? 3;
        const priorityB = priorityOrder[b.slaStatus] ?? 3;

        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        // Secondary sort by priority (Critical before High)
        if (a.priority === 'Urgent' && b.priority !== 'Urgent') return -1;
        if (a.priority !== 'Urgent' && b.priority === 'Urgent') return 1;

        // Tertiary sort by creation date (oldest first)
        return new Date(a.createdAt) - new Date(b.createdAt);
    });

    const getSLAColor = (status) => {
        switch (status) {
            case 'Breached':
                return 'bg-destructive/10 text-destructive border-destructive/20';
            case 'At Risk':
                return 'bg-warning/10 text-warning border-warning/20';
            default:
                return 'bg-success/10 text-success border-success/20';
        }
    };

    if (loading) {
        return (
            <div className="h-[300px] flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <LoadingSpinner size="lg" />
                <span className="font-medium animate-pulse">Loading critical tickets...</span>
            </div>
        );
    }

    if (tickets.length === 0) {
        return (
            <EmptyState
                title="No critical tickets"
                description="There are no critical or high priority tickets requiring attention."
                className="min-h-[300px] py-12"
            />
        );
    }

    return (
        <div className="overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="w-[100px] pl-6 font-bold text-[10px] uppercase tracking-widest">ID</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest">Subject</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Priority</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest">Assigned To</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Age</TableHead>
                        <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">SLA Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedTickets.slice(0, 10).map((ticket) => (
                        <TableRow
                            key={ticket._id || ticket.id}
                            className={cn(
                                "group cursor-pointer hover:bg-primary/[0.02] transition-colors border-b/5 border-border/40",
                                ticket.slaStatus === 'Breached' && "bg-destructive/5",
                                ticket.slaStatus === 'At Risk' && "bg-warning/5"
                            )}
                        >
                            <TableCell className="pl-6">
                                <Link href={`/tickets/${ticket._id || ticket.id}`}>
                                    <span className="bg-primary/5 px-2 py-1 rounded text-[11px] uppercase tracking-tighter font-bold text-primary/70 group-hover:text-primary transition-colors">
                                        {ticket.ticketId || `#${ticket._id?.slice(-6)}`}
                                    </span>
                                </Link>
                            </TableCell>

                            <TableCell>
                                <div className="flex flex-col gap-0.5 max-w-[250px]">
                                    <Link
                                        href={`/tickets/${ticket._id || ticket.id}`}
                                        className="font-bold text-sm text-foreground group-hover:underline decoration-primary/30 underline-offset-4 truncate"
                                    >
                                        {ticket.subject}
                                    </Link>
                                    <span className="text-[10px] text-muted-foreground">
                                        {ticket.categoryId?.name || ticket.category?.name || 'Uncategorized'}
                                    </span>
                                </div>
                            </TableCell>

                            <TableCell className="text-center">
                                <Badge variant="outline" className={cn(
                                    "rounded-md border-none px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm",
                                    getPriorityColor(ticket.priority)
                                )}>
                                    {ticket.priority}
                                </Badge>
                            </TableCell>

                            <TableCell>
                                <span className="text-sm text-muted-foreground">
                                    {ticket.assignedTo?.name || (
                                        <span className="text-destructive flex items-center gap-1 text-xs">
                                            <AlertTriangle className="h-3 w-3" />
                                            Unassigned
                                        </span>
                                    )}
                                </span>
                            </TableCell>

                            <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {formatTicketAge(ticket.createdAt)}
                                </div>
                            </TableCell>

                            <TableCell className="text-right pr-6">
                                <Badge variant="outline" className={cn(
                                    "rounded-md border-none px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm",
                                    getSLAColor(ticket.slaStatus)
                                )}>
                                    {ticket.slaStatus === 'On Track' && ticket.timeRemaining !== null && (
                                        <span className="mr-1">{ticket.timeRemaining}h</span>
                                    )}
                                    {ticket.slaStatus}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {tickets.length > 10 && (
                <div className="p-4 border-t border-border/50">
                    <Button variant="ghost" className="w-full text-xs font-medium text-muted-foreground hover:text-primary" asChild>
                        <Link href="/tickets?priority=Urgent,High">
                            View All Critical Tickets
                            <ArrowRight className="ml-2 h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
