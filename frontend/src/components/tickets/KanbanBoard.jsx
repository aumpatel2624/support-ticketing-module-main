'use client';

import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import toast from 'react-hot-toast';
import useAuth from '@/hooks/useAuth';
import ticketService from '@/lib/services/ticketService';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import AssignTicketModal from './AssignTicketModal';

const STATUSES = ['New', 'Assigned', 'InProgress', 'Pending', 'Completed', 'Closed', 'Escalated'];

/**
 * KanbanBoard - Main Kanban view component with drag-and-drop ticket management
 */
export default function KanbanBoard({ initialTickets = [], onTicketUpdate }) {
    const { user } = useAuth();
    const [tickets, setTickets] = useState(initialTickets);
    const [isUpdating, setIsUpdating] = useState(null);
    const [activeId, setActiveId] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [pendingTicketUpdate, setPendingTicketUpdate] = useState(null);

    // Check if current user is staff (can drag and modify)
    const isStaff = user && ['Admin', 'TeamMember', 'SuperAdmin'].includes(user.role);

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

    // Handle drag start
    const handleDragStart = (event) => {
        // Prevent dragging if user is not staff
        if (!isStaff) {
            toast.error('You do not have permission to move tickets');
            return;
        }
        setActiveId(event.active.id);
    };

    // Handle drag over (for visual feedback across columns)
    const handleDragOver = (event) => {
        // Optional: Add visual feedback when dragging over columns
    };

    // Handle drag end (status update)
    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const ticketId = active.id;
        const ticket = tickets.find((t) => t._id === ticketId);

        if (!ticket) return;

        const newStatus = over.id;

        // Validate status transition if needed
        if (ticket.status === newStatus) return;

        // If dragging to "Assigned" and ticket is not already assigned, show assignment modal
        if (newStatus === 'Assigned' && !ticket.assignedTo) {
            setPendingTicketUpdate({ ticketId, newStatus });
            setShowAssignModal(true);
            return;
        }

        // Optimistic update
        setTickets((prevTickets) =>
            prevTickets.map((t) =>
                t._id === ticketId ? { ...t, status: newStatus } : t
            )
        );

        // Call API to update status
        setIsUpdating(ticketId);
        try {
            await ticketService.updateTicketStatus(ticketId, newStatus);
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

    const handleAssignUser = async (selectedUser) => {
        if (!pendingTicketUpdate) return;

        const { ticketId, newStatus } = pendingTicketUpdate;
        const ticket = tickets.find((t) => t._id === ticketId);

        if (!ticket) return;

        // Optimistic update
        setTickets((prevTickets) =>
            prevTickets.map((t) =>
                t._id === ticketId ? { ...t, status: newStatus, assignedTo: selectedUser } : t
            )
        );

        // Call API to update both status and assignedTo
        setIsUpdating(ticketId);
        try {
            // First assign the ticket
            await ticketService.assignTicket(ticketId, selectedUser._id, `Assigned to ${selectedUser.name}`);
            // Then update the status
            await ticketService.updateTicketStatus(ticketId, newStatus);
            toast.success(`Assigned to ${selectedUser.name} and status updated`);
        } catch (error) {
            console.error('Failed to update ticket:', error);
            toast.error('Failed to assign ticket');

            // Revert optimistic update
            setTickets((prevTickets) =>
                prevTickets.map((t) =>
                    t._id === ticketId ? { ...t, status: ticket.status, assignedTo: ticket.assignedTo } : t
                )
            );
        } finally {
            setIsUpdating(null);
            setShowAssignModal(false);
            setPendingTicketUpdate(null);
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

    // Get active ticket for drag overlay
    const activeTicket = activeId ? tickets.find((t) => t._id === activeId) : null;

    // Drop animation configuration
    const dropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
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
                        isStaff={isStaff}
                    />
                ))}
            </div>
            <DragOverlay dropAnimation={dropAnimation}>
                {activeTicket ? (
                    <KanbanCard
                        ticket={activeTicket}
                        isDragging={true}
                        onMenuAction={handleMenuAction}
                    />
                ) : null}
            </DragOverlay>

            {/* Assignment Modal */}
            <AssignTicketModal
                isOpen={showAssignModal}
                onClose={() => {
                    setShowAssignModal(false);
                    setPendingTicketUpdate(null);
                }}
                onAssign={handleAssignUser}
                isLoading={isUpdating === pendingTicketUpdate?.ticketId}
            />
        </DndContext>
    );
}
