import axios from 'axios';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from './constants';
import useAuthStore from '@/store/authStore';
import { disconnectSocket } from '@/lib/socket';

// Create axios instance with default config
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds
});

/**
 * Handle forced logout due to 401/session expiry
 * Mimics the manual logout behavior for consistency
 */
const handleForcedLogout = () => {
    // Disconnect socket
    disconnectSocket();

    // Clear auth store (this also clears localStorage)
    useAuthStore.getState().logout();

    // Show toast notification
    toast.error('Session expired. Please login again.');

    // Redirect to login
    if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
};

// Request interceptor - Attach JWT token
api.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Don't apply token refresh to login/auth endpoints
        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                               originalRequest.url?.includes('/auth/register') ||
                               originalRequest.url?.includes('/auth/forgot-password') ||
                               originalRequest.url?.includes('/auth/reset-password');

        // If error is 401 and we haven't retried yet (and it's not an auth endpoint)
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            try {
                // Try to refresh the token
                const refreshToken = localStorage.getItem('refreshToken');

                if (refreshToken) {
                    const response = await axios.post(
                        `${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINTS.REFRESH_TOKEN}`,
                        { refreshToken }
                    );

                    const { token } = response.data;

                    // Save new token
                    localStorage.setItem('token', token);

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                } else {
                    // No refresh token available - force logout
                    handleForcedLogout();
                    return Promise.reject(error);
                }
            } catch (refreshError) {
                // Refresh failed - force logout
                handleForcedLogout();
                return Promise.reject(refreshError);
            }
        }

        // For auth endpoints with 401, just return the error without forcing logout
        if (isAuthEndpoint && error.response?.status === 401) {
            return Promise.reject(error);
        }

        // Return the original Axios error object (has response, config, etc.)
        // Don't spread/modify it as it loses properties
        return Promise.reject(error);
    }
);

/**
 * Extract user-friendly error message from API error
 */
export function getErrorMessage(error) {
    // Handle different error types
    if (error?.response) {
        // Server responded with error
        const { data = {}, status } = error.response;

        // Check multiple possible error message fields
        // Backend structure: { success: false, error: "message", details: null }
        if (data.error && typeof data.error === 'string') {
            return data.error;
        }
        if (data.message && typeof data.message === 'string') {
            return data.message;
        }

        // Handle status-specific messages
        switch (status) {
            case 400:
                return 'Invalid credentials. Please check your email and password.';
            case 401:
                return 'Invalid credentials. Please check your email and password.';
            case 403:
                return 'You do not have permission to perform this action.';
            case 404:
                return 'The requested resource was not found.';
            case 409:
                return 'This resource already exists.';
            case 422:
                return 'Validation error. Please check your input.';
            case 429:
                return 'Too many requests. Please try again later.';
            case 500:
                return 'Server error. Please try again later.';
            case 503:
                return 'Service temporarily unavailable. Please try again later.';
            default:
                return `An error occurred. Please try again.`;
        }
    } else if (error?.request) {
        // Request made but no response
        return 'Network error. Please check your connection and try again.';
    } else if (error?.message) {
        // Client-side error
        return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
}

export default api;
