'use client';

import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

export const columns = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && 'indeterminate')
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'name',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Category Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => <span className="text-muted-foreground truncate block max-w-[300px]">{row.getValue('description') || '—'}</span>,
    },
    {
        accessorKey: 'departmentId.name',
        id: 'department',
        header: 'Department',
        cell: ({ row }) => {
            const dept = row.original.departmentId;
            return dept ? (
                <Badge variant="outline">{dept.name}</Badge>
            ) : '—';
        },
        filterFn: (row, id, value) => {
            const deptName = row.original.departmentId?.name;
            return value.includes(deptName);
        },
    },
    {
        accessorKey: 'defaultPriority',
        header: 'Default Priority',
        cell: ({ row }) => {
            const priority = row.getValue('defaultPriority');
            let colorClass = '';
            switch (priority) {
                case 'Urgent': colorClass = 'text-red-600 border-red-200 bg-red-50'; break;
                case 'High': colorClass = 'text-orange-600 border-orange-200 bg-orange-50'; break;
                case 'Medium': colorClass = 'text-blue-600 border-blue-200 bg-blue-50'; break;
                case 'Low': colorClass = 'text-slate-600 border-slate-200 bg-slate-50'; break;
            }
            return <Badge variant="outline" className={colorClass}>{priority}</Badge>;
        },
    },
    {
        accessorKey: 'defaultSLA',
        header: 'SLA (Hours)',
        cell: ({ row }) => <span>{row.getValue('defaultSLA')}h</span>,
    },
    {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => {
            const isActive = row.getValue('isActive');
            return (
                <Badge variant={isActive ? 'default' : 'secondary'}>
                    {isActive ? 'Active' : 'Inactive'}
                </Badge>
            );
        },
    },
    {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit Category</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
