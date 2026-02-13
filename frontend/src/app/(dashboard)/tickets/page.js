'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
import departmentService from '@/lib/services/departmentService';
import useTicketStore from '@/store/ticketStore';
import useSettingsStore from '@/store/settingsStore';
import useTicketUpdates from '@/hooks/useTicketUpdates';
import useAuth from '@/hooks/useAuth';
import { KANBAN_COLUMN_ORDER_ADMIN } from '@/lib/constants';
import toast from 'react-hot-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TicketsPage() {
    const [tickets, setTickets] = useState([]);
    const [ticketDetail, setTicketDetail] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const { viewMode, setViewMode, filters, setFilters } = useTicketStore();
    const { systemSettings, fetchSystemSettings } = useSettingsStore();
    const searchParams = useSearchParams();
    const router = useRouter();
    const searchQuery = searchParams.get('search') || '';
    const ticketIdParam = searchParams.get('id');

    const stableTickets = useMemo(() => tickets, [tickets]);

    // Track mounted state and active requests to prevent race conditions
    const isMounted = useRef(true);
    const abortControllerRef = useRef(null);
    const initialLoadDone = useRef(false);

    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'SuperAdmin';

    // Feature toggles from SystemSettings (default to true if not loaded)
    const features = systemSettings?.features || {};
    const showTableView = features.tableView !== false;
    const showKanbanView = features.kanbanView !== false;
    const showCardView = features.cardView !== false;

    // Fetch system settings on mount
    useEffect(() => {
        isMounted.current = true;
        fetchSystemSettings().catch(() => { });

        return () => {
            isMounted.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchSystemSettings]);

    // Fetch departments for SuperAdmin
    useEffect(() => {
        if (isSuperAdmin) {
            departmentService.getDepartments()
                .then(res => {
                    const depts = res.data || res.departments || res || [];
                    setDepartments(depts);
                    // Default to 'all' - no department filter
                    setSelectedDepartment('all');
                })
                .catch(() => { });
        }
    }, [isSuperAdmin]);

    // Handle department tab change
    const handleDepartmentChange = (deptId) => {
        setSelectedDepartment(deptId);
        if (deptId === 'all') {
            // Clear department filter to show all tickets
            // Clear department filter to show all tickets
            useTicketStore.getState().setFilters({
                department: null,
                departmentName: null
            });
        } else {
            // Find the department name
            const dept = departments.find(d => d._id === deptId);
            useTicketStore.getState().setFilters({
                ...useTicketStore.getState().filters,
                department: deptId,
                departmentName: dept?.name
            });
        }
    };

    // Sync tab selection with filter state - switch to 'All' when department filter is removed
    useEffect(() => {
        if (isSuperAdmin && !filters.department && selectedDepartment !== 'all') {
            setSelectedDepartment('all');
        }
    }, [isSuperAdmin, filters.department, selectedDepartment]);

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
        // Cancel previous request if exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            // Only show full loading spinner on initial load to prevent
            // DataTable from unmounting and losing pagination state
            if (!initialLoadDone.current) {
                setIsLoading(true);
            }
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

            // Pass signal to service (service needs to support it, but for now we just check signal after await)
            const output = await ticketService.getTickets(params);

            // Check if aborted after await
            if (abortController.signal.aborted || !isMounted.current) return;

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
            // Ignore abort errors
            if (error.name === 'AbortError' || abortController.signal.aborted) return;

            console.error('Failed to fetch tickets:', error);
            toast.error('Failed to load tickets');
        } finally {
            if (!abortController.signal.aborted && isMounted.current) {
                setIsLoading(false);
                initialLoadDone.current = true;
            }
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

        return (
            <div className="pt-4 md:pt-6">
                <TicketDetailView ticket={ticketDetail} onTicketUpdate={() => fetchTickets(searchQuery, filters)} />
            </div>
        );
    }

    // RENDER LIST VIEW
    return (
        <div className={`flex flex-col pt-4 md:pt-6 px-4 md:px-6 pb-4 md:pb-6 gap-4 ${viewMode === 'kanban' ? 'h-[calc(100vh-24px)] overflow-hidden' : 'flex-1 h-full'}`}>
            <PageHeader
                heading="Tickets"
                text="Manage and track all support tickets."
                className="relative z-20"
            >
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* Advanced Filter Panel */}
                    {['Admin', 'SuperAdmin'].includes(user?.role) && (
                        <AdvancedFilterPanel className="mr-2" />
                    )}

                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 mr-2 h-9">
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

                    <Button asChild>
                        <Link href="/tickets/new" prefetch={false}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Ticket
                        </Link>
                    </Button>
                </div>
            </PageHeader>

            {/* Department Tabs for SuperAdmin */}
            {isSuperAdmin && departments.length > 0 && (
                <div className="border-b border-border/50 -mt-2">
                    <Tabs value={selectedDepartment} onValueChange={handleDepartmentChange}>
                        <TabsList variant="line" className="bg-transparent h-10 p-0 gap-0">
                            <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-sm font-medium">
                                All Tickets
                            </TabsTrigger>
                            {departments.map((dept) => (
                                <TabsTrigger
                                    key={dept._id}
                                    value={dept._id}
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-sm font-medium"
                                >
                                    {dept.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
            )}

            {/* Content */}
            <div className={`flex-1 min-h-0 ${viewMode === 'kanban' ? 'overflow-hidden' : ''}`}>
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : viewMode === 'kanban' ? (
                    <KanbanBoard
                        initialTickets={tickets}
                        onTicketUpdate={fetchTickets}
                        columnOrder={user?.role === 'Admin' ? KANBAN_COLUMN_ORDER_ADMIN : undefined}
                    />
                ) : viewMode === 'card' ? (
                    <TicketCardView
                        tickets={tickets}
                        onTicketUpdate={fetchTickets}
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
