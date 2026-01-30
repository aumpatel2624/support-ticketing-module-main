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
        'Pending': 'bg-purple-100 text-purple-800',
        'Completed': 'bg-green-100 text-green-800',
        'Closed': 'bg-gray-100 text-gray-800',
        'Escalated': 'bg-red-100 text-red-800',
    };

    return (
        <div className="flex flex-col bg-muted/40 rounded-lg p-4 min-w-[320px] h-full">
            {/* Column Header */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm text-foreground">{status}</h3>
                    <Badge variant="secondary" className="text-xs">
                        {tickets.length}
                    </Badge>
                </div>
                <div className="h-1 bg-gradient-to-r from-primary/40 to-transparent rounded" />
            </div>

            {/* Droppable Area */}
            <SortableContext
                items={tickets.map((t) => t._id)}
                strategy={verticalListSortingStrategy}
            >
                <div
                    ref={setNodeRef}
                    className="flex-1 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
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
                        <div className="flex items-center justify-center h-32 rounded border-2 border-dashed border-muted-foreground/25">
                            <p className="text-xs text-muted-foreground">No tickets</p>
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}
