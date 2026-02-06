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
import { ArrowRight, Clock, User, Tag } from 'lucide-react';
import { getStatusColor, getPriorityColor, formatRelativeTime, cn } from '@/lib/utils';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function RecentTicketsList({ tickets = [], loading = false }) {
  if (loading) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <LoadingSpinner size="lg" />
        <span className="font-medium animate-pulse">Syncing with server...</span>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <EmptyState
        title="No activity detected"
        description="There are currently no tickets in the system queue."
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
            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-left">Internal Subject</TableHead>
            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Priority</TableHead>
            <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Last Update</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id} className="group cursor-pointer hover:bg-primary/[0.02] transition-colors border-b/5 border-border/40">
              <TableCell className="pl-6 font-bold text-primary/70 group-hover:text-primary transition-colors">
                <Link href={`/tickets?id=${ticket.id}`} prefetch={false} className="flex items-center gap-2">
                  <span className="bg-primary/5 px-2 py-1 rounded text-[11px] uppercase tracking-tighter">
                    {ticket.ticketId}
                  </span>
                </Link>
              </TableCell>

              <TableCell>
                <div className="flex flex-col gap-0.5 max-w-[250px] lg:max-w-[400px]">
                  <span className="font-bold text-foreground group-hover:underline decoration-primary/30 underline-offset-4 truncate">
                    {ticket.subject}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <Tag className="h-2.5 w-2.5" />
                      {ticket.category?.name || 'Uncategorized'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User className="h-2.5 w-2.5" />
                      {ticket.createdBy?.name || 'System'}
                    </span>
                  </div>
                </div>
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
