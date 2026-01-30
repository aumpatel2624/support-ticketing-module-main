'use client';

import Link from 'next/link';
import { X, AlertCircle, CheckCircle2, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import useNotificationStore from '@/store/notificationStore';

/**
 * NotificationItem - Individual notification in the dropdown
 */
export default function NotificationItem({ notification, onClose }) {
    const { markAsRead, removeNotification } = useNotificationStore();

    const handleMarkAsRead = () => {
        if (!notification.isRead) {
            markAsRead(notification._id);
        }
    };

    const handleRemove = (e) => {
        e.stopPropagation();
        removeNotification(notification._id);
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'SLAWarning':
            case 'TicketEscalated':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'StatusUpdated':
            case 'TicketCreated':
            case 'TicketAssigned':
                return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
            case 'NewComment':
                return <Inbox className="h-4 w-4 text-green-500" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'SLAWarning':
            case 'TicketEscalated':
                return 'bg-red-500/10 text-red-700';
            case 'StatusUpdated':
            case 'TicketCreated':
            case 'TicketAssigned':
                return 'bg-blue-500/10 text-blue-700';
            case 'NewComment':
                return 'bg-green-500/10 text-green-700';
            default:
                return 'bg-gray-500/10 text-gray-700';
        }
    };

    const href = notification.ticketId ? `/tickets/${notification.ticketId}` : '#';

    return (
        <div
            className={`flex gap-3 p-3 rounded-lg border transition-all ${
                notification.isRead
                    ? 'bg-background border-border'
                    : 'bg-primary/5 border-primary/20'
            } hover:bg-muted group`}
            onClick={handleMarkAsRead}
        >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                    <Badge variant="outline" className={`text-xs ${getTypeColor(notification.type)}`}>
                        {notification.type}
                    </Badge>
                </div>

                {notification.ticketId ? (
                    <Link
                        href={href}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose?.();
                        }}
                        className="text-sm font-medium text-foreground hover:underline break-words"
                    >
                        {notification.message}
                    </Link>
                ) : (
                    <p className="text-sm font-medium text-foreground break-words">
                        {notification.message}
                    </p>
                )}

                <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                    })}
                </p>
            </div>

            {/* Close Button */}
            <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleRemove}
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
}
