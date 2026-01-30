'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GripHorizontal, MoreHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getStatusColor, getPriorityColor, truncate } from '@/lib/utils';
import { getAgeCategory, getAgeLabel, getAgeDescription } from '@/lib/ticketAgeHelper';

/**
 * KanbanCard component - Individual ticket card in Kanban board
 */
export default function KanbanCard({ ticket, isDragging, onMenuAction }) {
    const [isHovering, setIsHovering] = useState(false);
    const ageCategory = getAgeCategory(ticket.createdAt);
    const ageLabel = getAgeLabel(ticket.createdAt);
    const ageDescription = getAgeDescription(ticket.createdAt);

    const colorMap = {
        fresh: 'border-l-4 border-l-green-500',
        recent: 'border-l-4 border-l-blue-500',
        aging: 'border-l-4 border-l-yellow-500',
        old: 'border-l-4 border-l-orange-500',
        critical: 'border-l-4 border-l-red-500',
    };

    return (
        <div
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className="group cursor-grab active:cursor-grabbing"
        >
            <Card
                className={`p-4 transition-all ${
                    isDragging ? 'opacity-50 ring-2 ring-primary' : ''
                } hover:shadow-md border-0 ${colorMap[ageCategory]}`}
            >
                {/* Header with grip and actions */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-2 flex-1">
                        {isHovering && (
                            <GripHorizontal className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        )}
                        <Link
                            href={`/tickets/${ticket._id}`}
                            className="font-bold text-sm text-primary hover:underline truncate flex-1"
                            title={ticket.ticketId}
                        >
                            {ticket.ticketId}
                        </Link>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={`/tickets/${ticket._id}`}>View details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onMenuAction?.('copy', ticket.ticketId)}>
                                Copy Ticket ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onMenuAction?.('reassign', ticket)}>
                                Reassign
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onMenuAction?.('resolve', ticket)}>
                                Mark as Resolved
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Subject - truncated with tooltip */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <p className="text-sm font-medium text-foreground mb-3 line-clamp-2 hover:underline">
                                {ticket.subject}
                            </p>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="max-w-xs">{ticket.subject}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Category and Department */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {ticket.category && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            {ticket.category.name}
                        </Badge>
                    )}
                    {ticket.department && (
                        <span className="text-xs text-muted-foreground">
                            {ticket.department.name}
                        </span>
                    )}
                </div>

                {/* Priority Badge */}
                <div className="mb-3">
                    <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                    </Badge>
                </div>

                {/* Footer with age and assignee */}
                <div className="flex items-center justify-between pt-3 border-t">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge
                                    variant="outline"
                                    className="text-xs cursor-help bg-background"
                                >
                                    {ageLabel}
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-xs">{ageDescription}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {ticket.assignedTo && (
                        <span className="text-xs text-muted-foreground">
                            {ticket.assignedTo.name}
                        </span>
                    )}
                </div>
            </Card>
        </div>
    );
}
