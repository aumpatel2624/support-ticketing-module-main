'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import KanbanCard from './KanbanCard';

/**
 * KanbanCardSortable - Wrapper for KanbanCard with drag-and-drop support
 */
export default function KanbanCardSortable({ ticket, onMenuAction }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: ticket._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
        >
            <KanbanCard
                ticket={ticket}
                isDragging={isDragging}
                onMenuAction={onMenuAction}
            />
        </div>
    );
}
