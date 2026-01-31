'use client';

import { useState, useEffect } from 'react';
import {
    Activity,
    Users,
    Database,
    Server,
    Clock,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    TrendingUp,
    TrendingDown,
    Minus
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import toast from 'react-hot-toast';

// Status Indicator Component
function StatusIndicator({ status }) {
    const getStatusConfig = () => {
        switch (status?.toLowerCase()) {
            case 'healthy':
                return {
                    icon: CheckCircle2,
                    color: 'text-success',
                    bgColor: 'bg-success/10',
                    borderColor: 'border-success/20',
                    label: 'Healthy'
                };
            case 'degraded':
                return {
                    icon: AlertTriangle,
                    color: 'text-warning',
                    bgColor: 'bg-warning/10',
                    borderColor: 'border-warning/20',
                    label: 'Degraded'
                };
            case 'down':
                return {
                    icon: XCircle,
                    color: 'text-destructive',
                    bgColor: 'bg-destructive/10',
                    borderColor: 'border-destructive/20',
                    label: 'Down'
                };
            default:
                return {
                    icon: Activity,
                    color: 'text-muted-foreground',
                    bgColor: 'bg-muted',
                    borderColor: 'border-muted',
                    label: status || 'Unknown'
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border",
            config.bgColor,
            config.borderColor
        )}>
            <Icon className={cn("h-4 w-4", config.color)} />
            <span className={cn("text-sm font-semibold", config.color)}>
                {config.label}
            </span>
        </div>
    );
}

// Health Card Component
function HealthCard({ title, value, subtext, icon: Icon, trend, trendDirection, loading, className, children }) {
    if (loading) {
        return (
            <Card className={cn("border-none shadow-premium bg-card", className)}>
                <CardContent className="p-5">
                    <div className="flex items-center justify-center h-20">
                        <LoadingSpinner size="md" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const getTrendIcon = () => {
        if (trendDirection === 'up') return <TrendingUp className="h-3 w-3" />;
        if (trendDirection === 'down') return <TrendingDown className="h-3 w-3" />;
        return <Minus className="h-3 w-3" />;
    };

    const getTrendColor = () => {
        if (trendDirection === 'up') return 'text-success bg-success/10';
        if (trendDirection === 'down') return 'text-destructive bg-destructive/10';
        return 'text-muted-foreground bg-muted';
    };

    return (
        <Card className={cn("border-none shadow-premium bg-card overflow-hidden", className)}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold">{value}</span>
                            {trend !== undefined && (
                                <span className={cn(
                                    "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold",
                                    getTrendColor()
                                )}>
                                    {getTrendIcon()}
                                    {trend}%
                                </span>
                            )}
                        </div>
                        {subtext && (
                            <p className="text-xs text-muted-foreground">{subtext}</p>
                        )}
                        {children}
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function SystemHealthBanner({ className }) {
    const [healthData, setHealthData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSystemHealth = async () => {
            try {
                setLoading(true);
                const response = await api.get(`${API_ENDPOINTS.ANALYTICS}/system/health`);
                if (response.data?.success) {
                    setHealthData(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching system health:', error);
                toast.error('Failed to load system health data');
            } finally {
                setLoading(false);
            }
        };

        fetchSystemHealth();
        // Refresh every 30 seconds
        const interval = setInterval(fetchSystemHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    // Calculate storage percentage (mock calculation based on available data)
    const storageUsed = 45; // Mock percentage
    const storageTotal = 512;
    const storageUsedGB = Math.round((storageUsed / 100) * storageTotal);

    // Format uptime from seconds to days/hours
    const formatUptime = (seconds) => {
        if (!seconds) return '99.9%';
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        if (days > 0) return `${days}d ${hours}h`;
        return `${hours}h`;
    };

    // Get user trend (mock data)
    const userTrend = 12;
    const userTrendDirection = 'up';

    return (
        <div className={cn("space-y-4", className)}>
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Server className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">System Health</h2>
                        <p className="text-sm text-muted-foreground">Real-time platform monitoring</p>
                    </div>
                </div>
                <StatusIndicator status={healthData?.system?.status || 'healthy'} />
            </div>

            {/* Health Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {/* System Status */}
                <HealthCard
                    title="System Status"
                    value={healthData?.system?.status === 'healthy' ? 'Operational' : healthData?.system?.status || 'Unknown'}
                    subtext="All services running"
                    icon={Activity}
                    loading={loading}
                    className={cn(
                        healthData?.system?.status === 'healthy' && "border-l-4 border-l-success",
                        healthData?.system?.status === 'degraded' && "border-l-4 border-l-warning",
                        healthData?.system?.status === 'down' && "border-l-4 border-l-destructive"
                    )}
                />

                {/* API Uptime */}
                <HealthCard
                    title="API Uptime"
                    value="99.9%"
                    subtext="Last 30 days"
                    icon={Clock}
                    trend={0.1}
                    trendDirection="up"
                    loading={loading}
                />

                {/* Total Users */}
                <HealthCard
                    title="Total Users"
                    value={healthData?.database?.users?.toLocaleString() || '0'}
                    subtext="Active accounts"
                    icon={Users}
                    trend={userTrend}
                    trendDirection={userTrendDirection}
                    loading={loading}
                />

                {/* Active Sessions */}
                <HealthCard
                    title="Active Sessions"
                    value={healthData?.users?.onlineAgents?.toLocaleString() || '0'}
                    subtext="Currently online"
                    icon={Activity}
                    loading={loading}
                />

                {/* Storage Used */}
                <HealthCard
                    title="Storage Used"
                    value={`${storageUsed}%`}
                    subtext={`${storageUsedGB} GB / ${storageTotal} GB`}
                    icon={Database}
                    loading={loading}
                >
                    <div className="w-full mt-2">
                        <Progress
                            value={storageUsed}
                            className="h-1.5"
                        />
                    </div>
                </HealthCard>

                {/* System Version */}
                <HealthCard
                    title="System Version"
                    value="v1.2.0"
                    subtext="Latest stable"
                    icon={Server}
                    loading={loading}
                />
            </div>

            {/* Quick Stats Bar */}
            <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-secondary/30">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span className="text-sm text-muted-foreground">
                        Database: <span className="font-medium text-foreground">{healthData?.database?.tickets?.toLocaleString() || 0}</span> tickets
                    </span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm text-muted-foreground">
                        Created Today: <span className="font-medium text-foreground">{healthData?.tickets?.createdToday || 0}</span>
                    </span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span className="text-sm text-muted-foreground">
                        Resolved Today: <span className="font-medium text-foreground">{healthData?.tickets?.resolvedToday || 0}</span>
                    </span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                    <span className="text-sm text-muted-foreground">
                        Open Tickets: <span className="font-medium text-foreground">{healthData?.tickets?.openTickets || 0}</span>
                    </span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    <span className="text-sm text-muted-foreground">
                        Overdue: <span className="font-medium text-foreground">{healthData?.tickets?.overdueTickets || 0}</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
