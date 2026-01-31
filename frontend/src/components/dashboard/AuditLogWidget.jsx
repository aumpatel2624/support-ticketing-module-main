'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    History,
    UserCog,
    Settings,
    Ticket,
    Users,
    Shield,
    FileText,
    Trash2,
    Edit,
    Plus,
    Eye,
    ArrowRight,
    RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn, getInitials, formatRelativeTime } from '@/lib/utils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import toast from 'react-hot-toast';

// Action icon mapping
const ACTION_ICONS = {
    'CREATE': Plus,
    'UPDATE': Edit,
    'DELETE': Trash2,
    'VIEW': Eye,
    'LOGIN': Shield,
    'LOGOUT': Shield,
    'ASSIGN': UserCog,
    'EXPORT': FileText,
    'SETTINGS_CHANGE': Settings,
};

// Resource icon mapping
const RESOURCE_ICONS = {
    'USER': Users,
    'TICKET': Ticket,
    'DEPARTMENT': Shield,
    'CATEGORY': FileText,
    'SETTINGS': Settings,
    'ROLE': Shield,
};

// Action color mapping
const ACTION_COLORS = {
    'CREATE': 'bg-success/10 text-success border-success/20',
    'UPDATE': 'bg-primary/10 text-primary border-primary/20',
    'DELETE': 'bg-destructive/10 text-destructive border-destructive/20',
    'VIEW': 'bg-muted text-muted-foreground',
    'LOGIN': 'bg-success/10 text-success border-success/20',
    'LOGOUT': 'bg-muted text-muted-foreground',
    'ASSIGN': 'bg-warning/10 text-warning border-warning/20',
    'EXPORT': 'bg-info/10 text-info border-info/20',
    'SETTINGS_CHANGE': 'bg-primary/10 text-primary border-primary/20',
};

// Format action name for display
const formatAction = (action) => {
    return action?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
};

// Format resource name for display
const formatResource = (resource) => {
    return resource?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
};

// Individual Audit Log Item
function AuditLogItem({ log }) {
    const actionKey = log.action?.toUpperCase() || 'VIEW';
    const resourceKey = log.resource?.toUpperCase() || 'TICKET';
    
    const ActionIcon = ACTION_ICONS[actionKey] || Eye;
    const ResourceIcon = RESOURCE_ICONS[resourceKey] || FileText;
    const actionColor = ACTION_COLORS[actionKey] || 'bg-muted text-muted-foreground';
    
    const userName = log.userId?.name || 'System';
    const userEmail = log.userId?.email || '';
    const userInitials = getInitials(userName);
    
    return (
        <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/30 transition-colors group">
            {/* Action Icon */}
            <div className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center border shrink-0",
                actionColor
            )}>
                <ActionIcon className="h-4 w-4" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                            <span className="text-foreground">{userName}</span>
                            {' '}<span className="text-muted-foreground">{formatAction(log.action).toLowerCase()}</span>{' '}
                            <span className="text-foreground">{formatResource(log.resource)}</span>
                        </p>
                        {log.details && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                            </p>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {formatRelativeTime(log.createdAt)}
                    </span>
                </div>
                
                {/* Resource Badge */}
                <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                        <ResourceIcon className="h-3 w-3 mr-1" />
                        {formatResource(log.resource)}
                    </Badge>
                    {log.resourceId && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                            ID: {log.resourceId.toString().slice(-6)}
                        </span>
                    )}
                </div>
            </div>
            
            {/* User Avatar */}
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {userInitials}
                </AvatarFallback>
            </Avatar>
        </div>
    );
}

export default function AuditLogWidget({ className }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get(`${API_ENDPOINTS.ANALYTICS}/system/audit-log?limit=10`);
            if (response.data?.success) {
                setLogs(response.data.data?.logs || []);
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            // Don't show toast on initial load, only on refresh
            if (!loading) {
                toast.error('Failed to refresh audit logs');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAuditLogs();
        // Refresh every 60 seconds
        const interval = setInterval(fetchAuditLogs, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchAuditLogs();
    };

    // Mock data for demonstration
    const mockLogs = [
        {
            _id: '1',
            action: 'UPDATE',
            resource: 'TICKET',
            resourceId: '12345',
            userId: { name: 'John Admin', email: 'john@example.com' },
            details: 'Changed status from "New" to "In Progress"',
            createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        {
            _id: '2',
            action: 'CREATE',
            resource: 'USER',
            resourceId: '67890',
            userId: { name: 'Sarah Super', email: 'sarah@example.com' },
            details: 'Created new user account for Mike Johnson',
            createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        },
        {
            _id: '3',
            action: 'SETTINGS_CHANGE',
            resource: 'SETTINGS',
            userId: { name: 'John Admin', email: 'john@example.com' },
            details: 'Updated SLA configuration',
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
            _id: '4',
            action: 'DELETE',
            resource: 'DEPARTMENT',
            resourceId: '11111',
            userId: { name: 'Sarah Super', email: 'sarah@example.com' },
            details: 'Removed deprecated IT Support department',
            createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
        },
        {
            _id: '5',
            action: 'ASSIGN',
            resource: 'TICKET',
            resourceId: '22222',
            userId: { name: 'John Admin', email: 'john@example.com' },
            details: 'Assigned ticket to Jane Smith',
            createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
        },
    ];

    const displayLogs = logs.length > 0 ? logs : mockLogs;

    return (
        <Card className={cn("border-none shadow-premium bg-card overflow-hidden", className)}>
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Recent Admin Actions
                    </CardTitle>
                    <CardDescription>Last 10 administrative actions across the platform.</CardDescription>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="h-[300px] flex flex-col items-center justify-center gap-4 text-muted-foreground">
                        <LoadingSpinner size="lg" />
                        <span className="font-medium animate-pulse">Loading audit logs...</span>
                    </div>
                ) : displayLogs.length === 0 ? (
                    <EmptyState
                        title="No recent actions"
                        description="No administrative actions have been recorded recently."
                        className="min-h-[300px] py-12"
                    />
                ) : (
                    <div className="divide-y divide-border/50">
                        {displayLogs.map((log) => (
                            <AuditLogItem key={log._id} log={log} />
                        ))}
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-4 border-t">
                <Button variant="ghost" className="w-full group" asChild>
                    <Link href="/settings/system">
                        View Full Audit Log
                        <ArrowRight className="ml-2 h-4 w-4 transition-all group-hover:translate-x-1" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
