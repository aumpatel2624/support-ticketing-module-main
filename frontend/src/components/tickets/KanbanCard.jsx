'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Paperclip, MessageSquare, AlertCircle, Clock, Calendar, GripHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDateTime, formatDate } from '@/lib/utils';
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
    const router = useRouter();
    const [isHovering, setIsHovering] = useState(false);
    const ageCategory = getAgeCategory(ticket.createdAt, ticket.priority);
    const ageLabel = getAgeLabel(ticket.createdAt, ticket.priority);
    const ageDescription = getAgeDescription(ticket.createdAt, ticket.priority);

    const colorMap = {
        fresh: 'border-l-4 border-l-green-500',
        recent: 'border-l-4 border-l-blue-500',
        aging: 'border-l-4 border-l-yellow-500',
        old: 'border-l-4 border-l-orange-500',
        critical: 'border-l-4 border-l-red-500',
    };

    const handleCardClick = () => {
        router.push(`/tickets?id=${ticket._id}`);
    };

    const getInitials = (name) => {
        return name
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '??';
    };

    return (
        <div
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className={`
                group cursor-pointer relative bg-white rounded-lg border border-slate-200 
                shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300 ease-in-out
                p-3 flex flex-col gap-3 max-h-[200px] min-h-[150px] w-full
                ${isDragging ? 'opacity-50 ring-2 ring-primary rotate-2 scale-105 shadow-2xl' : ''}
                ${colorMap[ageCategory].replace('border-l-4', 'border-l-[3px]')}
            `}
            onClick={handleCardClick}
        >
            {/* Header: Avatar, Name, Code, Menu */}
            < div className="flex items-start gap-3" >
                {/* Avatar Placeholder - 36px */}
                < div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center shrink-0 text-slate-400 text-xs font-bold border border-slate-100" >
                    {ticket.assignedTo ? getInitials(ticket.assignedTo.name) : <GripHorizontal className="w-4 h-4" />}
                </div >

                {/* Name and Code */}
                < div className="flex-1 min-w-0" >
                    <h4 className="m-0 text-[13px] font-bold text-slate-800 leading-tight truncate">
                        {ticket.assignedTo?.name || 'Unassigned'}
                    </h4>
                    <div className="mt-1 flex items-center gap-2">
                        {/* Ticket Code Badge - 20px height */}
                        <span className="h-[20px] flex items-center text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 rounded-sm whitespace-nowrap">
                            {ticket.ticketId}
                        </span>
                        {ticket.wasReopened && ticket.status !== 'Resolved' && (
                            <Badge variant="outline" className="h-[20px] flex items-center px-1 bg-orange-50 text-orange-600 border-orange-200 text-[9px] shrink-0">
                                Reopened
                            </Badge>
                        )}
                    </div>
                </div >


            </div >

            {/* Subject */}
            < TooltipProvider >
                <Tooltip>
                    <TooltipTrigger asChild>
                        <p className="text-[13px] font-medium text-slate-700 line-clamp-2 leading-relaxed">
                            {ticket.subject}
                        </p>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="max-w-xs text-xs">{ticket.subject}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider >

            {/* Badges */}
            < div className="flex items-center gap-1.5 flex-wrap mt-auto" >
                {
                    (ticket.category || ticket.categoryId) && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium border-0">
                            {ticket.category?.name || ticket.categoryId?.name}
                        </Badge>
                    )
                }
                < Badge variant="outline" className={`${getPriorityColor(ticket.priority)} text-[10px] px-1.5 py-0 border-0 font-medium`}>
                    {ticket.priority}
                </Badge >
            </div >

            {/* Footer: Date & Age */}
            < div className="pt-2 border-t border-slate-100 flex items-center justify-between" >
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(ticket.createdAt)} <span className="text-slate-300">|</span> {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-5 cursor-help border-slate-200 text-slate-500 font-medium"
                            >
                                {ageLabel}
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">{ageDescription}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div >
        </div >
    );
}
