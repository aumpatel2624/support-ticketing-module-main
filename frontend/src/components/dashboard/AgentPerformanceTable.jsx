'use client';

import Link from 'next/link';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { getInitials, cn } from '@/lib/utils';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useState } from 'react';

export default function AgentPerformanceTable({ agents = [], loading = false }) {
    const [sortConfig, setSortConfig] = useState({
        key: 'resolvedTickets',
        direction: 'desc'
    });

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const sortedAgents = [...agents].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (sortConfig.direction === 'asc') {
            return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? 1 : -1;
    });

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />;
        return sortConfig.direction === 'desc'
            ? <ArrowDown className="h-3 w-3 text-primary" />
            : <ArrowUp className="h-3 w-3 text-primary" />;
    };

    if (loading) {
        return (
            <div className="h-[300px] flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <LoadingSpinner size="lg" />
                <span className="font-medium animate-pulse">Loading agent metrics...</span>
            </div>
        );
    }

    if (agents.length === 0) {
        return (
            <EmptyState
                title="No agents found"
                description="There are no active agents in the system."
                className="min-h-[300px] py-12"
            />
        );
    }

    return (
        <div className="overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">Agent</TableHead>
                        <TableHead
                            className="font-bold text-[10px] uppercase tracking-widest text-center cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleSort('assignedTickets')}
                        >
                            <div className="flex items-center justify-center gap-1">
                                Assigned
                                {getSortIcon('assignedTickets')}
                            </div>
                        </TableHead>
                        <TableHead
                            className="font-bold text-[10px] uppercase tracking-widest text-center cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleSort('resolvedTickets')}
                        >
                            <div className="flex items-center justify-center gap-1">
                                Resolved
                                {getSortIcon('resolvedTickets')}
                            </div>
                        </TableHead>
                        <TableHead
                            className="font-bold text-[10px] uppercase tracking-widest text-center cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleSort('avgResolutionHours')}
                        >
                            <div className="flex items-center justify-center gap-1">
                                Avg Resolution
                                {getSortIcon('avgResolutionHours')}
                            </div>
                        </TableHead>
                        <TableHead
                            className="font-bold text-[10px] uppercase tracking-widest text-center cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleSort('slaCompliance')}
                        >
                            <div className="flex items-center justify-center gap-1">
                                SLA Compliance
                                {getSortIcon('slaCompliance')}
                            </div>
                        </TableHead>
                        <TableHead
                            className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleSort('currentWorkload')}
                        >
                            <div className="flex items-center justify-end gap-1">
                                Workload
                                {getSortIcon('currentWorkload')}
                            </div>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedAgents.map((agent) => (
                        <TableRow
                            key={agent.agentId}
                            className="group cursor-pointer hover:bg-primary/[0.02] transition-colors border-b/5 border-border/40"
                        >
                            <TableCell className="pl-6">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                            {getInitials(agent.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm text-foreground">{agent.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{agent.email}</span>
                                    </div>
                                </div>
                            </TableCell>

                            <TableCell className="text-center">
                                <span className="font-semibold text-sm">{agent.assignedTickets}</span>
                            </TableCell>

                            <TableCell className="text-center">
                                <span className="font-semibold text-sm text-success">{agent.resolvedTickets}</span>
                            </TableCell>

                            <TableCell className="text-center">
                                <span className={cn(
                                    "font-semibold text-sm",
                                    agent.avgResolutionHours <= 24 ? "text-success" :
                                        agent.avgResolutionHours <= 48 ? "text-warning" : "text-destructive"
                                )}>
                                    {agent.avgResolutionHours}h
                                </span>
                            </TableCell>

                            <TableCell className="text-center">
                                <Badge variant="outline" className={cn(
                                    "rounded-md border-none px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm",
                                    agent.slaCompliance >= 90 ? "bg-success/10 text-success border-success/20" :
                                        agent.slaCompliance >= 70 ? "bg-warning/10 text-warning border-warning/20" :
                                            "bg-destructive/10 text-destructive border-destructive/20"
                                )}>
                                    {agent.slaCompliance}%
                                </Badge>
                            </TableCell>

                            <TableCell className="text-right pr-6">
                                <div className="flex items-center justify-end gap-2">
                                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all",
                                                agent.currentWorkload <= 5 ? "bg-success" :
                                                    agent.currentWorkload <= 10 ? "bg-warning" : "bg-destructive"
                                            )}
                                            style={{ width: `${Math.min((agent.currentWorkload / 15) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground w-6">
                                        {agent.currentWorkload}
                                    </span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
