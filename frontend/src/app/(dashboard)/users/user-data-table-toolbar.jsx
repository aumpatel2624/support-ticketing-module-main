'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTableFacetedFilter } from '@/components/ui/data-table-faceted-filter';
import { USER_ROLES } from '@/lib/constants';
import departmentService from '@/lib/services/departmentService';

// Convert constants to options format
const roleOptions = Object.values(USER_ROLES).map((role) => ({
    value: role,
    label: role,
}));

export function UserDataTableToolbar({ table }) {
    const [departmentOptions, setDepartmentOptions] = useState([]);
    const isFiltered = table.getState().columnFilters.length > 0;

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const output = await departmentService.getDepartments();
                let list = [];
                if (output.data && Array.isArray(output.data)) list = output.data;
                else if (Array.isArray(output)) list = output;

                const options = list.map((dept) => ({
                    value: dept.name,
                    label: dept.name,
                }));
                setDepartmentOptions(options);
            } catch (err) {
                console.error('Failed to load departments:', err);
            }
        };
        fetchDepartments();
    }, []);

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
                {table.getColumn('department') && departmentOptions.length > 0 && (
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
