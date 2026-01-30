import api from '../api';
import { API_ENDPOINTS } from '../constants';

const ticketService = {
    /**
     * Get all tickets with optional filtering
     * @param {Object} params - { page, limit, sort, status, priority, search }
     */
    async getTickets(params = {}) {
        const response = await api.get(API_ENDPOINTS.TICKETS, { params });
        return response.data;
    },

    /**
     * Get ticket by ID
     * @param {string} id 
     */
    async getTicket(id) {
        const response = await api.get(`${API_ENDPOINTS.TICKETS}/${id}`);
        return response.data;
    },

    /**
     * Create a new ticket
     * @param {Object} ticketData 
     */
    async createTicket(ticketData) {
        // Check if attachments are present and use FormData if so
        if (ticketData.attachments && ticketData.attachments.length > 0) {
            const formData = new FormData();
            Object.keys(ticketData).forEach(key => {
                if (key === 'attachments') {
                    Array.from(ticketData.attachments).forEach(file => {
                        formData.append('attachments', file);
                    });
                } else {
                    formData.append(key, ticketData[key]);
                }
            });

            const response = await api.post(API_ENDPOINTS.TICKETS, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        }

        const response = await api.post(API_ENDPOINTS.TICKETS, ticketData);
        return response.data;
    },

    /**
     * Update ticket
     * @param {string} id 
     * @param {Object} updates 
     */
    async updateTicket(id, updates) {
        const response = await api.put(`${API_ENDPOINTS.TICKETS}/${id}`, updates);
        return response.data;
    },

    /**
     * Delete ticket
     * @param {string} id 
     */
    async deleteTicket(id) {
        const response = await api.delete(`${API_ENDPOINTS.TICKETS}/${id}`);
        return response.data;
    },

    /**
     * Get tickets assigned to current user
     */
    async getAssignedTickets(params = {}) {
        const response = await api.get(API_ENDPOINTS.ASSIGNED_TICKETS, { params });
        return response.data;
    },

    /**
     * Get tickets created by current user
     */
    async getMyTickets(params = {}) {
        const response = await api.get(API_ENDPOINTS.MY_TICKETS, { params });
        return response.data;
    },

    /**
     * Upload attachment to a ticket
     * @param {string} ticketId 
     * @param {File} file 
     * @param {Function} onProgress - Progress callback (0-100)
     */
    async uploadAttachment(ticketId, file, onProgress) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(
            `${API_ENDPOINTS.TICKETS}/${ticketId}/attachments`,
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(progress);
                    }
                }
            }
        );
        return response.data;
    },

    /**
     * Delete attachment from a ticket
     * @param {string} ticketId 
     * @param {string} attachmentId 
     */
    async deleteAttachment(ticketId, attachmentId) {
        const response = await api.delete(
            `${API_ENDPOINTS.TICKETS}/${ticketId}/attachments/${attachmentId}`
        );
        return response.data;
    },

    /**
     * Download attachment
     * @param {string} ticketId 
     * @param {string} attachmentId 
     * @param {string} filename 
     */
    async downloadAttachment(ticketId, attachmentId, filename) {
        const response = await api.get(
            `${API_ENDPOINTS.TICKETS}/${ticketId}/attachments/${attachmentId}/download`,
            { responseType: 'blob' }
        );

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return response.data;
    }
};

export default ticketService;
