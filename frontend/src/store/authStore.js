import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/lib/constants';

/**
 * Authentication Store
 * Manages user authentication state, token, and user data
 */
const useAuthStore = create(
    persist(
        (set, get) => ({
            // State
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            // Actions
            setUser: (user) => {
                set({ user, isAuthenticated: !!user });
            },

            setToken: (token, refreshToken) => {
                set({ token, refreshToken });

                // Also store in localStorage for API interceptor
                if (typeof window !== 'undefined') {
                    if (token) {
                        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
                    } else {
                        localStorage.removeItem(STORAGE_KEYS.TOKEN);
                    }

                    if (refreshToken) {
                        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
                    } else {
                        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
                    }
                }
            },

            setLoading: (isLoading) => {
                set({ isLoading });
            },

            setError: (error) => {
                set({ error });
            },

            login: (user, token, refreshToken) => {
                set({
                    user,
                    token,
                    refreshToken,
                    isAuthenticated: true,
                    error: null,
                });

                // Store tokens in localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
                    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
                }
            },

            logout: () => {
                const { disconnectSocket } = require('@/lib/socket');
                disconnectSocket();
                set({
                    user: null,
                    token: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    error: null,
                });

                // Clear localStorage
                if (typeof window !== 'undefined') {
                    localStorage.removeItem(STORAGE_KEYS.TOKEN);
                    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
                    localStorage.removeItem(STORAGE_KEYS.USER);
                }
            },

            updateUser: (updates) => {
                const currentUser = get().user;
                if (currentUser) {
                    set({ user: { ...currentUser, ...updates } });
                }
            },

            // Check if user has specific role
            hasRole: (role) => {
                const user = get().user;
                return user?.role === role;
            },

            // Check if user has any of the specified roles
            hasAnyRole: (roles) => {
                const user = get().user;
                return roles.includes(user?.role);
            },

            isHydrated: false,
            setHydrated: (state) => set({ isHydrated: state }),

            // Check if user has permission
            hasPermission: (permission) => {
                const user = get().user;
                return user?.permissions?.includes(permission) || false;
            },
        }),
        {
            name: STORAGE_KEYS.USER,
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated(true);
            },
        }
    )
);

export default useAuthStore;
