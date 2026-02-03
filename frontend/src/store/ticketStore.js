import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Ticket Store
 * Manages ticket data, filters, and current ticket state
 */
const useTicketStore = create(
    persist(
        (set, get) => ({
            // State
            tickets: [],
            currentTicket: null,
            loading: false,
            error: null,

            // View Mode
            viewMode: 'table', // 'table', 'card', 'kanban'

            // Filters
            filters: {
                status: [],
                priority: [],
                department: null,
                category: null,
                assignedTo: null,
                slaStatus: [],
                dateRange: null,
                search: '',
            },

            // Saved Filter Presets
            savedFilters: [],

            // Pagination
            pagination: {
                page: 1,
                pageSize: 20,
                total: 0,
                totalPages: 0,
            },

            // Sorting
            sorting: {
                field: 'createdAt',
                order: 'desc',
            },

            // Actions
            setTickets: (tickets) => {
                set({ tickets });
            },

            addTicket: (ticket) => {
                set((state) => ({
                    tickets: [ticket, ...state.tickets],
                }));
            },

            updateTicket: (ticketId, updates) => {
                set((state) => ({
                    tickets: state.tickets.map((ticket) =>
                        ticket._id === ticketId ? { ...ticket, ...updates } : ticket
                    ),
                    currentTicket:
                        state.currentTicket?._id === ticketId
                            ? { ...state.currentTicket, ...updates }
                            : state.currentTicket,
                }));
            },

            removeTicket: (ticketId) => {
                set((state) => ({
                    tickets: state.tickets.filter((ticket) => ticket._id !== ticketId),
                    currentTicket:
                        state.currentTicket?._id === ticketId ? null : state.currentTicket,
                }));
            },

            setCurrentTicket: (ticket) => {
                set({ currentTicket: ticket });
            },

            clearCurrentTicket: () => {
                set({ currentTicket: null });
            },

            setLoading: (loading) => {
                set({ loading });
            },

            setError: (error) => {
                set({ error });
            },

            // Filter Actions
            setFilters: (filters) => {
                set({ filters: { ...get().filters, ...filters } });
            },

            updateFilter: (key, value) => {
                set((state) => ({
                    filters: { ...state.filters, [key]: value },
                }));
            },

            clearFilters: () => {
                set({
                    filters: {
                        status: [],
                        priority: [],
                        department: null,
                        category: null,
                        assignedTo: null,
                        slaStatus: [],
                        dateRange: null,
                        search: '',
                    },
                });
            },

            // Pagination Actions
            setPagination: (pagination) => {
                set({ pagination: { ...get().pagination, ...pagination } });
            },

            setPage: (page) => {
                set((state) => ({
                    pagination: { ...state.pagination, page },
                }));
            },

            setPageSize: (pageSize) => {
                set((state) => ({
                    pagination: { ...state.pagination, pageSize, page: 1 },
                }));
            },

            // Sorting Actions
            setSorting: (sorting) => {
                set({ sorting });
            },

            toggleSortOrder: (field) => {
                set((state) => {
                    const currentField = state.sorting.field;
                    const currentOrder = state.sorting.order;

                    if (currentField === field) {
                        // Toggle order if same field
                        return {
                            sorting: {
                                field,
                                order: currentOrder === 'asc' ? 'desc' : 'asc',
                            },
                        };
                    } else {
                        // Set new field with default desc order
                        return {
                            sorting: {
                                field,
                                order: 'desc',
                            },
                        };
                    }
                });
            },

            // View Mode Actions
            setViewMode: (mode) => {
                set({ viewMode: mode });
            },

            // Utility Actions
            getTicketById: (ticketId) => {
                return get().tickets.find((ticket) => ticket._id === ticketId);
            },

            getFilteredTickets: () => {
                const { tickets, filters } = get();

                return tickets.filter((ticket) => {
                    // Status filter
                    if (filters.status.length > 0 && !filters.status.includes(ticket.status)) {
                        return false;
                    }

                    // Priority filter
                    if (filters.priority.length > 0 && !filters.priority.includes(ticket.priority)) {
                        return false;
                    }

                    // Department filter
                    if (filters.department && ticket.department?._id !== filters.department) {
                        return false;
                    }

                    // Category filter
                    if (filters.category && ticket.category?._id !== filters.category) {
                        return false;
                    }

                    // Assigned to filter
                    if (filters.assignedTo && ticket.assignedTo?._id !== filters.assignedTo) {
                        return false;
                    }

                    // Search filter
                    if (filters.search) {
                        const searchLower = filters.search.toLowerCase();
                        const matchesSearch =
                            ticket.ticketId?.toLowerCase().includes(searchLower) ||
                            ticket.subject?.toLowerCase().includes(searchLower) ||
                            ticket.description?.toLowerCase().includes(searchLower);

                        if (!matchesSearch) {
                            return false;
                        }
                    }

                    return true;
                });
            },

            // Saved Filter Actions
            addSavedFilter: (name) => {
                const { filters, savedFilters } = get();
                const newFilter = {
                    id: Date.now().toString(),
                    name,
                    filters: { ...filters },
                    createdAt: new Date().toISOString(),
                };
                set({ savedFilters: [...savedFilters, newFilter] });
            },

            removeSavedFilter: (filterId) => {
                const { savedFilters } = get();
                set({ savedFilters: savedFilters.filter(f => f.id !== filterId) });
            },

            // Reset store
            reset: () => {
                set({
                    tickets: [],
                    currentTicket: null,
                    loading: false,
                    error: null,
                    filters: {
                        status: [],
                        priority: [],
                        department: null,
                        category: null,
                        assignedTo: null,
                        dateRange: null,
                        search: '',
                    },
                    pagination: {
                        page: 1,
                        pageSize: 20,
                        total: 0,
                        totalPages: 0,
                    },
                    sorting: {
                        field: 'createdAt',
                        order: 'desc',
                    },
                });
            },
        }),
        {
            name: 'ticket-store',
            partialize: (state) => ({
                viewMode: state.viewMode,
                savedFilters: state.savedFilters,
            }),
        }
    )
);

export default useTicketStore;
