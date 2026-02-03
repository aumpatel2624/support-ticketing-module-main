'use client';

import Link from 'next/link';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getStatusColor, getPriorityColor, formatDate } from '@/lib/utils';
import { getAgeCategory, getAgeLabel, getAgeDescription } from '@/lib/ticketAgeHelper';
import ticketService from '@/lib/services/ticketService';
import toast from 'react-hot-toast';

export const columns = [
    {
        id: 'age',
        header: '',
        cell: ({ row }) => {
            const category = getAgeCategory(row.original.createdAt, row.original.priority);
            const ageLabel = getAgeLabel(row.original.createdAt, row.original.priority);
            const ageDescription = getAgeDescription(row.original.createdAt, row.original.priority);

            const colorMap = {
                fresh: 'bg-green-500',
                recent: 'bg-blue-500',
                aging: 'bg-yellow-500',
                old: 'bg-orange-500',
                critical: 'bg-red-500',
            };

            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className={`w-1.5 h-8 rounded ${colorMap[category]}`} />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs font-medium">{ageLabel}</p>
                            <p className="text-xs text-muted-foreground">{ageDescription}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        },
        enableSorting: false,
        enableHiding: false,
        size: 30,
    },
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
        accessorKey: 'ticketId',
        header: 'ID',
        cell: ({ row }) => (
            <Link
                href={`/tickets/${row.original.id}`}
                className="font-medium hover:underline text-primary"
            >
                {row.getValue('ticketId')}
            </Link>
        ),
    },
    {
        accessorKey: 'subject',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Subject
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const category = row.original.category?.name;
            return (
                <div className="flex flex-col space-y-1">
                    <span className="max-w-[500px] truncate font-medium">
                        {row.getValue('subject')}
                    </span>
                    {category && (
                        <span className="text-xs text-muted-foreground">
                            {category}
                        </span>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue('status');
            return (
                <Badge variant="outline" className={getStatusColor(status)}>
                    {status}
                </Badge>
            );
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id));
        },
    },
    {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ row }) => {
            const priority = row.getValue('priority');
            return (
                <Badge variant="outline" className={getPriorityColor(priority)}>
                    {priority}
                </Badge>
            );
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id));
        },
    },
    {
        accessorKey: 'createdAt',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Created
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            return (
                <div className="text-muted-foreground text-sm">
                    {formatDate(row.getValue('createdAt'))}
                </div>
            );
        },
    },
    {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
            const ticket = row.original;

            const handleMarkResolved = async (e) => {
                e.preventDefault();
                try {
                    await ticketService.updateTicket(ticket._id || ticket.id, {
                        status: 'Completed'
                    });
                    toast.success('Ticket marked as resolved');
                    window.location.reload();
                } catch (error) {
                    console.error('Failed to mark ticket as resolved:', error);
                    toast.error('Failed to mark ticket as resolved');
                }
            };

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
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(ticket.ticketId)}
                        >
                            Copy Ticket ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href={`/tickets/${ticket._id || ticket.id}`}>View details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleMarkResolved}>
                            Mark as resolved
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
