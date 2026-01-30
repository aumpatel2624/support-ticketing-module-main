'use client';

import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import toast from 'react-hot-toast';
import ticketService from '@/lib/services/ticketService';
import KanbanColumn from './KanbanColumn';

const STATUSES = ['New', 'Assigned', 'InProgress', 'Pending', 'Completed', 'Closed', 'Escalated'];

/**
 * KanbanBoard - Main Kanban view component with drag-and-drop ticket management
 */
export default function KanbanBoard({ initialTickets = [], onTicketUpdate }) {
    const [tickets, setTickets] = useState(initialTickets);
    const [isUpdating, setIsUpdating] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            distance: 8,
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Sync local state with prop when initialTickets changes (on view switch or manual refresh)
    useEffect(() => {
        setTickets(initialTickets);
    }, [initialTickets]);

    // Organize tickets by status
    const getTicketsByStatus = (status) => {
        return tickets.filter((ticket) => ticket.status === status);
    };

    // Handle drag over (for visual feedback across columns)
    const handleDragOver = (event) => {
        // Optional: Add visual feedback when dragging over columns
    };

    // Handle drag end (status update)
    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (!over) return;

        const ticketId = active.id;
        const ticket = tickets.find((t) => t._id === ticketId);

        if (!ticket) return;

        const newStatus = over.id;

        // Validate status transition if needed
        if (ticket.status === newStatus) return;

        // Optimistic update
        setTickets((prevTickets) =>
            prevTickets.map((t) =>
                t._id === ticketId ? { ...t, status: newStatus } : t
            )
        );

        // Call API to update status
        setIsUpdating(ticketId);
        try {
            await ticketService.updateTicket(ticketId, {
                status: newStatus,
            });
            toast.success('Ticket status updated');
        } catch (error) {
            console.error('Failed to update ticket status:', error);
            toast.error('Failed to update ticket status');

            // Revert optimistic update
            setTickets((prevTickets) =>
                prevTickets.map((t) =>
                    t._id === ticketId ? { ...t, status: ticket.status } : t
                )
            );
        } finally {
            setIsUpdating(null);
        }
    };

    // Handle menu actions (copy, reassign, resolve)
    const handleMenuAction = (action, data) => {
        switch (action) {
            case 'copy':
                navigator.clipboard.writeText(data);
                toast.success('Ticket ID copied');
                break;
            case 'reassign':
                // TODO: Open reassign dialog
                break;
            case 'resolve':
                // TODO: Update status to Completed
                break;
            default:
                break;
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
                {STATUSES.map((status) => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        tickets={getTicketsByStatus(status)}
                        onMenuAction={handleMenuAction}
                    />
                ))}
            </div>
        </DndContext>
    );
}
