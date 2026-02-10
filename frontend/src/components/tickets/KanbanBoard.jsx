'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import ConfirmStatusChangeModal from './ConfirmStatusChangeModal';

import { KANBAN_COLUMN_ORDER as STATUSES } from '@/lib/constants';

/**
 * KanbanBoard - Main Kanban view component with drag-and-drop ticket management
 */
export default function KanbanBoard({ initialTickets = [], onTicketUpdate, readOnly = false }) {
    const { user } = useAuth();
    const [tickets, setTickets] = useState(initialTickets);
    const [isUpdating, setIsUpdating] = useState(null);
    const [activeId, setActiveId] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [pendingTicketUpdate, setPendingTicketUpdate] = useState(null);
    const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
    const [pendingStatusChange, setPendingStatusChange] = useState(null);

    // Pan-to-scroll state
    const scrollContainerRef = useRef(null);
    const panStateRef = useRef({ isPanning: false, startX: 0, scrollLeft: 0 });

    // Check if current user is staff (can drag and modify)
    const isStaff = user && ['Admin', 'TeamMember', 'SuperAdmin'].includes(user.role);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
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
        // Prevent dragging if readOnly mode or user is not staff
        if (readOnly) {
            return;
        }
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

    // Handle drag end (show confirmation modal)
    const handleDragEnd = (event) => {
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
                return;
            }
        }

        // Validate status transition
        if (ticket.status === newStatus) return;

        // If dragging to "Assigned" status, show assign modal first
        if (newStatus === 'Assigned') {
            if (user && ['Admin', 'SuperAdmin'].includes(user.role)) {
                setPendingTicketUpdate({ ticketId, newStatus });
                setShowAssignModal(true);
                return;
            } else if (user && user.role === 'TeamMember') {
                // Show confirmation for TeamMember self-assign
                setPendingStatusChange({ ticketId, ticketSubject: ticket.subject, currentStatus: ticket.status, newStatus });
                setShowStatusConfirmModal(true);
                return;
            } else {
                toast.error('You do not have permission to assign tickets.');
                return;
            }
        }

        // Show confirmation modal for other status changes
        setPendingStatusChange({ ticketId, ticketSubject: ticket.subject, currentStatus: ticket.status, newStatus });
        setShowStatusConfirmModal(true);
    };

    // Handle confirmed status change
    const handleConfirmStatusChange = async () => {
        if (!pendingStatusChange) return;

        const { ticketId, newStatus } = pendingStatusChange;
        const ticket = tickets.find((t) => t._id === ticketId);

        if (!ticket) return;

        // If it's an Assigned status and user is TeamMember, auto-assign to self
        if (newStatus === 'Assigned' && user && user.role === 'TeamMember') {
            await handleAssignUser(user);
            setShowStatusConfirmModal(false);
            setPendingStatusChange(null);
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
            toast.success('Ticket status updated successfully');
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
            setShowStatusConfirmModal(false);
            setPendingStatusChange(null);
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
            await ticketService.assignTicket(
                ticketId,
                selectedUser._id,
                `Assigned to ${selectedUser.name}`,
                newStatus
            );

            // If status wasn't handled by assignTicket (e.g. backend didn't update it for some reason), 
            // the subsequent optimistic update revert logic or UI update will handle it.
            // But usually assignTicket with status param handles both.

            if (ticket.status !== newStatus) {
                // If the assignTicket didn't return the updated status or we want to be doubly sure
                // We can relying on the previous optimistic update. 
                // However, with the new backend logic, assignTicket handles the status update.
                toast.success(`Assigned to ${selectedUser.name}`);
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

    // Handle pan-to-scroll on container mouse down
    const handleContainerMouseDown = useCallback((e) => {
        // Ignore if target is an interactive element (button, link, input, etc.)
        if (
            e.target.tagName === 'BUTTON' ||
            e.target.tagName === 'A' ||
            e.target.tagName === 'INPUT' ||
            e.target.closest('button') ||
            e.target.closest('a') ||
            e.target.closest('[role="button"]')
        ) {
            return;
        }

        const container = scrollContainerRef.current;
        if (!container) return;

        panStateRef.current.isPanning = true;
        panStateRef.current.startX = e.clientX;
        panStateRef.current.scrollLeft = container.scrollLeft;
    }, []);

    // Handle pan-to-scroll mouse move globally
    const handlePanMouseMove = useCallback((e) => {
        if (!panStateRef.current.isPanning) return;

        const container = scrollContainerRef.current;
        if (!container) return;

        const deltaX = e.clientX - panStateRef.current.startX;
        container.scrollLeft = panStateRef.current.scrollLeft - deltaX;
    }, []);

    // Handle pan-to-scroll mouse up globally
    const handlePanMouseUp = useCallback(() => {
        panStateRef.current.isPanning = false;
    }, []);

    // Setup pan-to-scroll event listeners
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        container.addEventListener('mousedown', handleContainerMouseDown);
        document.addEventListener('mousemove', handlePanMouseMove);
        document.addEventListener('mouseup', handlePanMouseUp);

        return () => {
            container.removeEventListener('mousedown', handleContainerMouseDown);
            document.removeEventListener('mousemove', handlePanMouseMove);
            document.removeEventListener('mouseup', handlePanMouseUp);
        };
    }, [handleContainerMouseDown, handlePanMouseMove, handlePanMouseUp]);

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
            <div className="flex flex-col h-full">
                <div
                    ref={scrollContainerRef}
                    className="flex gap-2 overflow-x-auto p-2 flex-1 cursor-grab active:cursor-grabbing select-none h-full"
                    data-scrollable="true"
                >
                    {STATUSES.map((status) => (
                        <KanbanColumn
                            key={status}
                            status={status}
                            tickets={getTicketsByStatus(status)}
                            onMenuAction={handleMenuAction}
                            isStaff={isStaff}
                            readOnly={readOnly}
                        />
                    ))}
                </div>
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

            {/* Status Change Confirmation Modal */}
            <ConfirmStatusChangeModal
                isOpen={showStatusConfirmModal}
                onClose={() => {
                    setShowStatusConfirmModal(false);
                    setPendingStatusChange(null);
                }}
                onConfirm={handleConfirmStatusChange}
                isLoading={isUpdating === pendingStatusChange?.ticketId}
                ticketSubject={pendingStatusChange?.ticketSubject}
                currentStatus={pendingStatusChange?.currentStatus}
                newStatus={pendingStatusChange?.newStatus}
            />

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
