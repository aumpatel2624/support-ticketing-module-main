'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import TicketDetailView from '@/components/tickets/TicketDetailView';
import ticketService from '@/lib/services/ticketService';
import useTicketStore from '@/store/ticketStore';
import useSettingsStore from '@/store/settingsStore';
import useTicketUpdates from '@/hooks/useTicketUpdates';
import useAuth from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function TicketsPage() {
    const [tickets, setTickets] = useState([]);
    const [ticketDetail, setTicketDetail] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const { viewMode, setViewMode, filters } = useTicketStore();
    const { systemSettings, fetchSystemSettings } = useSettingsStore();
    const searchParams = useSearchParams();
    const router = useRouter();
    const searchQuery = searchParams.get('search') || '';
    const ticketIdParam = searchParams.get('id');

    const { user } = useAuth();

    // Feature toggles from SystemSettings (default to true if not loaded)
    const features = systemSettings?.features || {};
    const showTableView = features.tableView !== false;
    const showKanbanView = features.kanbanView !== false;
    const showCardView = features.cardView !== false;

    // Fetch system settings on mount
    useEffect(() => {
        fetchSystemSettings().catch(() => { });
    }, [fetchSystemSettings]);

    // Initialize filters from URL parameters
    useEffect(() => {
        const paramsFilter = {};
        let hasParams = false;

        const statusParam = searchParams.get('status');
        if (statusParam) {
            paramsFilter.status = statusParam.split(',');
            hasParams = true;
        }

        const priorityParam = searchParams.get('priority');
        if (priorityParam) {
            paramsFilter.priority = priorityParam.split(',');
            hasParams = true;
        }

        const slaStatusParam = searchParams.get('slaStatus');
        if (slaStatusParam) {
            paramsFilter.slaStatus = slaStatusParam.split(',');
            hasParams = true;
        }

        const assignedToMe = searchParams.get('assignedToMe');
        if (assignedToMe === 'true' && user?._id) {
            paramsFilter.assignedTo = user._id;
            hasParams = true;
        }

        if (hasParams) {
            useTicketStore.getState().setFilters(paramsFilter);
        }
    }, [searchParams, user]);

    // Fetch single ticket details when ID param is present
    useEffect(() => {
        const fetchTicketDetail = async () => {
            if (!ticketIdParam) {
                setTicketDetail(null);
                return;
            }

            try {
                setIsDetailLoading(true);
                const output = await ticketService.getTicket(ticketIdParam);

                let ticketData = output;
                if (output.data) ticketData = output.data;
                if (output.ticket) ticketData = output.ticket;

                setTicketDetail(ticketData);
            } catch (error) {
                console.error('Failed to fetch ticket detail:', error);
                toast.error('Failed to load ticket details');
                // Optional: redirect back to list if not found
                // router.push('/tickets');
            } finally {
                setIsDetailLoading(false);
            }
        };

        fetchTicketDetail();
    }, [ticketIdParam]);

    const fetchTickets = async (search = '', appliedFilters = {}) => {
        // If we are showing detail view, we might not need to fetch the list immediately,
        // but it's good to have it ready in background or if user switches back.
        // For now, let's keep fetching behavior as is.
        try {
            setIsLoading(true);
            const params = {};

            // Add search parameter
            if (search) {
                params.search = search;
            }

            // Add filter parameters
            if (appliedFilters.status && appliedFilters.status.length > 0) {
                params.status = appliedFilters.status.join(',');
            }
            if (appliedFilters.priority && appliedFilters.priority.length > 0) {
                params.priority = appliedFilters.priority.join(',');
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
            if (appliedFilters.slaStatus && appliedFilters.slaStatus.length > 0) {
                params.slaStatus = appliedFilters.slaStatus.join(',');
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
        // Only fetch list if we are NOT in detail view OR if we want to keep list updated
        // Fetching always ensures consistency if we navigate back
        fetchTickets(searchQuery, filters);
    }, [searchQuery, filters]);

    // Listen for real-time ticket updates
    useTicketUpdates((data) => {
        // Refetch tickets when any ticket is updated
        fetchTickets(searchQuery, filters);

        // If we are viewing the updated ticket, refresh detail too
        if (ticketIdParam && data.ticketId === ticketIdParam) {
            ticketService.getTicket(ticketIdParam).then(res => {
                const updated = res.data || res.ticket || res;
                setTicketDetail(updated);
            });
        }
    });

    // RENDER DETAIL VIEW
    if (ticketIdParam) {
        if (isDetailLoading) {
            return (
                <div className="flex items-center justify-center h-full min-h-[500px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            );
        }

        if (!ticketDetail) {
            return <div className="p-8 text-center text-muted-foreground">Ticket not found</div>;
        }

        return <TicketDetailView ticket={ticketDetail} />;
    }

    // RENDER LIST VIEW
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
