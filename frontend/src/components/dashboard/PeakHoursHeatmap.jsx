'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function PeakHoursHeatmap({ data = [], className }) {
    // Transform data into a 7x24 grid
    // data format: [{ day: 'Monday', dayIndex: 0, hour: 0, count: 5 }, ...]

    const getCellData = (dayIndex, hour) => {
        const cell = data.find(d => d.dayIndex === dayIndex && d.hour === hour);
        return cell ? cell.count : 0;
    };

    // Calculate max count for color scaling
    const maxCount = Math.max(...data.map(d => d.count), 1);

    // Get color intensity based on count
    const getCellColor = (count) => {
        if (count === 0) return 'bg-muted';
        const intensity = count / maxCount;
        if (intensity < 0.2) return 'bg-primary/10';
        if (intensity < 0.4) return 'bg-primary/25';
        if (intensity < 0.6) return 'bg-primary/40';
        if (intensity < 0.8) return 'bg-primary/60';
        return 'bg-primary';
    };

    // Format hour for display
    const formatHour = (hour) => {
        if (hour === 0) return '12a';
        if (hour === 12) return '12p';
        if (hour < 12) return `${hour}a`;
        return `${hour - 12}p`;
    };

    const hasData = data && data.length > 0;

    return (
        <Card className={cn("border-none shadow-premium bg-card", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">Peak Hours</CardTitle>
                <CardDescription>Ticket creation patterns by day and hour.</CardDescription>
            </CardHeader>
            <CardContent>
                {hasData ? (
                    <TooltipProvider>
                        <div className="overflow-x-auto">
                            <div className="min-w-[600px]">
                                {/* Hour labels */}
                                <div className="flex mb-1">
                                    <div className="w-10 flex-shrink-0" /> {/* Day label spacer */}
                                    {HOURS.filter(h => h % 3 === 0).map(hour => (
                                        <div
                                            key={hour}
                                            className="flex-1 text-[9px] text-muted-foreground text-center"
                                            style={{ minWidth: '20px' }}
                                        >
                                            {formatHour(hour)}
                                        </div>
                                    ))}
                                </div>

                                {/* Heatmap grid */}
                                <div className="space-y-1">
                                    {DAYS.map((day, dayIndex) => (
                                        <div key={day} className="flex items-center">
                                            <div className="w-10 text-[10px] font-medium text-muted-foreground flex-shrink-0">
                                                {day}
                                            </div>
                                            <div className="flex-1 flex gap-0.5">
                                                {HOURS.map(hour => {
                                                    const count = getCellData(dayIndex, hour);
                                                    return (
                                                        <Tooltip key={hour}>
                                                            <TooltipTrigger asChild>
                                                                <div
                                                                    className={cn(
                                                                        "flex-1 h-6 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary/50",
                                                                        getCellColor(count)
                                                                    )}
                                                                    style={{ minWidth: '6px' }}
                                                                />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-xs font-medium">{day} {formatHour(hour)}</p>
                                                                <p className="text-xs text-muted-foreground">{count} tickets</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Legend */}
                                <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-muted-foreground">
                                    <span>Low</span>
                                    <div className="flex gap-0.5">
                                        <div className="w-4 h-4 rounded-sm bg-muted" />
                                        <div className="w-4 h-4 rounded-sm bg-primary/10" />
                                        <div className="w-4 h-4 rounded-sm bg-primary/25" />
                                        <div className="w-4 h-4 rounded-sm bg-primary/40" />
                                        <div className="w-4 h-4 rounded-sm bg-primary/60" />
                                        <div className="w-4 h-4 rounded-sm bg-primary" />
                                    </div>
                                    <span>High</span>
                                </div>
                            </div>
                        </div>
                    </TooltipProvider>
                ) : (
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground italic animate-pulse">
                        No peak hours data available...
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
