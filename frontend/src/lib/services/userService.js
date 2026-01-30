import api from '../api';
import { API_ENDPOINTS } from '../constants';

const userService = {
    /**
     * Get all users
     * @param {Object} params 
     */
    async getUsers(params = {}) {
        const response = await api.get(API_ENDPOINTS.USERS, { params });
        return response.data;
    },

    /**
     * Create a new user (Invite)
     * @param {Object} userData 
     */
    async createUser(userData) {
        const response = await api.post(API_ENDPOINTS.USERS, userData);
        return response.data;
    },

    /**
     * Update user
     * @param {string} id 
     * @param {Object} updates 
     */
    async updateUser(id, updates) {
        const response = await api.put(`${API_ENDPOINTS.USERS}/${id}`, updates);
        return response.data;
    },

    /**
     * Delete/Deactivate user
     * @param {string} id 
     */
    async deleteUser(id) {
        const response = await api.delete(`${API_ENDPOINTS.USERS}/${id}`);
        return response.data;
    },

    /**
     * Get team members
     */
    async getTeamMembers() {
        // Assuming endpoint for team members or filter users
        const response = await api.get(API_ENDPOINTS.USERS, { params: { role: 'TeamMember' } });
        return response.data;
    }
};

export default userService;
