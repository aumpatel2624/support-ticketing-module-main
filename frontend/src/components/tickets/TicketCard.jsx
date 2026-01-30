'use client';

import { useState } from 'react';
import Link from 'next/link';
import ticketService from '@/lib/services/ticketService';
import toast from 'react-hot-toast';
import {
    User,
    Clock,
    MoreHorizontal,
    Building2,
    Tag,
    ArrowUpRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getStatusColor, getPriorityColor, truncate, formatDate, getInitials, getAvatarColor } from '@/lib/utils';
import { getAgeCategory, getAgeLabel, getAgeDescription } from '@/lib/ticketAgeHelper';

/**
 * TicketCard component - Individual ticket card for card view
 */
export default function TicketCard({ ticket, onQuickAction }) {
    const [isHovering, setIsHovering] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const ageCategory = getAgeCategory(ticket.createdAt);
    const ageLabel = getAgeLabel(ticket.createdAt);
    const ageDescription = getAgeDescription(ticket.createdAt);

    const handleMarkCompleted = async (e) => {
        e.stopPropagation();
        try {
            setIsUpdating(true);
            await ticketService.updateTicket(ticket._id, {
                status: 'Completed'
            });
            toast.success('Ticket marked as completed');
            onQuickAction?.('refresh');
        } catch (error) {
            console.error('Failed to update ticket:', error);
            toast.error('Failed to update ticket status');
        } finally {
            setIsUpdating(false);
        }
    };

    const colorMap = {
        fresh: 'border-l-green-500',
        recent: 'border-l-blue-500',
        aging: 'border-l-yellow-500',
        old: 'border-l-orange-500',
        critical: 'border-l-red-500',
    };

    const ageBadgeColorMap = {
        fresh: 'bg-green-500/10 text-green-700 border-green-500/20',
        recent: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
        aging: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
        old: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
        critical: 'bg-red-500/10 text-red-700 border-red-500/20',
    };

    const assigneeName = ticket.assignedTo?.name || ticket.assignedToName || 'Unassigned';
    const assigneeAvatar = ticket.assignedTo?.avatar || ticket.assignedToAvatar;
    const departmentName = ticket.department?.name || ticket.departmentName || '-';
    const categoryName = ticket.category?.name || ticket.categoryName || '-';

    return (
        <TooltipProvider>
            <div
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className="group relative"
            >
                <Card
                    className={`p-4 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 
                        border-l-4 ${colorMap[ageCategory]} 
                        ${isHovering ? 'scale-[1.02]' : ''}
                        cursor-pointer bg-card`}
                >
                    {/* Header: Ticket ID + Status + Actions */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link
                                href={`/tickets/${ticket._id}`}
                                className="font-bold text-sm text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {ticket.ticketId}
                            </Link>
                            <Badge variant="outline" className={getStatusColor(ticket.status)}>
                                {ticket.status}
                            </Badge>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href={`/tickets/${ticket._id}`}>
                                        <ArrowUpRight className="mr-2 h-4 w-4" />
                                        View details
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onQuickAction?.('assign', ticket)}>
                                    <User className="mr-2 h-4 w-4" />
                                    Assign to...
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onQuickAction?.('priority', ticket)}>
                                    Change priority
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleMarkCompleted} disabled={isUpdating}>
                                    Mark as completed
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onQuickAction?.('copy', ticket.ticketId)}>
                                    Copy Ticket ID
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Subject with tooltip */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                href={`/tickets/${ticket._id}`}
                                className="block text-sm font-medium text-foreground mb-3 line-clamp-2 hover:text-primary transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {ticket.subject}
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm">
                            <p>{ticket.subject}</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* Department & Category */}
                    <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate max-w-[100px]">{departmentName}</span>
                        </div>
                        <span className="text-border">|</span>
                        <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            <span className="truncate max-w-[100px]">{categoryName}</span>
                        </div>
                    </div>

                    {/* Priority Badge */}
                    <div className="mb-3">
                        <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                        </Badge>
                    </div>

                    {/* Footer: Assignee + Created Date */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        {/* Assignee */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={assigneeAvatar} alt={assigneeName} />
                                        <AvatarFallback className={`text-[10px] ${getAvatarColor(assigneeName)} text-white`}>
                                            {getInitials(assigneeName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                                        {assigneeName}
                                    </span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Assigned to: {assigneeName}</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* Created Date + Age */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(ticket.createdAt, 'MMM dd')}
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className={`text-[10px] px-1.5 py-0 h-4 ${ageBadgeColorMap[ageCategory]}`}
                                    >
                                        {ageLabel}
                                    </Badge>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{ageDescription}</p>
                                <p className="text-xs text-muted-foreground">
                                    Created: {formatDate(ticket.createdAt, 'MMM dd, yyyy HH:mm')}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </Card>
            </div>
        </TooltipProvider>
    );
}
