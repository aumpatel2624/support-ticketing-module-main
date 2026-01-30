'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTableFacetedFilter } from '@/components/ui/data-table-faceted-filter';
import { TICKET_STATUS, TICKET_PRIORITY } from '@/lib/constants';

// Convert constants to options format
const statusOptions = Object.values(TICKET_STATUS).map((status) => ({
    value: status,
    label: status,
}));

const priorityOptions = Object.values(TICKET_PRIORITY).map((priority) => ({
    value: priority,
    label: priority,
}));

export function DataTableToolbar({ table }) {
    const isFiltered = table.getState().columnFilters.length > 0;

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                <Input
                    placeholder="Filter tickets..."
                    value={(table.getColumn('subject')?.getFilterValue()) ?? ''}
                    onChange={(event) =>
                        table.getColumn('subject')?.setFilterValue(event.target.value)
                    }
                    className="h-8 w-[150px] lg:w-[250px]"
                />
                {table.getColumn('status') && (
                    <DataTableFacetedFilter
                        column={table.getColumn('status')}
                        title="Status"
                        options={statusOptions}
                    />
                )}
                {table.getColumn('priority') && (
                    <DataTableFacetedFilter
                        column={table.getColumn('priority')}
                        title="Priority"
                        options={priorityOptions}
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
            {/* 
        View Options can go here (column visibility toggle)
        For now simple.
       */}
        </div>
    );
}
