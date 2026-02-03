'use client';

import { useEffect } from 'react';
import { onSocketEvent } from '@/lib/socket';

/**
 * useTicketUpdates Hook
 * Listens for real-time ticket updates via Socket.io
 * Calls the callback whenever a ticket is updated
 * Socket.io should be initialized globally in RouteGuard
 */
export default function useTicketUpdates(onUpdate) {
    useEffect(() => {
        if (!onUpdate) return;

        // Listen for ticket updates
        const unsubscribe = onSocketEvent('ticketUpdated', (data) => {
            onUpdate(data);
        });

        // Cleanup
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [onUpdate]);
}
