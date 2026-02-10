'use client';

import { LayoutGrid } from 'lucide-react';
import TicketCard from './TicketCard';
import EmptyState from '@/components/common/EmptyState';
import ticketService from '@/lib/services/ticketService';
import AssignTicketModal from './AssignTicketModal';
import ChangePriorityModal from './ChangePriorityModal';
import { useState } from 'react';
import toast from 'react-hot-toast';
import useAuth from '@/hooks/useAuth';

/**
 * TicketCardView component - Grid layout for ticket cards
 * Responsive: 1 col mobile, 2 cols tablet, 3 cols desktop, 4 cols large
 */
export default function TicketCardView({ tickets, onTicketUpdate }) {
    const { user } = useAuth();
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [priorityModalOpen, setPriorityModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAssignUser = async (assignee) => {
        try {
            setIsLoading(true);
            await ticketService.assignTicket(selectedTicket._id, { assignedTo: assignee._id });
            toast.success('Ticket assigned successfully');
            onTicketUpdate?.();
            setAssignModalOpen(false);
            setSelectedTicket(null);
        } catch (error) {
            console.error(error);
            toast.error('Failed to assign ticket');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePriorityChange = async (priority) => {
        try {
            setIsLoading(true);
            await ticketService.updateTicket(selectedTicket._id, { priority });
            toast.success('Priority updated successfully');
            onTicketUpdate?.();
            setPriorityModalOpen(false);
            setSelectedTicket(null);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update priority');
        } finally {
            setIsLoading(false);
        }
    };
    const handleQuickAction = async (action, ticket) => {
        switch (action) {
            case 'assign':
                setSelectedTicket(ticket);
                setAssignModalOpen(true);
                break;
            case 'claim':
                try {
                    await ticketService.assignTicket(ticket._id, { assignedTo: user?._id });
                    toast.success('Ticket claimed successfully');
                    onTicketUpdate?.();
                } catch (error) {
                    console.error('Failed to claim ticket', error);
                    toast.error('Failed to claim ticket');
                }
                break;
            case 'priority':
                setSelectedTicket(ticket);
                setPriorityModalOpen(true);
                break;
            case 'copy':
                navigator.clipboard.writeText(ticket.ticketId || ticket._id);
                toast.success('Ticket ID copied to clipboard');
                break;
            default:
                break;
        }
    };

    return (
        <div className="space-y-6">
            {/* Cards Grid */}
            {tickets.length === 0 ? (
                <EmptyState
                    icon={LayoutGrid}
                    title="No tickets found"
                    description="No tickets match your criteria."
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {tickets.map((ticket) => (
                        <TicketCard
                            key={ticket._id}
                            ticket={ticket}
                            onQuickAction={handleQuickAction}
                        />
                    ))}
                </div>
            )}
            {/* Modals */}
            {selectedTicket && (
                <>
                    <AssignTicketModal
                        isOpen={assignModalOpen}
                        onClose={() => {
                            setAssignModalOpen(false);
                            setSelectedTicket(null);
                        }}
                        onAssign={handleAssignUser}
                        isLoading={isLoading}
                        currentAssignee={selectedTicket.assignedTo}
                    />
                    <ChangePriorityModal
                        isOpen={priorityModalOpen}
                        onClose={() => {
                            setPriorityModalOpen(false);
                            setSelectedTicket(null);
                        }}
                        currentPriority={selectedTicket.priority}
                        onPriorityChange={handlePriorityChange}
                        isLoading={isLoading}
                    />
                </>
            )}
        </div>
    );
}
