'use client';

import { MoreHorizontal } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getAvatarColor } from '@/lib/utils';

export const createColumns = (onEdit, onToggleStatus) => [
    {
        accessorKey: 'name',
        header: 'Department Name',
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="font-medium">{row.getValue('name')}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                    {row.original.description}
                </span>
            </div>
        ),
    },
    {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => (
            <Badge variant="outline" className="font-mono">
                {row.getValue('code')}
            </Badge>
        ),
    },
    {
        accessorKey: 'membersCount',
        header: 'Members',
        cell: ({ row }) => (
            <Badge variant="secondary">
                {row.getValue('membersCount')} Users
            </Badge>
        ),
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
            <Badge variant="outline" className="text-xs">
                {row.getValue('status')}
            </Badge>
        ),
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const department = row.original;
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
                        <DropdownMenuItem onClick={() => onEdit(department)}>
                            Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {department.isActive ? (
                            <DropdownMenuItem className="text-destructive" onClick={() => onToggleStatus(department, false)}>
                                Deactivate
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem className="text-green-600" onClick={() => onToggleStatus(department, true)}>
                                Activate
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
