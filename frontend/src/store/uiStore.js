import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS, VIEW_MODES } from '@/lib/constants';

/**
 * UI Store
 * Manages UI state like sidebar, theme, and view modes
 * Note: Notifications are managed by notificationStore
 */
const useUIStore = create(
    persist(
        (set, get) => ({
            // State
            sidebarCollapsed: false,
            theme: 'light', // Only light theme as per spec
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

            setViewMode: (mode) => {
                set({ viewMode: mode });
            },

            setIsMobile: (isMobile) => {
                set({ isMobile });
            },
        }),
        {
            name: STORAGE_KEYS.SIDEBAR_COLLAPSED,
            partialize: (state) => ({
                sidebarCollapsed: state.sidebarCollapsed,
                theme: state.theme,
                viewMode: state.viewMode,
            }),
        }
    )
);

export default useUIStore;

