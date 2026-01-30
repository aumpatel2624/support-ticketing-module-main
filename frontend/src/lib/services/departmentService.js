import api from '../api';
import { API_ENDPOINTS } from '../constants';

const departmentService = {
    /**
     * Get all departments
     */
    async getDepartments() {
        const response = await api.get(API_ENDPOINTS.DEPARTMENTS);
        return response.data;
    },

    /**
     * Create department
     * @param {Object} data 
     */
    async createDepartment(data) {
        const response = await api.post(API_ENDPOINTS.DEPARTMENTS, data);
        return response.data;
    },

    /**
     * Update department
     * @param {string} id 
     * @param {Object} data 
     */
    async updateDepartment(id, data) {
        const response = await api.put(`${API_ENDPOINTS.DEPARTMENTS}/${id}`, data);
        return response.data;
    },

    /**
     * Delete department
     * @param {string} id 
     */
    async deleteDepartment(id) {
        const response = await api.delete(`${API_ENDPOINTS.DEPARTMENTS}/${id}`);
        return response.data;
    }
};

export default departmentService;
