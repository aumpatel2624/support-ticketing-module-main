'use client';

import { useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
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
 * DateRangePicker component - Select a date range with calendar
 */
export default function DateRangePicker({
    value,
    onChange,
    placeholder = 'Select date range',
    className
}) {
    const [isOpen, setIsOpen] = useState(false);

    // Parse dates from value
    const fromDate = value?.from ? parseISO(value.from) : undefined;
    const toDate = value?.to ? parseISO(value.to) : undefined;

    const handleSelect = (range) => {
        if (!range) {
            onChange(undefined);
            return;
        }

        const newRange = {
            from: range.from ? format(range.from, 'yyyy-MM-dd') : undefined,
            to: range.to ? format(range.to, 'yyyy-MM-dd') : undefined,
        };

        onChange(newRange);

        // Close popover if both dates are selected
        if (range.from && range.to) {
            setIsOpen(false);
        }
    };

    const clearSelection = (e) => {
        e.stopPropagation();
        onChange(undefined);
    };

    const displayValue = () => {
        if (fromDate && toDate && isValid(fromDate) && isValid(toDate)) {
            return `${format(fromDate, 'MMM dd')} - ${format(toDate, 'MMM dd')}`;
        }
        if (fromDate && isValid(fromDate)) {
            return `From ${format(fromDate, 'MMM dd')}`;
        }
        if (toDate && isValid(toDate)) {
            return `Until ${format(toDate, 'MMM dd')}`;
        }
        return placeholder;
    };

    const hasValue = fromDate || toDate;

    return (
        <div className={cn('grid gap-2', className)}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={'outline'}
                        className={cn(
                            'w-full justify-start text-left font-normal',
                            !hasValue && 'text-muted-foreground'
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className="flex-1 truncate">{displayValue()}</span>
                        {hasValue && (
                            <X
                                className="ml-2 h-4 w-4 text-muted-foreground hover:text-foreground"
                                onClick={clearSelection}
                            />
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={fromDate}
                        selected={{
                            from: fromDate,
                            to: toDate,
                        }}
                        onSelect={handleSelect}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
