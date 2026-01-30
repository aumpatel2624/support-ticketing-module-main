'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTableFacetedFilter } from '@/components/ui/data-table-faceted-filter';
import { USER_ROLES } from '@/lib/constants';

// Convert constants to options format
const roleOptions = Object.values(USER_ROLES).map((role) => ({
    value: role,
    label: role,
}));

// Mock Departments
const departmentOptions = [
    { value: 'IT Support', label: 'IT Support' },
    { value: 'HR', label: 'HR' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Operations', label: 'Operations' },
];

export function UserDataTableToolbar({ table }) {
    const isFiltered = table.getState().columnFilters.length > 0;

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                <Input
                    placeholder="Filter users..."
                    value={(table.getColumn('name')?.getFilterValue()) ?? ''}
                    onChange={(event) =>
                        table.getColumn('name')?.setFilterValue(event.target.value)
                    }
                    className="h-8 w-[150px] lg:w-[250px]"
                />
                {table.getColumn('role') && (
                    <DataTableFacetedFilter
                        column={table.getColumn('role')}
                        title="Role"
                        options={roleOptions}
                    />
                )}
                {table.getColumn('department') && (
                    <DataTableFacetedFilter
                        column={table.getColumn('department')}
                        title="Department"
                        options={departmentOptions}
                    />
                )}
                {isFiltered && (
                    <Button
                        variant="ghost"
                        onClick={() => table.resetColumnFilters()}
                        className="h-8 px-2 lg:px-3"
                    >
                        Reset
                        <X className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
