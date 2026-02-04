'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, RotateCcw } from 'lucide-react';

export default function ResolutionModal({
    isOpen,
    onClose,
    onReopen
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                        Ticket Resolved
                    </DialogTitle>
                    <DialogDescription>
                        This ticket has been marked as resolved. If you are not satisfied with the resolution, you can reopen the ticket.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-2 sm:justify-center">
                    <Button
                        variant="outline"
                        onClick={onReopen}
                        className="w-full sm:w-auto text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reopen Ticket
                    </Button>
                    <Button
                        onClick={onClose}
                        className="w-full sm:w-auto"
                    >
                        Dismiss
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
