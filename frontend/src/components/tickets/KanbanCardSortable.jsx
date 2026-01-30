'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import KanbanCard from './KanbanCard';

/**
 * KanbanCardSortable - Wrapper for KanbanCard with drag-and-drop support
 */
export default function KanbanCardSortable({ ticket, onMenuAction, isStaff }) {
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
        disabled: !isStaff, // Disable dragging for non-staff users
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
            {...(isStaff && listeners)} // Only apply listeners if user is staff
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
