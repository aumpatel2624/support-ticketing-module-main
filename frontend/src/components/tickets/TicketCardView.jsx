'use client';

import { useState, useMemo } from 'react';
import { LayoutGrid, Filter, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import TicketCard from './TicketCard';
import EmptyState from '@/components/common/EmptyState';
import useTicketStore from '@/store/ticketStore';

/**
 * TicketCardView component - Grid layout for ticket cards
 * Responsive: 1 col mobile, 2 cols tablet, 3 cols desktop, 4 cols large
 */
export default function TicketCardView({ tickets, onTicketUpdate }) {
    const { filters, setFilters, sorting, setSorting } = useTicketStore();
    const [searchQuery, setSearchQuery] = useState('');

    // Get unique values for filters
    const departments = useMemo(() => {
        const depts = [...new Set(tickets.map(t => t.department?.name || t.departmentName).filter(Boolean))];
        return depts;
    }, [tickets]);

    const categories = useMemo(() => {
        const cats = [...new Set(tickets.map(t => t.category?.name || t.categoryName).filter(Boolean))];
        return cats;
    }, [tickets]);

    const priorities = useMemo(() => {
        return [...new Set(tickets.map(t => t.priority).filter(Boolean))];
    }, [tickets]);

    const statuses = useMemo(() => {
        return [...new Set(tickets.map(t => t.status).filter(Boolean))];
    }, [tickets]);

    // Filter and sort tickets
    const filteredTickets = useMemo(() => {
        let result = [...tickets];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(ticket =>
                ticket.ticketId?.toLowerCase().includes(query) ||
                ticket.subject?.toLowerCase().includes(query) ||
                ticket.description?.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (filters.status?.length > 0) {
            result = result.filter(ticket => filters.status.includes(ticket.status));
        }

        // Priority filter
        if (filters.priority?.length > 0) {
            result = result.filter(ticket => filters.priority.includes(ticket.priority));
        }

        // Department filter
        if (filters.department) {
            result = result.filter(ticket =>
                (ticket.department?.name || ticket.departmentName) === filters.department
            );
        }

        // Category filter
        if (filters.category) {
            result = result.filter(ticket =>
                (ticket.category?.name || ticket.categoryName) === filters.category
            );
        }

        // Sorting
        result.sort((a, b) => {
            const field = sorting.field;
            const order = sorting.order === 'asc' ? 1 : -1;

            let aVal, bVal;

            switch (field) {
                case 'createdAt':
                    aVal = new Date(a.createdAt);
                    bVal = new Date(b.createdAt);
                    break;
                case 'updatedAt':
                    aVal = new Date(a.updatedAt || a.createdAt);
                    bVal = new Date(b.updatedAt || b.createdAt);
                    break;
                case 'priority':
                    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
                    aVal = priorityOrder[a.priority?.toLowerCase()] || 0;
                    bVal = priorityOrder[b.priority?.toLowerCase()] || 0;
                    break;
                case 'status':
                    aVal = a.status?.toLowerCase() || '';
                    bVal = b.status?.toLowerCase() || '';
                    break;
                case 'subject':
                    aVal = a.subject?.toLowerCase() || '';
                    bVal = b.subject?.toLowerCase() || '';
                    break;
                default:
                    aVal = a[field];
                    bVal = b[field];
            }

            if (aVal < bVal) return -1 * order;
            if (aVal > bVal) return 1 * order;
            return 0;
        });

        return result;
    }, [tickets, searchQuery, filters, sorting]);

    const handleQuickAction = (action, ticket) => {
        switch (action) {
            case 'assign':
                // TODO: Open assign dialog
                console.log('Assign ticket:', ticket._id);
                break;
            case 'priority':
                // TODO: Open priority change dialog
                console.log('Change priority:', ticket._id);
                break;
            case 'copy':
                navigator.clipboard.writeText(ticket);
                break;
            default:
                break;
        }
    };

    const handleSortChange = (field) => {
        setSorting({
            field,
            order: sorting.field === field && sorting.order === 'desc' ? 'asc' : 'desc'
        });
    };

    const clearFilters = () => {
        setSearchQuery('');
        setFilters({
            status: [],
            priority: [],
            department: null,
            category: null,
            assignedTo: null,
            dateRange: null,
            search: '',
        });
    };

    const hasActiveFilters = searchQuery || filters.status?.length > 0 || filters.priority?.length > 0 ||
        filters.department || filters.category;

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                        {filteredTickets.length} of {tickets.length} tickets
                    </span>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {/* Search */}
                    <Input
                        placeholder="Search tickets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-[200px] text-foreground placeholder:text-muted-foreground"
                    />

                    {/* Quick Filters */}
                    <Select
                        value={filters.status[0] || 'all'}
                        onValueChange={(val) => setFilters({ status: val === 'all' ? [] : [val] })}
                    >
                        <SelectTrigger className="w-full sm:w-[140px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {statuses.map(status => (
                                <SelectItem key={status} value={status}>
                                    {status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.priority[0] || 'all'}
                        onValueChange={(val) => setFilters({ priority: val === 'all' ? [] : [val] })}
                    >
                        <SelectTrigger className="w-full sm:w-[140px]">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            {priorities.map(priority => (
                                <SelectItem key={priority} value={priority}>
                                    {priority}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Sort */}
                    <Select value={sorting.field} onValueChange={handleSortChange}>
                        <SelectTrigger className="w-full sm:w-[160px]">
                            <ArrowUpDown className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="createdAt">Created Date</SelectItem>
                            <SelectItem value="updatedAt">Updated Date</SelectItem>
                            <SelectItem value="priority">Priority</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                            <SelectItem value="subject">Subject</SelectItem>
                        </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                        <Badge variant="secondary" className="gap-1">
                            Search: {searchQuery}
                            <button onClick={() => setSearchQuery('')} className="ml-1">×</button>
                        </Badge>
                    )}
                    {filters.status?.map(status => (
                        <Badge key={status} variant="secondary" className="gap-1">
                            Status: {status}
                            <button onClick={() => setFilters({ status: filters.status.filter(s => s !== status) })} className="ml-1">×</button>
                        </Badge>
                    ))}
                    {filters.priority?.map(priority => (
                        <Badge key={priority} variant="secondary" className="gap-1">
                            Priority: {priority}
                            <button onClick={() => setFilters({ priority: filters.priority.filter(p => p !== priority) })} className="ml-1">×</button>
                        </Badge>
                    ))}
                    {filters.department && (
                        <Badge variant="secondary" className="gap-1">
                            Dept: {filters.department}
                            <button onClick={() => setFilters({ department: null })} className="ml-1">×</button>
                        </Badge>
                    )}
                </div>
            )}

            {/* Cards Grid */}
            {filteredTickets.length === 0 ? (
                <EmptyState
                    icon={LayoutGrid}
                    title="No tickets found"
                    description={hasActiveFilters ? "Try adjusting your filters" : "No tickets available"}
                    action={hasActiveFilters ? { label: 'Clear filters', onClick: clearFilters } : undefined}
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredTickets.map((ticket) => (
                        <TicketCard
                            key={ticket._id}
                            ticket={ticket}
                            onQuickAction={handleQuickAction}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
