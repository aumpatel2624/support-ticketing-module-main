'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * DateRangePicker component - Simple date range picker with manual input
 */


export default function DateRangePicker({
    value,
    onChange,
    placeholder = 'Select date range',
    className
}) {
    // Local state for the calendar selection
    const [date, setDate] = useState(value);

    // Sync local state with prop value
    useEffect(() => {
        setDate(value);
    }, [value]);

    const handleSelect = (newDate) => {
        setDate(newDate);
        if (newDate?.from) {
            onChange(newDate);
        } else {
            onChange(undefined);
        }
    };

    const handleClear = (e) => {
        e.stopPropagation();
        setDate(undefined);
        onChange(undefined);
    };

    return (
        <div className={cn('grid gap-2', className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={'outline'}
                        className={cn(
                            'w-full justify-start text-left font-normal bg-card hover:bg-accent/50',
                            !date && 'text-muted-foreground'
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, 'LLL dd, y')} -{' '}
                                    {format(date.to, 'LLL dd, y')}
                                </>
                            ) : (
                                format(date.from, 'LLL dd, y')
                            )
                        ) : (
                            <span>{placeholder}</span>
                        )}
                        {date?.from && (
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={handleClear}
                                className="ml-auto hover:bg-slate-200 rounded-full p-0.5 transition-colors"
                            >
                                <X className="h-3 w-3 text-muted-foreground" />
                            </div>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={handleSelect}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
