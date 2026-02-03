'use client';

import { Loader2, AlertCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function ConfirmStatusChangeModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    ticketSubject,
    currentStatus,
    newStatus,
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        Confirm Status Change
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to change the ticket status?
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-muted rounded-lg p-4 space-y-3">
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                    Ticket Subject
                                </p>
                                <p className="text-sm font-semibold line-clamp-2">
                                    {ticketSubject}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                    Status Change
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-slate-200 text-slate-700">
                                        {currentStatus}
                                    </span>
                                    <span className="text-muted-foreground">→</span>
                                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-200 text-blue-700">
                                        {newStatus}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground border-t pt-3">
                            This action will update the ticket status and may trigger notifications to team members.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            'Confirm Change'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
