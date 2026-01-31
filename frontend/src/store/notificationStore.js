import { create } from 'zustand';

/**
 * Notification Store
 * Manages user notifications and their state
 */
const useNotificationStore = create((set, get) => ({
    // State
    notifications: [],
    unreadCount: 0,
    isOpen: false,

    // Actions
    setNotifications: (notifications) => {
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        set({ notifications, unreadCount });
    },

    addNotification: (notification) => {
        set((state) => {
            // Prevent duplicates - Backend now sends strict _id
            if (state.notifications.some(n => n._id === notification._id)) {
                return state;
            }

            const updated = [notification, ...state.notifications];
            const unreadCount = updated.filter((n) => !n.isRead).length;
            return { notifications: updated, unreadCount };
        });
    },

    removeNotification: (notificationId) => {
        set((state) => {
            const updated = state.notifications.filter((n) => n._id !== notificationId);
            const unreadCount = updated.filter((n) => !n.isRead).length;
            return { notifications: updated, unreadCount };
        });
    },

    markAsRead: (notificationId) => {
        set((state) => {
            const updated = state.notifications.map((n) =>
                n._id === notificationId ? { ...n, isRead: true } : n
            );
            const unreadCount = updated.filter((n) => !n.isRead).length;
            return { notifications: updated, unreadCount };
        });
    },

    markAllAsRead: () => {
        set((state) => {
            const updated = state.notifications.map((n) => ({
                ...n,
                isRead: true,
            }));
            return { notifications: updated, unreadCount: 0 };
        });
    },

    clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
    },

    setOpen: (isOpen) => {
        set({ isOpen });
    },

    // Async Actions
    fetchNotifications: async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Use the configured API URL from environment
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${apiUrl}/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    set({
                        notifications: data.data,
                        unreadCount: data.data.filter(n => !n.isRead).length
                    });
                }
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    },
}));

export default useNotificationStore;
