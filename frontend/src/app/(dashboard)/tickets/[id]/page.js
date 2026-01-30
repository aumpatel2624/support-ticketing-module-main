'use client';

import { useState, useEffect, use } from 'react';
import { Loader2 } from 'lucide-react';
import TicketDetailView from '@/components/tickets/TicketDetailView';
import ticketService from '@/lib/services/ticketService';
import toast from 'react-hot-toast';

export default function TicketPage({ params }) {
    // unwrap params using use() hook or await. 
    // Since this is client component, we receive params as promise in Next 15, but usually we just unwrap it.
    // Actually, standard Pattern for Client Components in Next 15 receiving params is `use(params)` or it's passed as prop.
    // Let's use `use(params)` if we can, or just standard unwrapping if standard props.
    // For safety in Client Component, I'll unwrap it in effect or assume async prop usage which is messy.
    // Safest: Use `use(params)` if React 19/Next 15.
    // Or just accept it might be ready.

    // Let's try unwrapping via React.use()
    const { id } = use(params);

    const [ticket, setTicket] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                setIsLoading(true);
                const output = await ticketService.getTicket(id);

                let ticketData = output;
                if (output.data) ticketData = output.data;
                if (output.ticket) ticketData = output.ticket;

                setTicket(ticketData);
            } catch (error) {
                console.error('Failed to fetch ticket:', error);
                toast.error('Failed to load ticket details');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchTicket();
        }
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!ticket) {
        return <div className="p-8 text-center text-muted-foreground">Ticket not found</div>;
    }

    return <TicketDetailView ticket={ticket} />;
}
