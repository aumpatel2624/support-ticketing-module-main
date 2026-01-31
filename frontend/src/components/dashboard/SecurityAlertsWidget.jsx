'use client';

import { useState, useEffect } from 'react';
import {
    Shield,
    ShieldAlert,
    ShieldCheck,
    Lock,
    AlertTriangle,
    XCircle,
    UserX,
    Globe,
    Clock,
    RefreshCw,
    ChevronRight,
    Eye,
    EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

// Alert severity configuration
const ALERT_CONFIG = {
    critical: {
        icon: XCircle,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/20',
        badge: 'destructive'
    },
    high: {
        icon: ShieldAlert,
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        borderColor: 'border-warning/20',
        badge: 'warning'
    },
    medium: {
        icon: AlertTriangle,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
        badge: 'secondary'
    },
    low: {
        icon: ShieldCheck,
        color: 'text-success',
        bgColor: 'bg-success/10',
        borderColor: 'border-success/20',
        badge: 'success'
    }
};

// Individual Alert Item
function AlertItem({ alert }) {
    const [isOpen, setIsOpen] = useState(false);
    const config = ALERT_CONFIG[alert.severity?.toLowerCase()] || ALERT_CONFIG.medium;
    const Icon = config.icon;

    return (
        <div className={cn(
            "p-3 rounded-xl border transition-all",
            config.bgColor,
            config.borderColor
        )}>
            <div className="flex items-start gap-3">
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-background/50")}>
                    <Icon className={cn("h-4 w-4", config.color)} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-sm font-medium">{alert.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {alert.description}
                            </p>
                        </div>
                        <Badge variant={config.badge} className="text-[10px] shrink-0">
                            {alert.severity}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {alert.time}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {alert.source}
                        </span>
                    </div>

                    {alert.details && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 mt-2 text-[10px]"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? (
                                <><EyeOff className="h-3 w-3 mr-1" /> Hide details</>
                            ) : (
                                <><Eye className="h-3 w-3 mr-1" /> View details</>
                            )}
                            <ChevronRight className={cn("h-3 w-3 ml-1 transition-transform", isOpen && "rotate-90")} />
                        </Button>
                    )}

                    {isOpen && alert.details && (
                        <div className="mt-3 p-3 rounded-lg bg-background/50 text-xs space-y-1">
                            {Object.entries(alert.details).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                                    <span className="font-mono">{value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Stat Card Component
function SecurityStat({ title, value, subtext, icon: Icon, trend, alert = false }) {
    return (
        <div className={cn(
            "p-4 rounded-xl bg-secondary/30 space-y-2",
            alert && "border border-destructive/20 bg-destructive/5"
        )}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center",
                        alert ? "bg-destructive/10" : "bg-primary/10"
                    )}>
                        <Icon className={cn("h-4 w-4", alert ? "text-destructive" : "text-primary")} />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{title}</span>
                </div>
                {trend !== undefined && (
                    <Badge variant={trend > 0 ? "destructive" : "success"} className="text-[10px]">
                        {trend > 0 ? '+' : ''}{trend}%
                    </Badge>
                )}
            </div>
            <div>
                <p className={cn(
                    "text-2xl font-bold",
                    alert && "text-destructive"
                )}>
                    {value}
                </p>
                {subtext && (
                    <p className="text-xs text-muted-foreground">{subtext}</p>
                )}
            </div>
        </div>
    );
}

export default function SecurityAlertsWidget({ className }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [alerts, setAlerts] = useState([]);

    // Sample alerts data - in production, this would come from API
    const sampleAlerts = [
        {
            id: '1',
            title: 'Multiple Failed Login Attempts',
            description: '5 failed login attempts detected from IP 192.168.1.100',
            severity: 'high',
            time: '5 minutes ago',
            source: '192.168.1.100',
            details: {
                attempts: 5,
                username: 'admin@example.com',
                user_agent: 'Mozilla/5.0...',
                last_attempt: '2026-01-31 05:42:15'
            }
        },
        {
            id: '2',
            title: 'Unusual Access Pattern',
            description: 'User accessed 50+ tickets in 1 minute',
            severity: 'medium',
            time: '15 minutes ago',
            source: 'john.doe@example.com',
            details: {
                user: 'john.doe@example.com',
                actions_per_minute: 52,
                normal_average: 5,
                threshold: 30
            }
        },
        {
            id: '3',
            title: 'Password Reset Anomaly',
            description: '3 password reset requests from same IP',
            severity: 'medium',
            time: '32 minutes ago',
            source: '203.0.113.45',
            details: {
                requests: 3,
                time_window: '10 minutes',
                target_accounts: 'multiple'
            }
        },
        {
            id: '4',
            title: 'New Device Login',
            description: 'Login from unrecognized device/browser',
            severity: 'low',
            time: '1 hour ago',
            source: 'sarah.admin@example.com',
            details: {
                user: 'sarah.admin@example.com',
                device: 'Chrome on Windows',
                location: 'New York, US',
                previous_device: 'Safari on Mac'
            }
        }
    ];

    const sampleStats = {
        failedLogins24h: 23,
        failedLoginsTrend: 15,
        blockedIPs: 3,
        activeSessions: 156,
        suspiciousActivities: 2
    };

    useEffect(() => {
        // Simulate API call
        const timer = setTimeout(() => {
            setAlerts(sampleAlerts);
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const highCount = alerts.filter(a => a.severity === 'high').length;

    return (
        <Card className={cn("border-none shadow-premium bg-card overflow-hidden", className)}>
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Security Alerts
                    </CardTitle>
                    <CardDescription>Failed logins and unusual activity monitoring.</CardDescription>
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

            <CardContent className="space-y-4">
                {/* Security Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <SecurityStat
                        title="Failed Logins"
                        value={sampleStats.failedLogins24h}
                        subtext="Last 24 hours"
                        icon={UserX}
                        trend={sampleStats.failedLoginsTrend}
                        alert={sampleStats.failedLogins24h > 20}
                    />
                    <SecurityStat
                        title="Blocked IPs"
                        value={sampleStats.blockedIPs}
                        subtext="Temporarily banned"
                        icon={Lock}
                        alert={sampleStats.blockedIPs > 0}
                    />
                    <SecurityStat
                        title="Active Sessions"
                        value={sampleStats.activeSessions}
                        subtext="Currently logged in"
                        icon={ShieldCheck}
                    />
                    <SecurityStat
                        title="Suspicious"
                        value={sampleStats.suspiciousActivities}
                        subtext="Flagged activities"
                        icon={AlertTriangle}
                        alert={sampleStats.suspiciousActivities > 0}
                    />
                </div>

                {/* Alerts List */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold">Recent Alerts</h4>
                        {(criticalCount > 0 || highCount > 0) && (
                            <Badge variant="destructive" className="text-[10px]">
                                {criticalCount + highCount} requiring attention
                            </Badge>
                        )}
                    </div>

                    {loading ? (
                        <div className="h-[200px] flex flex-col items-center justify-center gap-4 text-muted-foreground">
                            <LoadingSpinner size="md" />
                            <span className="font-medium animate-pulse">Loading security data...</span>
                        </div>
                    ) : alerts.length === 0 ? (
                        <EmptyState
                            title="No security alerts"
                            description="No suspicious activities detected."
                            className="min-h-[150px] py-6"
                            icon={ShieldCheck}
                        />
                    ) : (
                        <div className="space-y-2">
                            {alerts.slice(0, 4).map((alert) => (
                                <AlertItem key={alert.id} alert={alert} />
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="pt-4 border-t">
                <Button variant="ghost" className="w-full group">
                    View Security Dashboard
                    <ChevronRight className="ml-2 h-4 w-4 transition-all group-hover:translate-x-1" />
                </Button>
            </CardFooter>
        </Card>
    );
}
