'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function SLAComplianceGauge({ percentage = 0, className }) {
    // Ensure percentage is between 0 and 100
    const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

    // Calculate color based on percentage
    const getColor = (value) => {
        if (value >= 90) return 'text-success';
        if (value >= 70) return 'text-warning';
        return 'text-destructive';
    };

    const getBgColor = (value) => {
        if (value >= 90) return 'stroke-success';
        if (value >= 70) return 'stroke-warning';
        return 'stroke-destructive';
    };

    // SVG circle parameters
    const radius = 80;
    const strokeWidth = 12;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

    return (
        <Card className={cn("border-none shadow-premium bg-card", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">SLA Compliance</CardTitle>
                <CardDescription>Overall SLA performance metric.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-4">
                    <div className="relative">
                        <svg
                            height={radius * 2}
                            width={radius * 2}
                            className="transform -rotate-90"
                        >
                            {/* Background circle */}
                            <circle
                                stroke="hsl(var(--muted))"
                                strokeWidth={strokeWidth}
                                fill="transparent"
                                r={normalizedRadius}
                                cx={radius}
                                cy={radius}
                                className="opacity-30"
                            />
                            {/* Progress circle */}
                            <circle
                                stroke="currentColor"
                                strokeWidth={strokeWidth}
                                strokeDasharray={circumference + ' ' + circumference}
                                style={{ strokeDashoffset }}
                                strokeLinecap="round"
                                fill="transparent"
                                r={normalizedRadius}
                                cx={radius}
                                cy={radius}
                                className={cn(
                                    "transition-all duration-1000 ease-out",
                                    getBgColor(clampedPercentage)
                                )}
                            />
                        </svg>
                        {/* Center text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={cn(
                                "text-4xl font-extrabold",
                                getColor(clampedPercentage)
                            )}>
                                {Math.round(clampedPercentage)}%
                            </span>
                            <span className="text-xs text-muted-foreground mt-1">
                                Compliance
                            </span>
                        </div>
                    </div>

                    {/* Status indicator */}
                    <div className="mt-6 flex items-center gap-2">
                        <div className={cn(
                            "w-3 h-3 rounded-full",
                            clampedPercentage >= 90 ? "bg-success" :
                                clampedPercentage >= 70 ? "bg-warning" : "bg-destructive"
                        )} />
                        <span className={cn(
                            "text-sm font-medium",
                            getColor(clampedPercentage)
                        )}>
                            {clampedPercentage >= 90 ? 'Excellent' :
                                clampedPercentage >= 70 ? 'Needs Attention' : 'Critical'}
                        </span>
                    </div>

                    {/* Legend */}
                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-success" />
                            <span>90-100%</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-warning" />
                            <span>70-89%</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-destructive" />
                            <span>{'<'}70%</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
