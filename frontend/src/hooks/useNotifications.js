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

            // Handle notification read status update
            const cleanupNotificationRead = onSocketEvent(
                'notification_read',
                (notificationId) => {
                    markAsRead(notificationId);
                }
            );

            return () => {
                cleanupNotification?.();
                cleanupNotificationRead?.();
            };
        } catch (error) {
            console.error('Failed to initialize notifications:', error);
        }
    }, [user, addNotification, markAsRead]);

    return useNotificationStore();
}
