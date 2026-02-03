'use client';

import { useState, useEffect } from 'react';
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
    const { viewMode, setViewMode, filters } = useTicketStore();

    const fetchAssignedTickets = async (appliedFilters = {}) => {
        try {
            setIsLoading(true);
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
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <PageHeader
                heading="Assigned Tickets"
                text="View and manage tickets assigned to you."
            />

            {/* Advanced Filter Panel */}
            <AdvancedFilterPanel />

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">View:</span>
                <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="gap-2"
                >
                    <List className="h-4 w-4" />
                    Table
                </Button>
                <Button
                    variant={viewMode === 'kanban' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('kanban')}
                    className="gap-2"
                >
                    <Kanban className="h-4 w-4" />
                    Kanban
                </Button>
                <Button
                    variant={viewMode === 'card' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('card')}
                    className="gap-2"
                >
                    <LayoutGrid className="h-4 w-4" />
                    Card
                </Button>
            </div>

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
                        data={tickets}
                        columns={columns}
                        toolbar={DataTableToolbar}
                    />
                )}
            </div>
        </div>
    );
}
