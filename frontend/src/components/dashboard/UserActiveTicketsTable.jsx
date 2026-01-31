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
import { Clock, Tag } from 'lucide-react';
import { getStatusColor, getPriorityColor, formatRelativeTime, cn } from '@/lib/utils';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function UserActiveTicketsTable({ tickets = [], loading = false }) {
    const activeTickets = tickets.filter(t => t.status !== 'Completed' && t.status !== 'Closed');

    if (loading) {
        return (
            <div className="h-[300px] flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <LoadingSpinner size="lg" />
                <span className="font-medium animate-pulse">Loading your tickets...</span>
            </div>
        );
    }

    if (activeTickets.length === 0) {
        return (
            <EmptyState
                title="No active tickets"
                description="Great job! You don't have any open tickets right now."
                className="min-h-[300px] py-12"
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
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Priority</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Category</TableHead>
                        <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Created</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {activeTickets.map((ticket) => (
                        <TableRow key={ticket._id || ticket.id} className="group cursor-pointer hover:bg-primary/[0.02] transition-colors border-b/5 border-border/40">
                            <TableCell className="pl-6 font-bold text-primary/70 group-hover:text-primary transition-colors">
                                <Link href={`/tickets/${ticket._id || ticket.id}`} className="flex items-center gap-2">
                                    <span className="bg-primary/5 px-2 py-1 rounded text-[11px] uppercase tracking-tighter">
                                        {ticket.ticketId}
                                    </span>
                                </Link>
                            </TableCell>

                            <TableCell>
                                <Link href={`/tickets/${ticket._id || ticket.id}`}>
                                    <span className="font-bold text-foreground group-hover:underline decoration-primary/30 underline-offset-4 truncate max-w-[250px] line-clamp-1">
                                        {ticket.subject}
                                    </span>
                                </Link>
                            </TableCell>

                            <TableCell className="text-center">
                                <Badge variant="outline" className={cn(
                                    "rounded-md border-none px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm",
                                    getStatusColor(ticket.status)
                                )}>
                                    {ticket.status}
                                </Badge>
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
                                    <Tag className="h-3 w-3" />
                                    {ticket.category?.name || 'Uncategorized'}
                                </div>
                            </TableCell>

                            <TableCell className="text-right pr-6 font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                <div className="flex items-center justify-end gap-1.5 text-xs">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    {formatRelativeTime(ticket.createdAt)}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
