'use client';

import { useState } from 'react';
import { Bookmark, Plus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import useTicketStore from '@/store/ticketStore';
import toast from 'react-hot-toast';

/**
 * SavedFilterPresets component - Save and load filter presets
 */
export default function SavedFilterPresets({ onApplyPreset }) {
    const { savedFilters, addSavedFilter, removeSavedFilter } = useTicketStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newFilterName, setNewFilterName] = useState('');

    const handleSaveFilter = () => {
        if (!newFilterName.trim()) {
            toast.error('Please enter a filter name');
            return;
        }

        addSavedFilter(newFilterName.trim());
        toast.success('Filter saved successfully');
        setNewFilterName('');
        setIsDialogOpen(false);
    };

    const handleDeleteFilter = (e, filterId) => {
        e.stopPropagation();
        removeSavedFilter(filterId);
        toast.success('Filter removed');
    };

    const formatFilterSummary = (filters) => {
        const parts = [];
        if (filters.status?.length) parts.push(`${filters.status.length} status`);
        if (filters.priority?.length) parts.push(`${filters.priority.length} priority`);
        if (filters.department) parts.push('dept');
        if (filters.category) parts.push('cat');
        if (filters.dateRange) parts.push('date');
        return parts.length > 0 ? parts.join(', ') : 'No filters';
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Bookmark className="h-4 w-4" />
                        Saved Filters
                        {savedFilters?.length > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                {savedFilters.length}
                            </Badge>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Saved Filters</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {savedFilters?.length === 0 ? (
                        <DropdownMenuItem disabled>
                            <span className="text-muted-foreground text-sm">
                                No saved filters
                            </span>
                        </DropdownMenuItem>
                    ) : (
                        savedFilters.map((filter) => (
                            <DropdownMenuItem
                                key={filter.id}
                                onClick={() => onApplyPreset?.(filter.filters)}
                                className="flex items-center justify-between group cursor-pointer"
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium">{filter.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatFilterSummary(filter.filters)}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                    onClick={(e) => handleDeleteFilter(e, filter.id)}
                                >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                            </DropdownMenuItem>
                        ))
                    )}

                    <DropdownMenuSeparator />

                    <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Save Current Filters
                        </DropdownMenuItem>
                    </DialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Save Filter Preset</DialogTitle>
                    <DialogDescription>
                        Save your current filter settings for quick access later.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Input
                        placeholder="Enter filter name (e.g., 'High Priority IT')"
                        value={newFilterName}
                        onChange={(e) => setNewFilterName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSaveFilter();
                            }
                        }}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveFilter}>
                        <Check className="mr-2 h-4 w-4" />
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
