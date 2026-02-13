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
     * Toggle user status (Activate/Deactivate)
     * @param {string} id 
     * @param {boolean} isActive 
     */
    async toggleStatus(id, isActive) {
        const response = await api.patch(`${API_ENDPOINTS.USERS}/${id}/status`, { isActive });
        return response.data;
    },

    /**
     * Get team members
     */
    async getTeamMembers() {
        // Assuming endpoint for team members or filter users
        const response = await api.get(API_ENDPOINTS.USERS, { params: { role: 'TeamMember' } });
        return response.data;
    },

    /**
     * Import users from Excel file
     * @param {File} file
     */
    async importUsers(file) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`${API_ENDPOINTS.USERS}/bulk-import`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    /**
     * Download sample Excel template for user import
     */
    async downloadSampleTemplate() {
        const response = await api.get(`${API_ENDPOINTS.USERS}/sample-template`, {
            responseType: 'blob'
        });
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'user_import_template.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }
};

export default userService;

