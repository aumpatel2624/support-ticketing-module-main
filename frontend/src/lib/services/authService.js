import api from '../api';
import { API_ENDPOINTS } from '../constants';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
const authService = {
    /**
     * Login user
     * @param {Object} credentials - { email, password, rememberMe }
     * @returns {Promise} User data with tokens
     */
    async login(credentials) {
        const response = await api.post(API_ENDPOINTS.LOGIN, credentials);
        return response.data;
    },

    /**
     * Logout user
     * @returns {Promise}
     */
    async logout() {
        const response = await api.post(API_ENDPOINTS.LOGOUT);
        return response.data;
    },

    /**
     * Refresh access token
     * @param {string} refreshToken
     * @returns {Promise} New access token
     */
    async refreshToken(refreshToken) {
        const response = await api.post(API_ENDPOINTS.REFRESH_TOKEN, {
            refreshToken,
        });
        return response.data;
    },

    /**
     * Request password reset
     * @param {string} email
     * @returns {Promise}
     */
    async forgotPassword(email) {
        const response = await api.post(API_ENDPOINTS.FORGOT_PASSWORD, { email });
        return response.data;
    },

    /**
     * Reset password with token
     * @param {Object} data - { token, password }
     * @returns {Promise}
     */
    async resetPassword(data) {
        const response = await api.post(API_ENDPOINTS.RESET_PASSWORD, data);
        return response.data;
    },

    /**
     * Get current user
     * @returns {Promise} Current user data
     */
    async getCurrentUser() {
        const response = await api.get(API_ENDPOINTS.CURRENT_USER);
        return response.data;
    },
};

export default authService;
