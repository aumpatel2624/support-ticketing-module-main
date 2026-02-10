'use client';

import { useEffect, useRef } from 'react';
import { onSocketEvent, offSocketEvent } from '@/lib/socket';
import toast from 'react-hot-toast';
import { Bell } from 'lucide-react';
import useNotificationStore from '@/store/notificationStore';

const NotificationListener = () => {
    const { addNotification, fetchNotifications } = useNotificationStore();
    const toastedNotifications = useRef(new Set()); // Track notified IDs to prevent duplicates

    // Fetch existing notifications on mount
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        const handleNotification = (data) => {
            console.log('Notification received:', data);

            // Prevent duplicate toasts within the same session
            const notificationId = data._id;
            if (notificationId && toastedNotifications.current.has(notificationId)) {
                console.log('Duplicate notification skipped:', notificationId);
                return;
            }

            // Mark as toasted
            if (notificationId) {
                toastedNotifications.current.add(notificationId);
            }

            // Add to store with robust unique ID if missing
            const notificationWithId = {
                ...data,
                _id: data._id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                isRead: data.isRead || false,
                createdAt: data.createdAt || new Date()
            };
            addNotification(notificationWithId);

            // Format: { type, message, ... }
            toast((t) => (
                <div
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => toast.dismiss(t.id)}
                >
                    <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0">
                        <Bell size={18} />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-sm text-foreground">
                            {data.type?.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {data.message}
                        </p>
                    </div>
                </div>
            ), {
                duration: 5000,
                position: 'top-right',
                style: {
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                },
            });
        };



        // Listen for events - now returns cleanup functions
        const cleanupNotification = onSocketEvent('notification', handleNotification);

        // We no longer listen to 'ticket_created' for notifications here
        // becase the backend now sends individual 'notification' events for all relevant users.
        // This prevents duplicate notifications (one persistent, one temporary) 
        // and ensures all notifications have real database IDs for "Mark as Read".

        // Cleanup
        return () => {
            cleanupNotification?.();
        };
    }, [addNotification]);

    return null; // This component doesn't render anything visible directly
};

export default NotificationListener;
