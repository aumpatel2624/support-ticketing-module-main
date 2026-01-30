'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    const [fromInput, setFromInput] = useState(value?.from || '');
    const [toInput, setToInput] = useState(value?.to || '');

    const handleFromChange = (e) => {
        const newFrom = e.target.value;
        setFromInput(newFrom);
        onChange({
            from: newFrom || undefined,
            to: toInput || undefined,
        });
    };

    const handleToChange = (e) => {
        const newTo = e.target.value;
        setToInput(newTo);
        onChange({
            from: fromInput || undefined,
            to: newTo || undefined,
        });
    };

    const handleClear = (e) => {
        e.stopPropagation();
        setFromInput('');
        setToInput('');
        onChange(undefined);
    };

    const displayValue = () => {
        if (fromInput && toInput) {
            return `${fromInput} - ${toInput}`;
        }
        if (fromInput) {
            return `From ${fromInput}`;
        }
        if (toInput) {
            return `Until ${toInput}`;
        }
        return placeholder;
    };

    const hasValue = fromInput || toInput;

    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <label className="text-xs text-muted-foreground block mb-1">From</label>
                    <Input
                        type="date"
                        value={fromInput}
                        onChange={handleFromChange}
                        placeholder="Start date"
                        className="text-sm"
                    />
                </div>
                <div className="flex-1">
                    <label className="text-xs text-muted-foreground block mb-1">To</label>
                    <Input
                        type="date"
                        value={toInput}
                        onChange={handleToChange}
                        placeholder="End date"
                        className="text-sm"
                    />
                </div>
                {hasValue && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-2"
                        onClick={handleClear}
                        title="Clear date range"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
            {hasValue && (
                <div className="text-xs text-muted-foreground">
                    {displayValue()}
                </div>
            )}
        </div>
    );
}
