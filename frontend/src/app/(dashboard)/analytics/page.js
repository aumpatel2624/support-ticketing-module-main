'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import TicketVolumeChart from '@/components/dashboard/TicketVolumeChart';
import TicketStatusPieChart from '@/components/dashboard/TicketStatusPieChart';
import TicketTrendChart from '@/components/dashboard/TicketTrendChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import analyticsService from '@/lib/services/analyticsService';
import ExportButton from '@/components/analytics/ExportButton';
import { Filter, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AnalyticsPage() {
    const [data, setData] = useState({
        monthlyTrend: [],
        statusDistribution: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                const stats = await analyticsService.getDashboardStats();
                setData({
                    monthlyTrend: stats.monthlyTrend || [],
                    statusDistribution: stats.statusDistribution || [],
                });
            } catch (error) {
                console.error('Failed to fetch analytics data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalyticsData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <p className="text-muted-foreground font-medium animate-pulse text-lg">Synthesizing reports...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-gradient">
                        Performance Hub
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-[600px]">
                        Aggregated telemetry and operational intelligence for your support infrastructure.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl h-12 px-6">
                        <Calendar className="mr-2 h-4 w-4" />
                        Last 30 Days
                    </Button>
                    <ExportButton
                        className="rounded-xl h-12 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-primary-foreground"
                    />
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-8">
                <div className="border-b/50 pb-1">
                    <TabsList className="bg-transparent gap-8 p-0 h-auto">
                        <TabsTrigger
                            value="overview"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 font-bold text-base"
                        >
                            Executive Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="performance"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 font-bold text-base"
                        >
                            Agent Forensics
                        </TabsTrigger>
                        <TabsTrigger
                            value="categories"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 font-bold text-base"
                        >
                            Categorical Drift
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                        <div className="col-span-4">
                            <TicketVolumeChart data={data.monthlyTrend} className="h-full border-none shadow-premium" />
                        </div>
                        <div className="col-span-3">
                            <TicketStatusPieChart data={data.statusDistribution} className="h-full border-none shadow-premium" />
                        </div>
                    </div>

                    <Card className="border-none shadow-premium overflow-hidden">
                        <CardHeader className="bg-secondary/20">
                            <CardTitle>Continuous Activity Timeline</CardTitle>
                            <CardDescription>Created vs. Resolved tickets delta over technical quarters.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <TicketTrendChart />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card className="border-none shadow-premium">
                        <CardHeader className="bg-secondary/20">
                            <CardTitle>Agent Efficiency Metrics</CardTitle>
                            <CardDescription>Deep dive into individual and group resolution performance.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-20 pb-20">
                            <div className="flex flex-col items-center justify-center text-muted-foreground gap-4">
                                <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center">
                                    <Filter className="h-10 w-10 opacity-20" />
                                </div>
                                <p className="font-bold text-lg opacity-40">Forensics Module Initialization...</p>
                                <p className="text-sm max-w-sm text-center opacity-60">This section is currently being populated with real-time agent heatmap data.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="categories" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card className="border-none shadow-premium">
                        <CardHeader className="bg-secondary/20">
                            <CardTitle>Issue Categorization Analysis</CardTitle>
                            <CardDescription>Identifying trends in ticket classification and recurring problems.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-20 pb-20">
                            <div className="flex flex-col items-center justify-center text-muted-foreground gap-4">
                                <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center">
                                    <Download className="h-10 w-10 opacity-20" />
                                </div>
                                <p className="font-bold text-lg opacity-40">Processing Categorical Data...</p>
                                <p className="text-sm max-w-sm text-center opacity-60">Classification engines are currently processing the latest ticket batches for drift analysis.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
