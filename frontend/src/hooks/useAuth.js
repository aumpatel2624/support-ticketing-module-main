import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import authService from '@/lib/services/authService';
import { getErrorMessage } from '@/lib/api';

/**
 * useAuth Hook
 * Provides authentication functionality and state
 */
export default function useAuth() {
    const router = useRouter();
    const {
        user,
        token,
        isAuthenticated,
        isLoading,
        error,
        login: setLogin,
        logout: setLogout,
        setLoading,
        setError,
        hasRole,
        hasAnyRole,
        hasPermission,
    } = useAuthStore();

    /**
     * Login user
     */
    const login = useCallback(
        async (credentials) => {
            try {
                setLoading(true);
                setError(null);

                const response = await authService.login(credentials);
                const { user, accessToken, refreshToken } = response.data || {};

                // In some cases the backend might return 'token' instead of 'accessToken'
                // based on previous debugging, let's be safe
                const token = accessToken || response.data?.token;

                // Store user and tokens in store
                setLogin(user, token, refreshToken);

                toast.success('Login successful!');

                // Use router.replace to dashboard to prevent back button loops
                router.replace('/dashboard');

                return response.data;
            } catch (err) {
                const errorMessage = getErrorMessage(err);
                console.error('Login failed:', {
                    status: err.response?.status,
                    message: errorMessage,
                    data: err.response?.data
                });
                setError(errorMessage);
                // Ensure toast is shown with proper message
                toast.error(errorMessage, { duration: 4000 });
                // Don't re-throw to prevent page reload
            } finally {
                setLoading(false);
            }
        },
        [setLogin, setLoading, setError, router]
    );

    /**
     * Logout user
     */
    const logout = useCallback(async () => {
        try {
            setLoading(true);

            // Call logout API
            await authService.logout();

            // Clear store
            setLogout();

            toast.success('Logged out successfully');

            // Redirect to login
            router.push('/login');
        } catch (err) {
            // Even if API call fails, logout locally
            setLogout();
            router.push('/login');

            console.error('Logout error:', err);
        } finally {
            setLoading(false);
        }
    }, [setLogout, setLoading, router]);

    /**
     * Refresh user data
     */
    const refreshUser = useCallback(async () => {
        try {
            setLoading(true);
            const data = await authService.getCurrentUser();
            useAuthStore.getState().setUser(data.user);
            return data.user;
        } catch (err) {
            console.error('Failed to refresh user:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [setLoading]);

    /**
     * Check if user is authenticated
     */
    const checkAuth = useCallback(() => {
        return isAuthenticated && !!token;
    }, [isAuthenticated, token]);

    /**
     * Require authentication - redirect to login if not authenticated
     */
    const requireAuth = useCallback(() => {
        if (!checkAuth()) {
            router.push('/login');
            return false;
        }
        return true;
    }, [checkAuth, router]);

    /**
     * Require specific role - redirect if user doesn't have role
     */
    const requireRole = useCallback(
        (role, redirectTo = '/dashboard') => {
            if (!checkAuth()) {
                router.push('/login');
                return false;
            }

            if (!hasRole(role)) {
                toast.error('You do not have permission to access this page');
                router.push(redirectTo);
                return false;
            }

            return true;
        },
        [checkAuth, hasRole, router]
    );

    /**
     * Require any of the specified roles
     */
    const requireAnyRole = useCallback(
        (roles, redirectTo = '/dashboard') => {
            if (!checkAuth()) {
                router.push('/login');
                return false;
            }

            if (!hasAnyRole(roles)) {
                toast.error('You do not have permission to access this page');
                router.push(redirectTo);
                return false;
            }

            return true;
        },
        [checkAuth, hasAnyRole, router]
    );

    return {
        // State
        user,
        token,
        isAuthenticated,
        isLoading,
        error,

        // Actions
        login,
        logout,
        refreshUser,

        // Checks
        checkAuth,
        requireAuth,
        requireRole,
        requireAnyRole,
        hasRole,
        hasAnyRole,
        hasPermission,
    };
}
