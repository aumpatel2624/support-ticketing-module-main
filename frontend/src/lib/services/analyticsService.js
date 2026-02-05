import api from '../api';
import { API_ENDPOINTS } from '../constants';

const analyticsService = {
    /**
     * Get dashboard stats
     */
    async getDashboardStats() {
        const response = await api.get(`${API_ENDPOINTS.ANALYTICS}/dashboard`);
        const { data } = response.data;

        // Formatter for monthly trend
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formattedTrend = (data.monthlyTrend || []).map(item => ({
            name: `${monthNames[item._id.month - 1]} ${item._id.year % 100}`,
            total: item.count
        }));

        // Formatter for status distribution
        const statusDistribution = Object.entries(data.statusStats || {}).map(([name, value]) => ({
            name,
            value,
            breakdown: data.statusBreakdown?.[name] || [] // Pass breakdown data if available
        }));

        // Formatter for priority distribution - Update to include breakdown
        const priorityDistribution = Object.entries(data.priorityStats || {}).map(([name, value]) => ({
            name,
            value,
            breakdown: data.priorityBreakdown?.[name] || [] // Pass breakdown data if available
        }));

        // Transform backend structure to components' expectations
        return {
            totalTickets: data.overview?.total || 0,
            pendingTickets: data.overview?.open || 0,
            resolvedTickets: data.overview?.resolved || 0,
            slaBreached: data.overview?.atRisk || 0,
            activeAgents: data.activeAgents || 0,
            avgResolutionTime: data.overview?.avgResolutionTime || 0,
            avgResponseTime: data.avgResponseTime || 0,
            statusStats: data.statusStats || {},
            statusDistribution,
            priorityStats: data.priorityStats || {},
            priorityDistribution, // New field with breakdown
            departmentStats: data.departmentStats || [],
            monthlyTrend: formattedTrend,
            trends: data.trends || {
                activeTickets: 0,
                slaRisk: 0,
                responseTime: 0,
                resolutionTime: 0
            },
            teamCapacity: data.teamCapacity || { active: 0, total: 0, percentage: 0 },
            firstContactResolution: data.firstContactResolution || { percentage: 0, totalResolved: 0, fcrCount: 0 },
            ticketBacklog: data.ticketBacklog || 0,
            resolutionRateToday: data.resolutionRateToday || { percentage: 0, resolvedToday: 0, createdToday: 0 },
            slaCompliance: data.slaCompliance || 0
        };
    },

    /**
     * Get detailed reports
     */
    async getReports(params = {}) {
        const response = await api.get(`${API_ENDPOINTS.ANALYTICS}/reports`, { params });
        return response.data;
    },

    /**
     * Export analytics report
     * @param {Object} params - { format, dateFrom, dateTo, ...filters }
     */
    async exportAnalytics(params = {}) {
        const { format = 'excel', ...rest } = params;

        const response = await api.get('/reports/analytics/export', {
            params: { format, ...rest },
            responseType: 'blob'
        });

        // Create download link
        const blob = new Blob([response.data], {
            type: format === 'pdf'
                ? 'application/pdf'
                : format === 'csv'
                    ? 'text/csv'
                    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const timestamp = new Date().toISOString().split('T')[0];
        const extension = format === 'excel' ? 'xlsx' : format;
        link.setAttribute('download', `analytics-report-${timestamp}.${extension}`);

        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return response.data;
    },

    /**
     * Export tickets report
     * @param {Object} params - { format, status, priority, departmentId, dateFrom, dateTo }
     */
    async exportTickets(params = {}) {
        const { format = 'excel', ...rest } = params;

        const response = await api.get('/reports/tickets/export', {
            params: { format, ...rest },
            responseType: 'blob'
        });

        // Create download link
        const blob = new Blob([response.data], {
            type: format === 'pdf'
                ? 'application/pdf'
                : format === 'csv'
                    ? 'text/csv'
                    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const timestamp = new Date().toISOString().split('T')[0];
        const extension = format === 'excel' ? 'xlsx' : format;
        link.setAttribute('download', `tickets-report-${timestamp}.${extension}`);

        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return response.data;
    },

    /**
     * Generate custom report
     * @param {Object} data - { metrics, filters, format, groupBy }
     */
    async generateCustomReport(data) {
        const { format = 'excel', ...rest } = data;

        const response = await api.post('/reports/custom', {
            format,
            ...rest
        }, {
            responseType: 'blob'
        });

        // Create download link
        const blob = new Blob([response.data], {
            type: format === 'pdf'
                ? 'application/pdf'
                : format === 'csv'
                    ? 'text/csv'
                    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const timestamp = new Date().toISOString().split('T')[0];
        const extension = format === 'excel' ? 'xlsx' : format;
        link.setAttribute('download', `custom-report-${timestamp}.${extension}`);

        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return response.data;
    },

    /**
     * Get department breakdown stats (SuperAdmin only)
     */
    async getDepartmentBreakdown() {
        const response = await api.get(`${API_ENDPOINTS.ANALYTICS}/department-breakdown`);
        return response.data?.data || { departments: [], totals: {} };
    },

    /**
     * Get personal performance stats (TeamMember/Admin)
     */
    async getMyPerformance() {
        const response = await api.get(`${API_ENDPOINTS.ANALYTICS}/my-performance`);
        return response.data?.data || {};
    }
};

export default analyticsService;

