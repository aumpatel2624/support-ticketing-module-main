import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoadingSpinner({
    className,
    size = "default", // default, sm, lg, xl
    fullScreen = false
}) {
    const sizeClasses = {
        sm: "h-4 w-4",
        default: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
    };

    const spinner = (
        <Loader2
            className={cn(
                "animate-spin text-primary",
                sizeClasses[size] || sizeClasses.default,
                className
            )}
        />
    );

    if (fullScreen) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                {spinner}
            </div>
        );
    }

    return spinner;
}
