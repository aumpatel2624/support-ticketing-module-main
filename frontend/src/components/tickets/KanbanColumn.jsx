'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Badge } from '@/components/ui/badge';
import KanbanCardSortable from './KanbanCardSortable';

/**
 * KanbanColumn - A column in the Kanban board representing a status
 */
export default function KanbanColumn({ status, tickets, onMenuAction, isStaff }) {
    const { setNodeRef } = useDroppable({
        id: status,
    });

    const statusColors = {
        'New': 'bg-slate-100 text-slate-800',
        'Assigned': 'bg-blue-100 text-blue-800',
        'InProgress': 'bg-yellow-100 text-yellow-800',
        'Completed': 'bg-green-100 text-green-800',
        'Reopened': 'bg-orange-100 text-orange-800',
        'Closed': 'bg-gray-100 text-gray-800',
        'Escalated': 'bg-red-100 text-red-800',
    };

    return (
        <div className="flex flex-col bg-white rounded-lg border border-border w-[286px] min-w-[286px] shrink-0 h-full max-h-full shadow-sm">
            {/* Column Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50 min-h-[64px]">
                <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-sm text-foreground">{status}</h3>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-2 rounded-full font-mono text-xs">
                        {tickets.length}
                    </Badge>
                </div>

                {/* Filter / Action Button */}
                <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors p-1 rounded-md hover:bg-muted">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                </button>
            </div>

            {/* Droppable Area */}
            <SortableContext
                items={tickets.map((t) => t._id)}
                strategy={verticalListSortingStrategy}
            >
                <div
                    ref={setNodeRef}
                    className="flex-1 min-h-0 p-3 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                >
                    {tickets.length > 0 ? (
                        tickets.map((ticket) => (
                            <KanbanCardSortable
                                key={ticket._id}
                                ticket={ticket}
                                onMenuAction={onMenuAction}
                                isStaff={isStaff}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </div>
                            <p className="text-sm text-muted-foreground font-medium">No tickets</p>
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}
