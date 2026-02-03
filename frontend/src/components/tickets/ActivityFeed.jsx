'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { onSocketEvent, offSocketEvent, emitSocketEvent } from '@/lib/socket';
import ActivityTimeline from './ActivityTimeline';
import CommentForm from './CommentForm';
import ticketService from '@/lib/services/ticketService';
import toast from 'react-hot-toast';

export default function ActivityFeed({ ticket, onCommentAdded }) {
    const [timeline, setTimeline] = useState([]);
    const [usersMap, setUsersMap] = useState({});
    const [isRefetching, setIsRefetching] = useState(false);

    // Build unified timeline from comments and status history
    const buildTimeline = (ticketData) => {
        const items = [];

        // Add comments
        if (ticketData.comments && Array.isArray(ticketData.comments)) {
            ticketData.comments.forEach((comment) => {
                items.push({
                    type: 'comment',
                    id: comment._id,
                    timestamp: comment.createdAt,
                    data: {
                        ...comment,
                        createdBy: typeof comment.userId === 'object' ? comment.userId._id : comment.userId
                    }
                });
            });
        }

        // Add status history
        if (ticketData.statusHistory && Array.isArray(ticketData.statusHistory)) {
            ticketData.statusHistory.forEach((history) => {
                items.push({
                    type: 'status_change',
                    id: history._id,
                    timestamp: history.changedAt,
                    data: {
                        ...history,
                        createdBy: typeof history.changedBy === 'object' ? history.changedBy._id : history.changedBy,
                        newStatus: history.status
                    }
                });
            });
        }

        // Sort oldest first (natural conversation flow)
        return items.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    };

    // Build users map for quick lookup
    const buildUsersMap = (ticketData) => {
        const map = {};

        // Map from comments
        if (ticketData.comments && Array.isArray(ticketData.comments)) {
            ticketData.comments.forEach((comment) => {
                if (comment.userId && typeof comment.userId === 'object') {
                    map[comment.userId._id] = comment.userId;
                }
            });
        }

        // Map from status history
        if (ticketData.statusHistory && Array.isArray(ticketData.statusHistory)) {
            ticketData.statusHistory.forEach((history) => {
                if (history.changedBy && typeof history.changedBy === 'object') {
                    map[history.changedBy._id] = history.changedBy;
                }
            });
        }

        return map;
    };

    // Initialize timeline on mount
    useEffect(() => {
        if (ticket) {
            const newTimeline = buildTimeline(ticket);
            const newUsersMap = buildUsersMap(ticket);
            setTimeline(newTimeline);
            setUsersMap(newUsersMap);
        }
    }, [ticket]);

    // Refetch ticket data
    const refetchTicketAsync = useCallback(async () => {
        if (!ticket?._id) return;
        setIsRefetching(true);
        try {
            const response = await ticketService.getTicket(ticket._id);
            const updatedTicket = response.data || response;
            const newTimeline = buildTimeline(updatedTicket);
            const newUsersMap = buildUsersMap(updatedTicket);
            setTimeline(newTimeline);
            setUsersMap(newUsersMap);
        } catch (error) {
            toast.error('Failed to refetch ticket updates');
        } finally {
            setIsRefetching(false);
        }
    }, [ticket?._id]);

    // Setup socket listeners
    useEffect(() => {
        if (!ticket?._id) return;

        // Join ticket room
        emitSocketEvent('join_ticket', ticket._id);

        // Handle new comment socket event
        const handleNewComment = () => {
            refetchTicketAsync();
        };

        onSocketEvent('new_comment', handleNewComment);

        // Cleanup on unmount
        return () => {
            offSocketEvent('new_comment', handleNewComment);
        };
    }, [ticket?._id, refetchTicketAsync]);

    const handleCommentAdded = async () => {
        // Callback when comment form is submitted
        await refetchTicketAsync();
        if (onCommentAdded) {
            onCommentAdded();
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Comment Form */}
                <div>
                    <CommentForm
                        ticketId={ticket._id}
                        onCommentAdded={handleCommentAdded}
                    />
                </div>

                {/* Activity Timeline */}
                <div>
                    <ActivityTimeline
                        items={timeline}
                        usersMap={usersMap}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
