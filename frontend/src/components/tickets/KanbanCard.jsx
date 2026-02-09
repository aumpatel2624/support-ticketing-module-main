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
                p-2 flex flex-col gap-2 w-full
                ${isDragging ? 'opacity-50 ring-2 ring-primary rotate-2 scale-105 shadow-2xl' : ''}
                ${colorMap[ageCategory].replace('border-l-4', 'border-l-[3px]')}
            `}
            onClick={handleCardClick}
        >
            {/* Header: Avatar, Name, Code, Menu */}
            < div className="flex items-center gap-2" >
                {/* Avatar Placeholder - 24px */}
                < div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center shrink-0 text-slate-400 text-[9px] font-bold border border-slate-100" >
                    {ticket.assignedTo ? getInitials(ticket.assignedTo.name) : <GripHorizontal className="w-3 h-3" />}
                </div >

                {/* Name and Code */}
                < div className="flex-1 min-w-0" >
                    <div className="flex items-center justify-between">
                        <h4 className="m-0 text-xs font-bold text-slate-800 leading-none truncate max-w-[120px]">
                            {ticket.assignedTo?.name || 'Unassigned'}
                        </h4>
                        {/* Ticket Code Badge */}
                        <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 px-1 rounded-sm whitespace-nowrap">
                            {ticket.ticketId}
                        </span>
                    </div>
                </div >
            </div >

            {/* Subject */}
            < TooltipProvider >
                <Tooltip>
                    <TooltipTrigger asChild>
                        <p className="text-[11px] font-medium text-slate-700 line-clamp-2 leading-tight">
                            {ticket.subject}
                        </p>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="max-w-xs text-xs">{ticket.subject}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider >

            {/* Footer: Badges & Date */}
            < div className="flex items-center justify-between mt-auto pt-1 border-t border-slate-50" >
                < div className="flex items-center gap-1" >
                    {
                        (ticket.category || ticket.categoryId) && (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-slate-100 text-slate-600 font-medium border-0 truncate max-w-[80px]">
                                {ticket.category?.name || ticket.categoryId?.name}
                            </Badge>
                        )
                    }
                    < Badge variant="outline" className={`${getPriorityColor(ticket.priority)} text-[9px] px-1 py-0 h-4 border-0 font-medium`}>
                        {ticket.priority}
                    </Badge >
                </div >

                <div className="flex items-center gap-1">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={`w-2 h-2 rounded-full ${ageLabel === 'Fresh' ? 'bg-green-500' : ageLabel === 'Recent' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-xs">{ageLabel} ({ageDescription})</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div >
        </div >
    );
}
