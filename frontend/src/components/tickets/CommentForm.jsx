'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ticketService from '@/lib/services/ticketService';
import useAuth from '@/hooks/useAuth';

export default function CommentForm({ ticketId, onCommentAdded }) {
    const { user } = useAuth();
    const [isInternal, setIsInternal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef(null);
    const { register, handleSubmit, reset, watch } = useForm({
        defaultValues: {
            text: ''
        }
    });

    const textValue = watch('text');

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.max(scrollHeight, 80)}px`;
        }
    }, [textValue]);

    // Check if current user is staff (can create internal comments)
    const isStaff = user && ['Admin', 'TeamMember', 'SuperAdmin'].includes(user.role);

    const onSubmit = async (data) => {
        // Validate non-empty text
        if (!data.text || !data.text.trim()) {
            toast.error('Comment cannot be empty');
            return;
        }

        setIsSubmitting(true);
        try {
            await ticketService.addComment(ticketId, {
                text: data.text.trim(),
                isInternal
            });
            toast.success('Comment added successfully');
            reset();
            setIsInternal(false);
            if (onCommentAdded) {
                onCommentAdded();
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
            toast.error(error.message || 'Failed to add comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
                <Textarea
                    ref={textareaRef}
                    placeholder="Add a comment..."
                    className="min-h-[80px] resize-none"
                    disabled={isSubmitting}
                    {...register('text')}
                />
            </div>

            <div className="flex items-center justify-between">
                {isStaff && (
                    <div className="flex items-center gap-3">
                        <Label htmlFor="internal-toggle" className="text-xs cursor-pointer">
                            Internal Comment
                        </Label>
                        <Switch
                            id="internal-toggle"
                            checked={isInternal}
                            onCheckedChange={setIsInternal}
                            disabled={isSubmitting}
                        />
                        {isInternal && (
                            <Badge variant="secondary" className="text-xs">
                                Staff Only
                            </Badge>
                        )}
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={isSubmitting || !textValue.trim()}
                    size="sm"
                >
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {isSubmitting ? 'Adding...' : 'Add Comment'}
                </Button>
            </div>
        </form>
    );
}
