'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import NotificationItem from './NotificationItem';
import useNotificationStore from '@/store/notificationStore';

/**
 * NotificationList - List of recent notifications
 */
export default function NotificationList({ onClose }) {
    const { notifications, unreadCount, markAllAsRead, clearNotifications } =
        useNotificationStore();

    const recentNotifications = notifications;

    return (
        <div className="flex flex-col h-[500px] max-h-[500px] w-full bg-background">
            {/* Header */}
            <div className="px-4 py-3 border-b flex-shrink-0">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <h3 className="font-bold text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="mt-2">
                                {unreadCount} unread
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Notifications List - Scrollable */}
            {recentNotifications.length > 0 ? (
                <ScrollArea className="flex-1 min-h-0 w-full">
                    <div className="px-3 py-3 space-y-2">
                        {recentNotifications.map((notification) => (
                            <NotificationItem
                                key={notification._id}
                                notification={notification}
                                onClose={onClose}
                            />
                        ))}
                    </div>
                </ScrollArea>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                            No notifications yet
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            You&apos;re all caught up!
                        </p>
                    </div>
                </div>
            )}

            {/* Footer Actions */}
            {notifications.length > 0 && (
                <div className="px-3 py-3 border-t flex-shrink-0 flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => markAllAsRead()}
                        disabled={unreadCount === 0}
                    >
                        Mark all read
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => clearNotifications()}
                    >
                        Clear all
                    </Button>
                </div>
            )}
        </div>
    );
}
