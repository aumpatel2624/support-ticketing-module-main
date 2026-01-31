'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Users,
    Settings,
    Database,
    Activity,
    Server,
    Shield,
    BarChart3,
    Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import AdminDashboard from './AdminDashboard';
import StatsCard from './StatsCard';
import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import toast from 'react-hot-toast';

// Platform Stats Card Component
function PlatformStatCard({ title, value, subtext, icon: Icon, trend, trendDirection, alert = false, className }) {
    return (
        <Card className={cn(
            "border-none shadow-premium bg-card overflow-hidden",
            alert && "border-l-4 border-l-destructive",
            className
        )}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold">{value}</span>
                            {trend !== undefined && (
                                <span className={cn(
                                    "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold",
                                    trendDirection === 'up' ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
                                )}>
                                    {trendDirection === 'up' ? '↑' : '↓'} {trend}%
                                </span>
                            )}
                        </div>
                        {subtext && (
                            <p className="text-xs text-muted-foreground">{subtext}</p>
                        )}
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function SuperAdminDashboard({ user }) {
    const [platformStats, setPlatformStats] = useState({
        totalUsers: 0,
        totalDepartments: 0,
        totalCategories: 0,
        systemUptime: '99.9%',
        activeSessions: 0,
        storageUsed: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlatformStats = async () => {
            try {
                setLoading(true);
                const response = await api.get(`${API_ENDPOINTS.ANALYTICS}/system/health`);
                if (response.data?.success) {
                    const { database, users, system } = response.data.data;
                    setPlatformStats({
                        totalUsers: database?.users || 0,
                        totalDepartments: database?.departments || 0,
                        totalCategories: database?.categories || 0,
                        systemUptime: '99.9%',
                        activeSessions: users?.onlineAgents || 0,
                        storageUsed: 45 // Mock data
                    });
                }
            } catch (error) {
                console.error('Error fetching platform stats:', error);
                // Don't show error toast, as SystemHealthBanner will handle it
            } finally {
                setLoading(false);
            }
        };

        fetchPlatformStats();
    }, []);

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-gradient">
                                Super Admin Console
                            </h1>
                        </div>
                    </div>
                    <p className="text-muted-foreground text-lg max-w-[600px]">
                        Welcome back, <span className="font-bold text-foreground">{user?.name}</span>. 
                        Complete platform oversight and system management.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl h-12 px-6">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                    </Button>
                    <Button className="rounded-xl h-12 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" asChild>
                        <Link href="/settings/system">
                            <Settings className="mr-2 h-4 w-4" />
                            System Settings
                        </Link>
                    </Button>
                </div>
            </div>


            {/* Admin Dashboard Content - Inherited */}
            <AdminDashboard user={user} />

            {/* Quick Actions Footer */}
            <Card className="border-none shadow-premium bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                <Server className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold">Need to manage system settings?</h3>
                                <p className="text-sm text-muted-foreground">Access system configuration, user management, and more.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="rounded-xl" asChild>
                                <Link href="/users">
                                    <Users className="mr-2 h-4 w-4" />
                                    Manage Users
                                </Link>
                            </Button>
                            <Button className="rounded-xl" asChild>
                                <Link href="/settings/system">
                                    <Settings className="mr-2 h-4 w-4" />
                                    System Settings
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
