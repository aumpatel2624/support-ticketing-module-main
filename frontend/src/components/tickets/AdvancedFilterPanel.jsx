'use client';

import { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp, Calendar, User, Building2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import DateRangePicker from './DateRangePicker';
import SavedFilterPresets from './SavedFilterPresets';
import useTicketStore from '@/store/ticketStore';
import useAuth from '@/hooks/useAuth';
import { TICKET_STATUS, TICKET_PRIORITY, USER_ROLES } from '@/lib/constants';
import departmentService from '@/lib/services/departmentService';
import categoryService from '@/lib/services/categoryService';
import userService from '@/lib/services/userService';

/**
 * AdvancedFilterPanel component - Expandable advanced filter panel
 */
export default function AdvancedFilterPanel({
    onFiltersChange,
    className
}) {
    const { user } = useAuth();
    const { filters, setFilters, clearFilters } = useTicketStore();
    const [isExpanded, setIsExpanded] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);

    // Fetch departments and users when panel expands
    useEffect(() => {
        const fetchOptions = async () => {
            setIsLoading(true);
            try {
                const [deptRes, userRes] = await Promise.all([
                    departmentService.getDepartments(),
                    userService.getUsers({ limit: 100 })
                ]);

                setDepartments(deptRes.data || deptRes || []);

                const allUsers = userRes.data || userRes || [];
                // Filter to only show Team Members for assignment
                const teamMembers = allUsers.filter(u => u.role === USER_ROLES.TEAM_MEMBER);
                setUsers(teamMembers);
            } catch (error) {
                console.error('Failed to fetch filter options:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (isExpanded) {
            fetchOptions();
        }
    }, [isExpanded]);

    // Fetch categories when department is selected
    useEffect(() => {
        const fetchCategories = async () => {
            if (!filters.department) {
                setCategories([]);
                return;
            }

            setIsCategoriesLoading(true);
            try {
                const catRes = await categoryService.getCategories({ departmentId: filters.department });
                setCategories(catRes.data || catRes || []);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
                setCategories([]);
            } finally {
                setIsCategoriesLoading(false);
            }
        };

        if (isExpanded && filters.department) {
            fetchCategories();
        } else {
            setCategories([]);
        }
    }, [isExpanded, filters.department]);

    const handleStatusToggle = (status) => {
        const currentStatuses = filters.status || [];
        const newStatuses = currentStatuses.includes(status)
            ? currentStatuses.filter(s => s !== status)
            : [...currentStatuses, status];
        setFilters({ status: newStatuses });
    };

    const handlePriorityToggle = (priority) => {
        const currentPriorities = filters.priority || [];
        const newPriorities = currentPriorities.includes(priority)
            ? currentPriorities.filter(p => p !== priority)
            : [...currentPriorities, priority];
        setFilters({ priority: newPriorities });
    };

    const handleApplyPreset = (presetFilters) => {
        setFilters(presetFilters);
    };

    const hasActiveFilters =
        filters.status?.length > 0 ||
        filters.priority?.length > 0 ||
        filters.department ||
        filters.category ||
        filters.assignedTo ||
        filters.dateRange ||
        filters.search;

    const activeFilterCount =
        (filters.status?.length || 0) +
        (filters.priority?.length || 0) +
        (filters.department ? 1 : 0) +
        (filters.category ? 1 : 0) +
        (filters.assignedTo ? 1 : 0) +
        (filters.dateRange ? 1 : 0) +
        (filters.search ? 1 : 0);

    return (
        <div className={`relative ${className}`}>
            {/* Filter Bar */}
            <div className="flex items-center gap-2 flex-wrap">
                <Button
                    variant={isExpanded ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="gap-2"
                >
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                            {activeFilterCount}
                        </Badge>
                    )}
                    {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>

                <SavedFilterPresets onApplyPreset={handleApplyPreset} />

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="gap-2 text-muted-foreground"
                    >
                        <X className="h-4 w-4" />
                        Clear all
                    </Button>
                )}
            </div>

            {/* Expanded Filter Panel - Absolute Positioned Dropdown */}
            {isExpanded && (
                <div className="absolute top-full right-0 mt-2 z-50 w-[90vw] md:w-[600px] max-w-[600px] shadow-xl">
                    <Card>
                        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-medium">Advanced Filters</CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setIsExpanded(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6 max-h-[80vh] overflow-y-auto">
                            {/* Status Filter */}
                            <div className="space-y-3">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Status
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.values(TICKET_STATUS).map((status) => (
                                        <label
                                            key={status}
                                            className="flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer hover:bg-muted transition-colors"
                                        >
                                            <Checkbox
                                                checked={filters.status?.includes(status)}
                                                onCheckedChange={() => handleStatusToggle(status)}
                                            />
                                            <span className="text-sm">{status}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            {/* Priority Filter */}
                            <div className="space-y-3">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Priority
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.values(TICKET_PRIORITY).map((priority) => (
                                        <label
                                            key={priority}
                                            className="flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer hover:bg-muted transition-colors"
                                        >
                                            <Checkbox
                                                checked={filters.priority?.includes(priority)}
                                                onCheckedChange={() => handlePriorityToggle(priority)}
                                            />
                                            <span className="text-sm">{priority}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            {/* Dropdown Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Department - Hide for Admins (Department Heads) who only see their own department */}
                                {user?.role !== USER_ROLES.ADMIN && (
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            Department
                                        </Label>
                                        <Select
                                            value={filters.department || 'all'}
                                            onValueChange={(val) => {
                                                const dept = departments.find(d => (d._id || d.id) === val);
                                                setFilters({
                                                    department: val === 'all' ? null : val,
                                                    departmentName: dept?.name,
                                                    // Clear category when department changes
                                                    category: null,
                                                    categoryName: null
                                                });
                                            }}
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Departments" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Departments</SelectItem>
                                                {departments.map((dept) => (
                                                    <SelectItem key={dept._id || dept.id} value={dept._id || dept.id}>
                                                        {dept.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Category - Only enabled after department is selected */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Tag className="h-4 w-4" />
                                        Category
                                        {!filters.department && (
                                            <span className="text-xs text-muted-foreground">(select department first)</span>
                                        )}
                                    </Label>
                                    <Select
                                        value={filters.category || 'all'}
                                        onValueChange={(val) => {
                                            const cat = categories.find(c => (c._id || c.id) === val);
                                            setFilters({
                                                category: val === 'all' ? null : val,
                                                categoryName: cat?.name
                                            });
                                        }}
                                        disabled={isLoading || isCategoriesLoading || !filters.department}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={!filters.department ? "Select department first" : "All Categories"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat._id || cat.id} value={cat._id || cat.id}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Assignee */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Assigned To
                                    </Label>
                                    <Select
                                        value={filters.assignedTo || 'all'}
                                        onValueChange={(val) => {
                                            const user = users.find(u => (u._id || u.id) === val);
                                            setFilters({
                                                assignedTo: val === 'all' ? null : val,
                                                assignedToName: user?.name
                                            });
                                        }}
                                        disabled={isLoading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Users" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Users</SelectItem>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {users.map((user) => (
                                                <SelectItem key={user._id || user.id} value={user._id || user.id}>
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Date Range */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Created Date
                                    </Label>
                                    <DateRangePicker
                                        value={filters.dateRange}
                                        onChange={(range) => setFilters({ dateRange: range })}
                                        placeholder="Select date range"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Active Filter Chips - Displayed below when filters are active */}
            {/* Note: In header mode, these might look weird if huge. Ideally moved elsewhere but keeping here for function availability. */}
            {hasActiveFilters && !isExpanded && (
                <div className="absolute top-full right-0 mt-2 z-10">
                    <div className="flex flex-wrap gap-2 justify-end bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 rounded-md border shadow-sm max-w-[600px]">
                        {filters.search && (
                            <FilterChip
                                label={`Search: ${filters.search}`}
                                onRemove={() => setFilters({ search: '' })}
                            />
                        )}
                        {filters.status?.map(status => (
                            <FilterChip
                                key={status}
                                label={status}
                                onRemove={() => handleStatusToggle(status)}
                            />
                        ))}
                        {filters.priority?.map(priority => (
                            <FilterChip
                                key={priority}
                                label={priority}
                                onRemove={() => handlePriorityToggle(priority)}
                            />
                        ))}
                        {filters.department && (
                            <FilterChip
                                label={`Dept: ${filters.departmentName || filters.department}`}
                                onRemove={() => setFilters({ department: null, departmentName: null, category: null, categoryName: null })}
                            />
                        )}
                        {filters.category && (
                            <FilterChip
                                label={`Cat: ${filters.categoryName || filters.category}`}
                                onRemove={() => setFilters({ category: null, categoryName: null })}
                            />
                        )}
                        {filters.assignedTo && (
                            <FilterChip
                                label={`Assigned: ${filters.assignedToName || filters.assignedTo}`}
                                onRemove={() => setFilters({ assignedTo: null, assignedToName: null })}
                            />
                        )}
                        {filters.dateRange && (
                            <FilterChip
                                label={`Date: ${filters.dateRange.from || '...'} to ${filters.dateRange.to || '...'}`}
                                onRemove={() => setFilters({ dateRange: null })}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * FilterChip component - Individual filter chip with remove button
 */
function FilterChip({ label, onRemove }) {
    return (
        <Badge variant="secondary" className="gap-1 pr-1">
            <span className="truncate max-w-[150px]">{label}</span>
            <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={onRemove}
            >
                <X className="h-3 w-3" />
            </Button>
        </Badge>
    );
}
