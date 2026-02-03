'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowUpCircle, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import ticketService from '@/lib/services/ticketService';
import toast from 'react-hot-toast';

/**
 * Dialog for escalating a ticket to higher authority
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onOpenChange - Function to handle dialog open state
 * @param {Object} props.ticket - The ticket to escalate
 * @param {Function} props.onSuccess - Callback after successful escalation
 */
export default function EscalateTicketDialog({ open, onOpenChange, ticket, onSuccess }) {
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleEscalate = async () => {
        if (!reason.trim()) {
            toast.error('Please provide a reason for escalation');
            return;
        }

        if (reason.length < 5) {
            toast.error('Reason must be at least 5 characters');
            return;
        }

        try {
            setIsLoading(true);
            await ticketService.escalateTicket(ticket._id, { reason: reason.trim() });
            toast.success('Ticket escalated successfully');
            setReason('');
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Escalation error:', error);
            toast.error(error.response?.data?.message || 'Failed to escalate ticket');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setReason('');
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                            <ArrowUpCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <DialogTitle>Escalate Ticket</DialogTitle>
                            <DialogDescription>
                                {ticket?.ticketId}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Warning message */}
                    <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/10">
                        <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-orange-800 dark:text-orange-300">
                            <p className="font-medium">This action will:</p>
                            <ul className="mt-1 list-disc list-inside text-orange-700 dark:text-orange-400">
                                <li>Change ticket status to &quot;Escalated&quot;</li>
                                <li>Reassign the ticket to the Department Head</li>
                                <li>Notify the creator and new assignee</li>
                            </ul>
                        </div>
                    </div>

                    {/* Reason input */}
                    <div className="space-y-2">
                        <Label htmlFor="reason" className="text-sm font-medium">
                            Reason for Escalation <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="reason"
                            placeholder="Please explain why this ticket needs to be escalated..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-[120px] resize-none"
                            disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Minimum 5 characters. This will be recorded in the ticket history.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleEscalate}
                        disabled={isLoading || !reason.trim()}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Escalating...
                            </>
                        ) : (
                            <>
                                <ArrowUpCircle className="mr-2 h-4 w-4" />
                                Escalate Ticket
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
