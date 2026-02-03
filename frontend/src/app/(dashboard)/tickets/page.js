'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Loader2, LayoutGrid, Kanban, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import { DataTableToolbar } from './data-table-toolbar';
import PageHeader from '@/components/common/PageHeader';
import KanbanBoard from '@/components/tickets/KanbanBoard';
import TicketCardView from '@/components/tickets/TicketCardView';
import AdvancedFilterPanel from '@/components/tickets/AdvancedFilterPanel';
import ticketService from '@/lib/services/ticketService';
import useTicketStore from '@/store/ticketStore';
import useSettingsStore from '@/store/settingsStore';
import useTicketUpdates from '@/hooks/useTicketUpdates';
import toast from 'react-hot-toast';

export default function TicketsPage() {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { viewMode, setViewMode, filters } = useTicketStore();
    const { systemSettings, fetchSystemSettings } = useSettingsStore();
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search') || '';

    // Feature toggles from SystemSettings (default to true if not loaded)
    const features = systemSettings?.features || {};
    const showTableView = features.tableView !== false;
    const showKanbanView = features.kanbanView !== false;
    const showCardView = features.cardView !== false;

    // Fetch system settings on mount
    useEffect(() => {
        fetchSystemSettings().catch(() => { });
    }, []);

    const fetchTickets = async (search = '', appliedFilters = {}) => {
        try {
            setIsLoading(true);
            const params = {};

            // Add search parameter
            if (search) {
                params.search = search;
            }

            // Add filter parameters
            if (appliedFilters.status && appliedFilters.status.length > 0) {
                params.status = appliedFilters.status[0]; // API accepts single status
            }
            if (appliedFilters.priority && appliedFilters.priority.length > 0) {
                params.priority = appliedFilters.priority[0]; // API accepts single priority
            }
            if (appliedFilters.department) {
                params.departmentId = appliedFilters.department;
            }
            if (appliedFilters.category) {
                params.categoryId = appliedFilters.category;
            }
            if (appliedFilters.assignedTo) {
                params.assignedTo = appliedFilters.assignedTo;
            }
            if (appliedFilters.dateRange?.from) {
                params.dateFrom = appliedFilters.dateRange.from;
            }
            if (appliedFilters.dateRange?.to) {
                params.dateTo = appliedFilters.dateRange.to;
            }

            const output = await ticketService.getTickets(params);
            const payload = output;
            if (Array.isArray(payload)) {
                setTickets(payload);
            } else if (payload.data && Array.isArray(payload.data)) {
                setTickets(payload.data);
            } else if (payload.tickets && Array.isArray(payload.tickets)) {
                setTickets(payload.tickets);
            } else {
                console.warn('Unexpected ticket API response format:', payload);
                setTickets([]);
            }
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
            toast.error('Failed to load tickets');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets(searchQuery, filters);
    }, [searchQuery, filters]);

    // Listen for real-time ticket updates
    useTicketUpdates((data) => {
        // Refetch tickets when any ticket is updated
        fetchTickets(searchQuery, filters);
    });

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <PageHeader
                heading="Tickets"
                text="Manage and track all support tickets."
            >
                <Button asChild>
                    <Link href="/tickets/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Ticket
                    </Link>
                </Button>
            </PageHeader>

            {/* Advanced Filter Panel */}
            <AdvancedFilterPanel />

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">View:</span>
                {showTableView && (
                    <Button
                        variant={viewMode === 'table' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('table')}
                        className="gap-2"
                    >
                        <List className="h-4 w-4" />
                        Table
                    </Button>
                )}
                {showKanbanView && (
                    <Button
                        variant={viewMode === 'kanban' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('kanban')}
                        className="gap-2"
                    >
                        <Kanban className="h-4 w-4" />
                        Kanban
                    </Button>
                )}
                {showCardView && (
                    <Button
                        variant={viewMode === 'card' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('card')}
                        className="gap-2"
                    >
                        <LayoutGrid className="h-4 w-4" />
                        Card
                    </Button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : viewMode === 'kanban' ? (
                    <KanbanBoard
                        initialTickets={tickets}
                        onTicketUpdate={fetchTickets}
                    />
                ) : viewMode === 'card' ? (
                    <TicketCardView
                        tickets={tickets}
                        onTicketUpdate={fetchTickets}
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
