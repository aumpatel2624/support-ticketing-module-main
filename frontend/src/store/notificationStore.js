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

    // Utility Actions
    getRecentNotifications: (limit = 10) => {
        return get().notifications.slice(0, limit);
    },

    getUnreadNotifications: () => {
        return get().notifications.filter((n) => !n.isRead);
    },
}));

export default useNotificationStore;
