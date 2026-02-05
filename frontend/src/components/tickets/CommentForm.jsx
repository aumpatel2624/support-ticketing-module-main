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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isStaff && (
                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg w-fit">
                    <button
                        type="button"
                        onClick={() => setIsInternal(false)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${!isInternal
                                ? 'bg-white shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Public Reply
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsInternal(true)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${isInternal
                                ? 'bg-yellow-100 text-yellow-800 shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Internal Note
                        {isInternal && <Badge variant="outline" className="h-4 px-1 text-[9px] border-yellow-300 bg-yellow-200/50">Staff Only</Badge>}
                    </button>
                </div>
            )}

            <div className={`relative rounded-md transition-colors ${isInternal ? 'bg-yellow-50/50 p-1' : ''}`}>
                <Textarea
                    ref={textareaRef}
                    placeholder={isInternal ? "Add an internal note (visible only to staff)..." : "Type your reply to the customer..."}
                    className={`min-h-[80px] resize-none ${isInternal ? 'border-yellow-200 focus-visible:ring-yellow-400/50 bg-yellow-50/50 placeholder:text-yellow-700/40' : ''}`}
                    disabled={isSubmitting}
                    {...register('text')}
                />
            </div>

            <div className="flex items-center justify-end">
                <Button
                    type="submit"
                    disabled={isSubmitting || !textValue.trim()}
                    size="sm"
                    className={isInternal ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : ''}
                >
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {isSubmitting ? 'Sending...' : (isInternal ? 'Save Internal Note' : 'Send Reply')}
                </Button>
            </div>
        </form>
    );
}
