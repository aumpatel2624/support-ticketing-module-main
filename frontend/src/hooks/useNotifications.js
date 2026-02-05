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
                cleanupNotification?.();
                cleanupNotificationRead?.();
                cleanupNotificationAllRead?.();
            };
        } catch (error) {
            console.error('Failed to initialize notifications:', error);
        }
    }, [user, addNotification, markAsRead]);

    return useNotificationStore();
}
