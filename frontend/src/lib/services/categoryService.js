import api from '../api';
import { API_ENDPOINTS } from '../constants';

const categoryService = {
    async getCategories(params = {}) {
        const response = await api.get(API_ENDPOINTS.CATEGORIES, { params });
        return response.data;
    },

    async createCategory(data) {
        const response = await api.post(API_ENDPOINTS.CATEGORIES, data);
        return response.data;
    },

    async updateCategory(id, data) {
        const response = await api.put(`${API_ENDPOINTS.CATEGORIES}/${id}`, data);
        return response.data;
    },

    async deleteCategory(id) {
        const response = await api.delete(`${API_ENDPOINTS.CATEGORIES}/${id}`);
        return response.data;
    }
};

export default categoryService;
