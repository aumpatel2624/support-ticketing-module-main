import { cn } from '@/lib/utils';

export default function PageHeader({
    heading,
    text,
    children,
    className
}) {
    return (
        <div className={cn("flex items-center justify-between px-2", className)}>
            <div className="grid gap-1">
                {heading && (
                    <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
                        {heading}
                    </h1>
                )}
                {text && (
                    <p className="text-muted-foreground">
                        {text}
                    </p>
                )}
            </div>
            {children}
        </div>
    );
}
