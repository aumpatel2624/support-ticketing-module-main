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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export default function ReopenDialog({
    isOpen,
    onClose,
    onConfirm,
    isLoading
}) {
    const [remarks, setRemarks] = useState('');

    const handleSubmit = () => {
        if (!remarks.trim()) return;
        onConfirm(remarks);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Reopen Ticket</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to reopen this ticket? Please provide a reason.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="remarks">Remarks (Required)</Label>
                        <Textarea
                            id="remarks"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Explain why the resolution was not satisfactory..."
                            className="min-h-[100px]"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!remarks.trim() || isLoading}
                        variant="destructive"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Reopen
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
