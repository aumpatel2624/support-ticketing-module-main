import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS, VIEW_MODES } from '@/lib/constants';

/**
 * UI Store
 * Manages UI state like sidebar, theme, notifications, and view modes
 */
const useUIStore = create(
    persist(
        (set, get) => ({
            // State
            sidebarCollapsed: false,
            theme: 'light', // Only light theme as per spec
            notifications: [],
            unreadCount: 0,
            viewMode: VIEW_MODES.TABLE,
            isMobile: false,

            // Actions
            toggleSidebar: () => {
                set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
            },

            setSidebarCollapsed: (collapsed) => {
                set({ sidebarCollapsed: collapsed });
            },

            setTheme: (theme) => {
                set({ theme });
            },

            addNotification: (notification) => {
                const newNotification = {
                    id: Date.now(),
                    timestamp: new Date().toISOString(),
                    read: false,
                    ...notification,
                };

                set((state) => ({
                    notifications: [newNotification, ...state.notifications],
                    unreadCount: state.unreadCount + 1,
                }));
            },

            markNotificationAsRead: (id) => {
                set((state) => ({
                    notifications: state.notifications.map((notif) =>
                        notif.id === id ? { ...notif, read: true } : notif
                    ),
                    unreadCount: Math.max(0, state.unreadCount - 1),
                }));
            },

            markAllNotificationsAsRead: () => {
                set((state) => ({
                    notifications: state.notifications.map((notif) => ({
                        ...notif,
                        read: true,
                    })),
                    unreadCount: 0,
                }));
            },

            removeNotification: (id) => {
                set((state) => {
                    const notification = state.notifications.find((n) => n.id === id);
                    const wasUnread = notification && !notification.read;

                    return {
                        notifications: state.notifications.filter((n) => n.id !== id),
                        unreadCount: wasUnread
                            ? Math.max(0, state.unreadCount - 1)
                            : state.unreadCount,
                    };
                });
            },

            clearNotifications: () => {
                set({ notifications: [], unreadCount: 0 });
            },

            setNotifications: (notifications) => {
                const unreadCount = notifications.filter((n) => !n.read).length;
                set({ notifications, unreadCount });
            },

            setViewMode: (mode) => {
                set({ viewMode: mode });
            },

            setIsMobile: (isMobile) => {
                set({ isMobile });
            },
        }),
        {
            name: STORAGE_KEYS.SIDEBAR_COLLAPSED,
            partialPersist: (state) => ({
                sidebarCollapsed: state.sidebarCollapsed,
                theme: state.theme,
                viewMode: state.viewMode,
            }),
        }
    )
);

export default useUIStore;
