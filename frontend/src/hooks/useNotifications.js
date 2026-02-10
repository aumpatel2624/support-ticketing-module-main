import { useEffect } from 'react';
import useNotificationStore from '@/store/notificationStore';
import useAuthStore from '@/store/authStore';
import { initSocket, onSocketEvent } from '@/lib/socket';

/**
 * useNotifications hook - Set up Socket.io listeners for real-time notifications
 */
export function useNotifications() {
    const { setNotifications, addNotification, markAsRead } = useNotificationStore();
    const { user } = useAuthStore();

    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const socket = initSocket(token);

            // Join user's notification room
            socket.emit('join', user._id);

            // Handle new notification
            const cleanupNotification = onSocketEvent('notification', (notification) => {
                addNotification(notification);
            });

            // Handle single notification read (sync across tabs)
            const cleanupNotificationRead = onSocketEvent('notification_read', (notificationId) => {
                // We can reuse the optimistic update logic from the store, 
                // but calling markAsRead might re-emit the socket event if not careful.
                // However, our markAsRead in store emits. 
                // We should ideally have a method in store just for updating state without emitting.
                // For now, let's manually update the state in the store if we can, or just call setNotifications?
                // Actually, the cleanest way is to access the store's state and update it.
                // But since markAsRead does optimistic update + emit, we shouldn't call it here to avoid loops.
                // Let's create a local update in the listener or assume `markAsRead` handles checks?
                // The store `markAsRead` *only* emits. It doesn't check if it came from socket.

                // Let's implement a direct state update here using setState from the store if possible, 
                // or simpler: just fetch notifications again? No, that's wasteful.

                // Better approach: The store's `markAsRead` updates state AND emits. 
                // We need a `markAsReadLocal` similar to `markAllAsReadLocal`.
                // Let's modify the store to expose `markAsReadLocal` or just do it here implicitly.

                // Actually, I can just update the store's state directly via `useNotificationStore.setState`.
                useNotificationStore.setState((state) => {
                    const updated = state.notifications.map((n) =>
                        n._id === notificationId ? { ...n, isRead: true } : n
                    );
                    const unreadCount = updated.filter((n) => !n.isRead).length;
                    return { notifications: updated, unreadCount };
                });
            });

            // Handle all notifications read
            const cleanupNotificationAllRead = onSocketEvent(
                'notification_all_read',
                () => {
                    if (useNotificationStore.getState().unreadCount > 0) {
                        useNotificationStore.getState().markAllAsReadLocal();
                    }
                }
            );

            return () => {
                if (cleanupNotification) cleanupNotification();
                if (cleanupNotificationRead) cleanupNotificationRead();
                if (cleanupNotificationAllRead) cleanupNotificationAllRead();
            };
        } catch (error) {
            console.error('Failed to initialize notifications:', error);
        }
    }, [user, addNotification, markAsRead]);

    return useNotificationStore();
}
