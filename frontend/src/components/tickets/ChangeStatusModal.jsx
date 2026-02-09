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

export default function ChangeStatusModal({
    isOpen,
    onClose,
    currentStatus,
    onStatusChange,
    isLoading
}) {
    const [selectedStatus, setSelectedStatus] = useState('');

    // Define valid transitions based on current status (mirroring backend logic)
    const getValidTransitions = (status) => {
        const output = {
            'New': ['Assigned'],
            'Assigned': ['InProgress', 'New'],
            'InProgress': ['Resolved', 'Escalated'],
            'Resolved': ['Reopened'],
            'Reopened': ['Closed'],
            'Escalated': ['Assigned', 'InProgress']
        };
        return output[status] || [];
    };

    const availableStatuses = getValidTransitions(currentStatus);

    const handleSubmit = () => {
        if (selectedStatus) {
            onStatusChange(selectedStatus);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Change Ticket Status</DialogTitle>
                    <DialogDescription>
                        Select the new status for this ticket.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="status">New Status</Label>
                        <Select
                            value={selectedStatus}
                            onValueChange={setSelectedStatus}
                        >
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableStatuses.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {status}
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
                    <Button onClick={handleSubmit} disabled={!selectedStatus || isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Status
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
