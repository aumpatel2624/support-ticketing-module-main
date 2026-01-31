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

    const ticketId = typeof notification.ticketId === 'object'
        ? notification.ticketId?._id?.toString()
        : notification.ticketId?.toString();

    const href = ticketId ? `/tickets/${ticketId}` : '#';

    return (
        <div
            className={`flex gap-3 p-3 rounded-lg border transition-all cursor-pointer ${notification.isRead
                ? 'bg-background border-border hover:border-primary/40'
                : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                } group`}
            onClick={handleMarkAsRead}
        >
            {/* Icon */}
            <div className="shrink-0 mt-1">
                {getNotificationIcon(notification.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-start gap-2 mb-1 flex-wrap">
                    <Badge
                        variant="outline"
                        className={`text-xs flex-shrink-0 ${getTypeColor(notification.type)}`}
                    >
                        {notification.type.replace(/([A-Z])/g, ' $1').trim()}
                    </Badge>
                </div>

                {notification.ticketId ? (
                    <Link
                        href={href}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose?.();
                        }}
                        className="text-sm font-medium text-foreground hover:underline break-words line-clamp-2 block"
                    >
                        {notification.message}
                    </Link>
                ) : (
                    <p className="text-sm font-medium text-foreground break-words line-clamp-2">
                        {notification.message}
                    </p>
                )}

                <p className="text-xs text-muted-foreground mt-1.5">
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
