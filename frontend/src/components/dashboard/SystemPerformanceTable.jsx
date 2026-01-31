'use client';

import {
    Database,
    Mail,
    Bell,
    Cpu,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Clock,
    Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Status Badge Component
function StatusBadge({ status }) {
    const getStatusConfig = () => {
        switch (status?.toLowerCase()) {
            case 'healthy':
            case 'operational':
            case 'normal':
                return {
                    icon: CheckCircle2,
                    variant: 'success',
                    label: 'Healthy'
                };
            case 'warning':
            case 'degraded':
                return {
                    icon: AlertTriangle,
                    variant: 'warning',
                    label: 'Warning'
                };
            case 'critical':
            case 'error':
            case 'down':
                return {
                    icon: XCircle,
                    variant: 'destructive',
                    label: 'Critical'
                };
            default:
                return {
                    icon: Activity,
                    variant: 'secondary',
                    label: status || 'Unknown'
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <Badge 
            variant={config.variant}
            className="flex items-center gap-1 w-fit"
        >
            <Icon className="h-3 w-3" />
            {config.label}
        </Badge>
    );
}

// Metric Card Component
function MetricCard({ title, value, subtext, icon: Icon, status, progress, metrics = [] }) {
    return (
        <div className="p-4 rounded-xl bg-secondary/30 space-y-3">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-semibold text-sm">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                    </div>
                </div>
                <StatusBadge status={status} />
            </div>
            
            {progress !== undefined && (
                <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Utilization</span>
                        <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                </div>
            )}

            {subtext && (
                <p className="text-xs text-muted-foreground">{subtext}</p>
            )}

            {metrics.length > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                    {metrics.map((metric, index) => (
                        <div key={index} className="text-center">
                            <p className="text-xs text-muted-foreground">{metric.label}</p>
                            <p className={cn(
                                "text-sm font-semibold",
                                metric.highlight ? "text-primary" : "text-foreground"
                            )}>
                                {metric.value}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function SystemPerformanceTable({ data, className }) {
    // Mock data - in production, this would come from props or API
    const dbMetrics = {
        avgQueryTime: '45ms',
        connectionPool: { used: 12, max: 20, percentage: 60 },
        status: 'healthy',
        slowQueries: 3,
        totalQueries: 15420
    };

    const emailMetrics = {
        sent: 1250,
        delivered: 1180,
        bounced: 45,
        failed: 25,
        deliveryRate: 94.4,
        status: 'healthy'
    };

    const notificationMetrics = {
        pushSent: 3420,
        pushDelivered: 3380,
        deliveryRate: 98.8,
        status: 'healthy'
    };

    const jobMetrics = {
        queued: 12,
        processing: 3,
        completed: 8450,
        failed: 23,
        status: 'healthy'
    };

    return (
        <Card className={cn("border-none shadow-premium bg-card overflow-hidden", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    System Performance
                </CardTitle>
                <CardDescription>Real-time monitoring of system components.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Database Performance */}
                    <MetricCard
                        title="Database"
                        value={dbMetrics.avgQueryTime}
                        subtext="Average query response time"
                        icon={Database}
                        status={dbMetrics.status}
                        progress={dbMetrics.connectionPool.percentage}
                        metrics={[
                            { label: 'Connections', value: `${dbMetrics.connectionPool.used}/${dbMetrics.connectionPool.max}` },
                            { label: 'Slow Queries', value: dbMetrics.slowQueries, highlight: dbMetrics.slowQueries > 5 }
                        ]}
                    />

                    {/* Email Delivery */}
                    <MetricCard
                        title="Email Delivery"
                        value={`${emailMetrics.deliveryRate}%`}
                        subtext={`${emailMetrics.delivered} delivered / ${emailMetrics.sent} sent`}
                        icon={Mail}
                        status={emailMetrics.status}
                        metrics={[
                            { label: 'Bounced', value: emailMetrics.bounced },
                            { label: 'Failed', value: emailMetrics.failed, highlight: emailMetrics.failed > 20 }
                        ]}
                    />

                    {/* Notification System */}
                    <MetricCard
                        title="Push Notifications"
                        value={`${notificationMetrics.deliveryRate}%`}
                        subtext={`${notificationMetrics.pushDelivered} delivered / ${notificationMetrics.pushSent} sent`}
                        icon={Bell}
                        status={notificationMetrics.status}
                        metrics={[
                            { label: 'Sent', value: notificationMetrics.pushSent },
                            { label: 'Delivered', value: notificationMetrics.pushDelivered }
                        ]}
                    />

                    {/* Background Jobs */}
                    <MetricCard
                        title="Background Jobs"
                        value={jobMetrics.processing}
                        subtext="Currently processing"
                        icon={Clock}
                        status={jobMetrics.status}
                        metrics={[
                            { label: 'Queued', value: jobMetrics.queued },
                            { label: 'Failed', value: jobMetrics.failed, highlight: jobMetrics.failed > 10 },
                            { label: 'Completed', value: jobMetrics.completed.toLocaleString() }
                        ]}
                    />
                </div>

                {/* Performance Summary Bar */}
                <div className="mt-6 p-4 rounded-xl bg-secondary/30">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Overall System Status</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-success" />
                                <span className="text-xs text-muted-foreground">4/4 Systems Healthy</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Last updated: Just now</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
