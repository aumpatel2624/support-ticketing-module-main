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
import ticketService from '@/lib/services/ticketService';
import useTicketStore from '@/store/ticketStore';
import useTicketUpdates from '@/hooks/useTicketUpdates';
import toast from 'react-hot-toast';

export default function MyTicketsPage() {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { viewMode, setViewMode, filters } = useTicketStore();

    const fetchMyTickets = async (appliedFilters = {}) => {
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
            // Note: my tickets endpoint already filters to current user as creator

            const output = await ticketService.getMyTickets(params);
            const payload = output;
            if (Array.isArray(payload)) {
                setTickets(payload);
            } else if (payload.data && Array.isArray(payload.data)) {
                setTickets(payload.data);
            } else if (payload.tickets && Array.isArray(payload.tickets)) {
                setTickets(payload.tickets);
            } else {
                console.warn('Unexpected my tickets API response format:', payload);
                setTickets([]);
            }
        } catch (error) {
            console.error('Failed to fetch my tickets:', error);
            toast.error('Failed to load my tickets');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMyTickets(filters);
    }, [filters]);

    // Listen for real-time ticket updates
    useTicketUpdates((data) => {
        // Refetch tickets when any ticket is updated
        fetchMyTickets(filters);
    });

    return (
        <div className={`flex-1 flex-col space-y-6 p-4 md:p-6 md:flex ${viewMode === 'kanban' ? 'h-[calc(100vh-80px)] overflow-hidden' : 'h-full'}`}>
            <PageHeader
                heading="My Tickets"
                text="View and track tickets you have created."
            />

            {/* View Mode Toggle */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">View:</span>
                <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border/50">
                    <Button
                        variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('kanban')}
                        className="h-7 px-2 gap-1.5 text-xs font-medium"
                    >
                        <Kanban className="h-3.5 w-3.5" />
                        Kanban
                    </Button>
                    <Button
                        variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('table')}
                        className="h-7 px-2 gap-1.5 text-xs font-medium"
                    >
                        <List className="h-3.5 w-3.5" />
                        Table
                    </Button>
                    <Button
                        variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('card')}
                        className="h-7 px-2 gap-1.5 text-xs font-medium"
                    >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        Card
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground text-lg">No tickets created yet</p>
                    </div>
                ) : viewMode === 'kanban' ? (
                    <KanbanBoard
                        initialTickets={tickets}
                        onTicketUpdate={fetchMyTickets}
                    />
                ) : viewMode === 'card' ? (
                    <TicketCardView
                        tickets={tickets}
                        onTicketUpdate={fetchMyTickets}
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
