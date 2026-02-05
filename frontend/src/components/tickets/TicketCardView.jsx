'use client';

import { LayoutGrid } from 'lucide-react';
import TicketCard from './TicketCard';
import EmptyState from '@/components/common/EmptyState';
import ticketService from '@/lib/services/ticketService';
import toast from 'react-hot-toast';
import useAuth from '@/hooks/useAuth';

/**
 * TicketCardView component - Grid layout for ticket cards
 * Responsive: 1 col mobile, 2 cols tablet, 3 cols desktop, 4 cols large
 */
export default function TicketCardView({ tickets, onTicketUpdate }) {
    const handleQuickAction = async (action, ticket) => {
        switch (action) {
            case 'assign':
                // TODO: Open assign dialog
                break;
            case 'claim':
                try {
                    await ticketService.assignTicket(ticket._id, { assignedTo: useAuth.getState().user?._id });
                    toast.success('Ticket claimed successfully');
                    onTicketUpdate?.();
                } catch (error) {
                    console.error('Failed to claim ticket', error);
                    toast.error('Failed to claim ticket');
                }
                break;
            case 'priority':
                // TODO: Open priority change dialog
                break;
            case 'copy':
                navigator.clipboard.writeText(ticket);
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
        </div>
    );
}
