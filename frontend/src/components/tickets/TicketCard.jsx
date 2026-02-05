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
import useAuth from '@/hooks/useAuth';

/**
 * TicketCard component - Individual ticket card for card view
 */
export default function TicketCard({ ticket, onQuickAction }) {
    const { user } = useAuth();
    const [isHovering, setIsHovering] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const ageCategory = getAgeCategory(ticket.createdAt, ticket.priority);
    const ageLabel = getAgeLabel(ticket.createdAt, ticket.priority);
    const ageDescription = getAgeDescription(ticket.createdAt, ticket.priority);

    const handleMarkResolved = async (e) => {
        e.stopPropagation();
        try {
            setIsUpdating(true);
            await ticketService.updateTicket(ticket._id, {
                status: 'Resolved'
            });
            toast.success('Ticket marked as resolved');
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
    const departmentName = ticket.department?.name || ticket.departmentId?.name || ticket.departmentName || '-';
    const categoryName = ticket.category?.name || ticket.categoryId?.name || ticket.categoryName || '-';

    return (
        <TooltipProvider>
            <div
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className="group relative"
            >
                <Card
                    className={`p-5 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 
                        border-l-[5px] ${colorMap[ageCategory]} ${ageCategory === 'critical' ? 'bg-red-50/30' : 'bg-card'}
                        ${isHovering ? '-translate-y-1' : ''}
                        cursor-pointer border-t border-b border-r rounded-xl overflow-hidden`}
                >
                    {/* Header: Ticket ID + Status + Actions */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link
                                href={`/tickets?id=${ticket._id}`}
                                className="font-bold text-sm text-indigo-600 hover:text-indigo-700 hover:underline tracking-wide"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {ticket.ticketId}
                            </Link>
                            <Badge variant="outline" className={`${getStatusColor(ticket.status)} border-transparent bg-opacity-10 px-2 py-0.5 font-medium`}>
                                {ticket.status}
                            </Badge>
                            {ticket.wasReopened && ticket.status !== 'Resolved' && (
                                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 gap-1 px-2">
                                    <span className="flex h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                                    Reopened
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-100 p-1">
                                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-indigo-50 focus:text-indigo-600">
                                        <Link href={`/tickets?id=${ticket._id}`}>
                                            <ArrowUpRight className="mr-2 h-4 w-4" />
                                            View details
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onQuickAction?.('copy', ticket.ticketId)} className="rounded-lg cursor-pointer focus:bg-indigo-50 focus:text-indigo-600">
                                        <Tag className="mr-2 h-4 w-4" />
                                        Copy Ticket ID
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Subject with tooltip */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                href={`/tickets?id=${ticket._id}`}
                                className="block text-base font-semibold text-slate-800 mb-4 line-clamp-2 hover:text-indigo-600 transition-colors leading-snug"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {ticket.subject}
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm text-xs bg-slate-900 text-white border-0 shadow-xl">
                            <p>{ticket.subject}</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* Department & Category */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4 text-xs font-medium text-slate-500">
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100/50">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            <span className="truncate max-w-[100px]">{departmentName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100/50">
                            <Tag className="h-3 w-3 text-slate-400" />
                            <span className="truncate max-w-[100px]">{categoryName}</span>
                        </div>
                    </div>

                    {/* Footer: Assignee + Created Date */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        {/* Assignee */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 group/assignee">
                                    <Avatar className="h-6 w-6 ring-2 ring-white shadow-sm group-hover/assignee:ring-indigo-100 transition-all">
                                        <AvatarImage src={assigneeAvatar} alt={assigneeName} />
                                        <AvatarFallback className={`text-[10px] ${getAvatarColor(assigneeName)} text-white`}>
                                            {getInitials(assigneeName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-medium text-slate-600 truncate max-w-[100px] group-hover/assignee:text-indigo-600 transition-colors">
                                        {assigneeName}
                                    </span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs bg-slate-900 text-white border-0 shadow-xl">
                                <p>Assigned to: {assigneeName}</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* Created Date + Age */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={`text-[10px] px-2 py-0.5 h-5 font-semibold border-0 ${ageBadgeColorMap[ageCategory]}`}
                                    >
                                        {ageLabel}
                                    </Badge>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs bg-slate-900 text-white border-0 shadow-xl">
                                <p className="font-semibold mb-1">{ageDescription}</p>
                                <p className="text-slate-300">
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
