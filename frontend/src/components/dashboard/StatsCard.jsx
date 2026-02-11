import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownRight, ArrowUpRight, Minus, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Link from 'next/link';

export default function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendDirection = 'up',
  invertedTrend = false,
  loading = false,
  className,
  href,
}) {
  let trendColor = 'text-muted-foreground';
  let TrendIcon = Minus;
  let isPositive = true;

  if (trendDirection === 'up') {
    TrendIcon = ArrowUpRight;
    isPositive = !invertedTrend;
    trendColor = invertedTrend ? 'text-destructive' : 'text-success';
  } else if (trendDirection === 'down') {
    TrendIcon = ArrowDownRight;
    isPositive = invertedTrend;
    trendColor = invertedTrend ? 'text-success' : 'text-destructive';
  }

  const cardContent = (
    <Card className={cn(
      "group relative overflow-hidden border-none shadow-premium transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-card h-full",
      href && "cursor-pointer",
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
          {title}
        </CardTitle>
        <div className="h-9 w-9 rounded-xl bg-secondary/50 flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
          {Icon && <Icon className="h-4.5 w-4.5 text-muted-foreground group-hover:text-primary transition-colors" />}
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        {loading ? (
          <div className="flex h-12 items-center">
            <LoadingSpinner size="sm" />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="text-3xl font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">
              {value}
            </div>

            <div className="flex items-center gap-2 mt-2">
              {trend && (
                <div className={cn(
                  "flex items-center px-1.5 py-0.5 rounded-lg text-[11px] font-bold",
                  isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                )}>
                  <TrendIcon className="mr-0.5 h-3 w-3" />
                  {trend.value}%
                </div>
              )}
              <span className="text-[11px] font-medium text-muted-foreground">
                {description || (trend ? trend.label : '')}
              </span>
            </div>
          </div>
        )}
      </CardContent>

      {/* Decorative pulse when hovered */}
      <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
    </Card>
  );

  if (href) {
    return <Link href={href} prefetch={false} className="block h-full">{cardContent}</Link>;
  }

  return cardContent;
}

