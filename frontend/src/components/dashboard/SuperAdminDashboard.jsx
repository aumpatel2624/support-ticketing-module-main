'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Users,
    Settings,
    Server,
    Shield,
    Building2,
    Ticket,
    CheckCircle,
    AlertCircle,
    Clock,
    TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import AdminDashboard from './AdminDashboard';
import analyticsService from '@/lib/services/analyticsService';
import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import toast from 'react-hot-toast';

// Department Stats Card Component
function DepartmentCard({ department }) {
    const slaColor = department.slaCompliance >= 90 ? 'text-success' :
        department.slaCompliance >= 70 ? 'text-warning' : 'text-destructive';

    return (
        <Card className="border-none shadow-premium bg-card overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{department.departmentName}</h3>
                                <p className="text-xs text-muted-foreground">{department.activeAgents} agents</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="text-xl font-bold">{department.totalTickets}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Open</p>
                            <p className="text-xl font-bold text-blue-500">{department.openTickets}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Resolved</p>
                            <p className="text-xl font-bold text-success">{department.resolvedTickets}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Avg Resolution</p>
                            <p className="text-xl font-bold">{department.avgResolutionHours}h</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">SLA Compliance</span>
                            <span className={cn("font-bold", slaColor)}>{department.slaCompliance}%</span>
                        </div>
                        <Progress value={department.slaCompliance} className="h-2" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Platform Totals Banner Component
function PlatformTotalsBanner({ totals, loading }) {
    if (loading) {
        return (
            <Card className="border-none shadow-premium bg-gradient-to-r from-primary/5 via-background to-primary/5">
                <CardContent className="p-6">
                    <div className="grid gap-4 md:grid-cols-5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 rounded-lg animate-pulse bg-muted" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-premium bg-gradient-to-r from-primary/5 via-background to-primary/5">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Platform-Wide Statistics
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="grid gap-4 md:grid-cols-5">
                    <Link href="/tickets" prefetch={false} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Ticket className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-extrabold">{totals.totalTickets}</p>
                            <p className="text-xs text-muted-foreground">Total Tickets</p>
                        </div>
                    </Link>

                    <Link href="/tickets?status=New,Assigned,InProgress" prefetch={false} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
                        <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                            <p className="text-2xl font-extrabold">{totals.openTickets}</p>
                            <p className="text-xs text-muted-foreground">Open Tickets</p>
                        </div>
                    </Link>

                    <Link href="/tickets?status=Completed,Closed" prefetch={false} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
                        <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-success" />
                        </div>
                        <div>
                            <p className="text-2xl font-extrabold">{totals.resolvedTickets}</p>
                            <p className="text-xs text-muted-foreground">Resolved</p>
                        </div>
                    </Link>

                    <Link href="/users" prefetch={false} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-extrabold">{totals.activeAgents}</p>
                            <p className="text-xs text-muted-foreground">Active Agents</p>
                        </div>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

export default function SuperAdminDashboard({ user }) {
    const [departmentBreakdown, setDepartmentBreakdown] = useState({ departments: [], totals: {} });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDepartmentStats = async () => {
            try {
                setLoading(true);
                const data = await analyticsService.getSuperAdminDashboardStats();
                setDepartmentBreakdown(data || { departments: [], totals: {} });
            } catch (error) {
                console.error('Error fetching department breakdown:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDepartmentStats();
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
                    <Button className="rounded-xl h-12 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" asChild>
                        <Link href="/settings/system" prefetch={false}>
                            <Settings className="mr-2 h-4 w-4" />
                            System Settings
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Platform Totals Banner */}
            <PlatformTotalsBanner totals={departmentBreakdown.totals} loading={loading} />

            {/* Department Breakdown Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Department Overview</h2>
                        <p className="text-muted-foreground">Statistics breakdown by department</p>
                    </div>
                    <Button variant="outline" className="rounded-xl" asChild>
                        <Link href="/departments" prefetch={false}>
                            <Building2 className="mr-2 h-4 w-4" />
                            Manage Departments
                        </Link>
                    </Button>
                </div>

                {loading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 rounded-2xl animate-pulse bg-muted" />
                        ))}
                    </div>
                ) : departmentBreakdown.departments.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {departmentBreakdown.departments.map((dept) => (
                            <DepartmentCard key={dept.departmentId} department={dept} />
                        ))}
                    </div>
                ) : (
                    <Card className="border-none shadow-premium">
                        <CardContent className="p-12 text-center">
                            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-bold">No Departments Found</h3>
                            <p className="text-muted-foreground">Create departments to see statistics here.</p>
                        </CardContent>
                    </Card>
                )}
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
                                <Link href="/users" prefetch={false}>
                                    <Users className="mr-2 h-4 w-4" />
                                    Manage Users
                                </Link>
                            </Button>
                            <Button className="rounded-xl" asChild>
                                <Link href="/settings/system" prefetch={false}>
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
