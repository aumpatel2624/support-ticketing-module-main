'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, MessageSquareQuote, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

/**
 * FeedbackResultCard - Display customer feedback and rating for a ticket
 * @param {Object} ticket - Ticket object with rating, feedback, and feedbackGivenAt fields
 */
export default function FeedbackResultCard({ ticket }) {
    // Don't render if no feedback has been given
    if (!ticket?.feedbackGiven || !ticket?.rating) {
        return null;
    }

    // Render star rating display
    const renderStars = (rating) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-5 w-5 ${
                            star <= rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-muted text-muted'
                        }`}
                    />
                ))}
            </div>
        );
    };

    // Get rating label
    const getRatingLabel = (rating) => {
        const labels = {
            1: 'Poor',
            2: 'Fair',
            3: 'Good',
            4: 'Very Good',
            5: 'Excellent'
        };
        return labels[rating] || '';
    };

    return (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-green-700 dark:text-green-400 flex items-center gap-2">
                    <MessageSquareQuote className="h-4 w-4" />
                    Employee Feedback
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Star Rating */}
                <div>
                    <div className="flex items-center gap-2">
                        {renderStars(ticket.rating)}
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                            {ticket.rating}/5
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {getRatingLabel(ticket.rating)}
                    </p>
                </div>

                {/* Feedback Text */}
                {ticket.feedback && (
                    <div className="pt-2 border-t border-green-200 dark:border-green-900">
                        <p className="text-sm text-foreground leading-relaxed">
                            &quot;{ticket.feedback}&quot;
                        </p>
                    </div>
                )}

                {/* Feedback Date */}
                {ticket.feedbackGivenAt && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                        <Calendar className="h-3 w-3" />
                        <span>Submitted {formatDate(ticket.feedbackGivenAt)}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
