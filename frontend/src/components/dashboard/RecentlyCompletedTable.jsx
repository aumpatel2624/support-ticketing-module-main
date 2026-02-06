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
import { Clock, User, CheckCircle2 } from 'lucide-react';
import { getPriorityColor, formatRelativeTime, cn } from '@/lib/utils';
import EmptyState from '@/components/common/EmptyState';

export default function RecentlyCompletedTable({ tickets = [] }) {
    // Filter only completed/closed tickets and sort by completion date
    const completedTickets = tickets
        .filter(t => t.status === 'Completed' || t.status === 'Closed')
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 5);

    if (completedTickets.length === 0) {
        return (
            <EmptyState
                title="No completed tickets"
                description="You haven't completed any tickets yet."
                className="min-h-[200px] py-8"
            />
        );
    }

    return (
        <div className="overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="w-[120px] pl-6 font-bold text-[10px] uppercase tracking-widest">ID</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-left">Subject</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Priority</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Requester</TableHead>
                        <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Completed</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {completedTickets.map((ticket) => (
                        <TableRow key={ticket._id || ticket.id} className="group cursor-pointer hover:bg-success/[0.02] transition-colors border-b/5 border-border/40">
                            <TableCell className="pl-6 font-bold text-success/70 group-hover:text-success transition-colors">
                                <Link href={`/tickets/${ticket._id || ticket.id}`} prefetch={false} className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span className="bg-success/5 px-2 py-1 rounded text-[11px] uppercase tracking-tighter">
                                        {ticket.ticketId}
                                    </span>
                                </Link>
                            </TableCell>

                            <TableCell>
                                <Link href={`/tickets/${ticket._id || ticket.id}`} prefetch={false}>
                                    <span className="font-bold text-foreground group-hover:underline decoration-success/30 underline-offset-4 truncate max-w-[250px] line-clamp-1">
                                        {ticket.subject}
                                    </span>
                                </Link>
                            </TableCell>

                            <TableCell className="text-center">
                                <Badge variant="outline" className={cn(
                                    "rounded-md border-none px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm",
                                    getPriorityColor(ticket.priority)
                                )}>
                                    {ticket.priority}
                                </Badge>
                            </TableCell>

                            <TableCell className="text-center text-xs text-muted-foreground">
                                <div className="flex items-center justify-center gap-1">
                                    <User className="h-3 w-3" />
                                    {ticket.createdBy?.name || 'System'}
                                </div>
                            </TableCell>

                            <TableCell className="text-right pr-6 font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                <div className="flex items-center justify-end gap-1.5 text-xs">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground group-hover:text-success transition-colors" />
                                    {formatRelativeTime(ticket.completedAt || ticket.updatedAt)}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
