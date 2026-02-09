'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import KanbanCard from './KanbanCard';

/**
 * KanbanCardSortable - Wrapper for KanbanCard with drag-and-drop support
 */
export default function KanbanCardSortable({ ticket, onMenuAction, isStaff, readOnly = false }) {
    // Disable dragging if readOnly mode OR if user is not staff
    const isDragDisabled = readOnly || !isStaff;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: ticket._id,
        data: {
            type: 'Ticket',
            ticket,
        },
        disabled: isDragDisabled,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...(!isDragDisabled && listeners)} // Only apply listeners if dragging is enabled
            className="touch-none"
        >
            <KanbanCard
                ticket={ticket}
                isDragging={isDragging}
                onMenuAction={onMenuAction}
            />
        </div>
    );
}
