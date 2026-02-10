'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function ChangePriorityModal({
    isOpen,
    onClose,
    currentPriority,
    onPriorityChange,
    isLoading
}) {
    const [selectedPriority, setSelectedPriority] = useState(currentPriority || 'Medium');

    const priorities = ['Low', 'Medium', 'High', 'Urgent'];

    const handleSubmit = () => {
        if (selectedPriority) {
            onPriorityChange(selectedPriority);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Change Ticket Priority</DialogTitle>
                    <DialogDescription>
                        Select the new priority level for this ticket.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="priority">New Priority</Label>
                        <Select
                            value={selectedPriority}
                            onValueChange={setSelectedPriority}
                        >
                            <SelectTrigger id="priority">
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                                {priorities.map((priority) => (
                                    <SelectItem key={priority} value={priority}>
                                        {priority}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!selectedPriority || isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Priority
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
