'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2, LayoutGrid, Kanban, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { columns } from '../columns';
import { DataTableToolbar } from '../data-table-toolbar';
import PageHeader from '@/components/common/PageHeader';
import KanbanBoard from '@/components/tickets/KanbanBoard';
import TicketCardView from '@/components/tickets/TicketCardView';
import AdvancedFilterPanel from '@/components/tickets/AdvancedFilterPanel';
import ticketService from '@/lib/services/ticketService';
import useTicketStore from '@/store/ticketStore';
import useTicketUpdates from '@/hooks/useTicketUpdates';
import toast from 'react-hot-toast';

export default function AssignedTicketsPage() {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const initialLoadDone = useRef(false);
    const { viewMode, setViewMode, filters } = useTicketStore();

    const stableTickets = useMemo(() => tickets, [tickets]);

    const fetchAssignedTickets = async (appliedFilters = {}) => {
        try {
            if (!initialLoadDone.current) {
                setIsLoading(true);
            }
            const params = {};

            // Add filter parameters
            if (appliedFilters.status && appliedFilters.status.length > 0) {
                params.status = appliedFilters.status.join(',');
            }
            if (appliedFilters.priority && appliedFilters.priority.length > 0) {
                params.priority = appliedFilters.priority.join(',');
            }
            if (appliedFilters.dateRange?.from) {
                params.dateFrom = appliedFilters.dateRange.from;
            }
            if (appliedFilters.dateRange?.to) {
                params.dateTo = appliedFilters.dateRange.to;
            }
            // Note: assigned tickets endpoint doesn't support departmentId, categoryId, or assignedTo
            // as they're already filtered to current user

            const output = await ticketService.getAssignedTickets(params);
            const payload = output;
            if (Array.isArray(payload)) {
                setTickets(payload);
            } else if (payload.data && Array.isArray(payload.data)) {
                setTickets(payload.data);
            } else if (payload.tickets && Array.isArray(payload.tickets)) {
                setTickets(payload.tickets);
            } else {
                console.warn('Unexpected assigned tickets API response format:', payload);
                setTickets([]);
            }
        } catch (error) {
            console.error('Failed to fetch assigned tickets:', error);
            toast.error('Failed to load assigned tickets');
        } finally {
            setIsLoading(false);
            initialLoadDone.current = true;
        }
    };

    useEffect(() => {
        fetchAssignedTickets(filters);
    }, [filters]);

    // Listen for real-time ticket updates
    useTicketUpdates((data) => {
        // Refetch tickets when any ticket is updated
        fetchAssignedTickets(filters);
    });

    return (
        <div className={`flex-1 flex-col space-y-6 p-4 md:p-6 md:flex ${viewMode === 'kanban' ? 'h-[calc(100vh-80px)] overflow-hidden' : 'h-full'}`}>
            <PageHeader
                heading="Assigned Tickets"
                text="View and manage tickets assigned to you."
            >
                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 h-9">
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${viewMode === 'kanban'
                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                    >
                        <Kanban className="h-3.5 w-3.5" />
                        Kanban
                    </button>
                    <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
                    <button
                        onClick={() => setViewMode('table')}
                        className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${viewMode === 'table'
                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                    >
                        <List className="h-3.5 w-3.5" />
                        Table
                    </button>
                    <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
                    <button
                        onClick={() => setViewMode('card')}
                        className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${viewMode === 'card'
                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                    >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        Cards
                    </button>
                </div>
            </PageHeader>

            {/* Content */}
            <div className="flex-1">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground text-lg">No assigned tickets</p>
                    </div>
                ) : viewMode === 'kanban' ? (
                    <KanbanBoard
                        initialTickets={tickets}
                        onTicketUpdate={fetchAssignedTickets}
                    />
                ) : viewMode === 'card' ? (
                    <TicketCardView
                        tickets={tickets}
                        onTicketUpdate={fetchAssignedTickets}
                    />
                ) : (
                    <DataTable
                        data={stableTickets}
                        columns={columns}
                        toolbar={DataTableToolbar}
                    />
                )}
            </div>
        </div>
    );
}
