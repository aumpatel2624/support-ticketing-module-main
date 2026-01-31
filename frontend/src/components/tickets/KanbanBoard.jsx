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

const STATUSES = ['New', 'Assigned', 'InProgress', 'Pending', 'Completed', 'Reopened', 'Closed', 'Escalated'];

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

        let newStatus = over.id;

        // If dropped over another ticket, get that ticket's status
        if (!STATUSES.includes(newStatus)) {
            const overTicket = tickets.find((t) => t._id === newStatus);
            if (overTicket) {
                newStatus = overTicket.status;
            } else {
                // If distinct from status and not a ticket, cancel
                return;
            }
        }

        // Validate status transition if needed
        if (ticket.status === newStatus) return;

        // If dragging to "Assigned" status
        if (newStatus === 'Assigned') {
            // Case 1: Admin/SuperAdmin -> Show modal to choose assignee
            if (user && ['Admin', 'SuperAdmin'].includes(user.role)) {
                setPendingTicketUpdate({ ticketId, newStatus });
                setShowAssignModal(true);
                return;
            }
            // Case 2: TeamMember -> Auto-assign to self
            else if (user && user.role === 'TeamMember') {
                // Auto-assign to self
                handleAssignUser(user);
                return;
            } else {
                // Non-staff cannot assign
                toast.error('You do not have permission to assign tickets.');
                return;
            }
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
        // Resolve ticket details either from pending state or active drag state
        let ticketId, newStatus;

        if (pendingTicketUpdate) {
            ticketId = pendingTicketUpdate.ticketId;
            newStatus = pendingTicketUpdate.newStatus;
        } else if (activeId) {
            // If direct assignment (TeamMember self-assign), use active drag ID
            ticketId = activeId;
            newStatus = 'Assigned';
        } else {
            return;
        }

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
            // Only update status if it's different from current status (avoid "Assigned" -> "Assigned" error on reassignment)
            if (ticket.status !== newStatus) {
                await ticketService.updateTicketStatus(ticketId, newStatus);
                toast.success(`Assigned to ${selectedUser.name} and status updated`);
            } else {
                toast.success(`Assigned to ${selectedUser.name}`);
            }
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
