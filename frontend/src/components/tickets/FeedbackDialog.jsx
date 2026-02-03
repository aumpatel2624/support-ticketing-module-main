'use client';

import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import StarRating from './StarRating';
import ConfirmStatusChangeModal from './ConfirmStatusChangeModal';
import ticketService from '@/lib/services/ticketService';

export default function FeedbackDialog({
    open,
    onOpenChange,
    ticketId,
    ticketSubject,
    onFeedbackSubmitted
}) {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [action, setAction] = useState('close'); // 'close' or 'reopen'
    const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
    const [pendingFeedbackSubmit, setPendingFeedbackSubmit] = useState(null);

    const handleSubmitClick = (selectedAction) => {
        if (!rating) {
            toast.error('Please select a rating');
            return;
        }

        if (!feedback.trim()) {
            toast.error('Please provide feedback');
            return;
        }

        // Show confirmation modal
        setPendingFeedbackSubmit(selectedAction);
        setShowStatusConfirmModal(true);
    };

    const handleSubmit = async () => {
        if (!pendingFeedbackSubmit) return;

        const selectedAction = pendingFeedbackSubmit;

        setIsSubmitting(true);
        try {
            await ticketService.submitFeedback(ticketId, {
                rating,
                feedback: feedback.trim(),
                action: selectedAction
            });

            toast.success(
                selectedAction === 'close'
                    ? 'Feedback submitted and ticket closed'
                    : 'Ticket reopened for further work'
            );

            // Reset form
            setRating(0);
            setFeedback('');
            setAction('close');
            onOpenChange(false);

            if (onFeedbackSubmitted) {
                onFeedbackSubmitted();
            }
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            toast.error(error.message || 'Failed to submit feedback');
        } finally {
            setIsSubmitting(false);
            setShowStatusConfirmModal(false);
            setPendingFeedbackSubmit(null);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        How satisfied are you with the resolution?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Please rate the ticket resolution and provide your feedback
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 py-4">
                    {/* Star Rating */}
                    <div>
                        <label className="text-sm font-medium block mb-2">
                            Rating
                        </label>
                        <StarRating
                            rating={rating}
                            onRatingChange={setRating}
                            disabled={isSubmitting}
                        />
                        {rating > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Rating: {rating} out of 5 stars
                            </p>
                        )}
                    </div>

                    {/* Feedback Text */}
                    <div>
                        <label className="text-sm font-medium block mb-2">
                            Feedback
                        </label>
                        <Textarea
                            placeholder="Tell us about your experience and the quality of the resolution..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            disabled={isSubmitting}
                            className="min-h-[100px] resize-none"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {feedback.length}/500 characters
                        </p>
                    </div>

                    {/* Action Selection */}
                    <div>
                        <label className="text-sm font-medium block mb-2">
                            What would you like to do?
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setAction('close')}
                                disabled={isSubmitting}
                                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                    action === 'close'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                } disabled:opacity-50`}
                            >
                                ✓ Close Ticket
                            </button>
                            <button
                                type="button"
                                onClick={() => setAction('reopen')}
                                disabled={isSubmitting}
                                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                    action === 'reopen'
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                } disabled:opacity-50`}
                            >
                                ↻ Reopen Ticket
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {action === 'close'
                                ? 'The ticket will be closed and marked as resolved'
                                : 'The ticket will be reopened and assigned back to the team'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 justify-end">
                    <AlertDialogCancel disabled={isSubmitting}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        disabled={isSubmitting || !rating || !feedback.trim()}
                        onClick={() => handleSubmitClick(action)}
                        className={action === 'reopen' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                    >
                        {isSubmitting && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                    </AlertDialogAction>
                </div>
            </AlertDialogContent>

            {/* Status Change Confirmation Modal */}
            <ConfirmStatusChangeModal
                isOpen={showStatusConfirmModal}
                onClose={() => {
                    setShowStatusConfirmModal(false);
                    setPendingFeedbackSubmit(null);
                }}
                onConfirm={handleSubmit}
                isLoading={isSubmitting}
                ticketSubject={ticketSubject}
                currentStatus="Completed"
                newStatus={pendingFeedbackSubmit === 'close' ? 'Closed' : 'Reopened'}
            />
        </AlertDialog>
    );
}
