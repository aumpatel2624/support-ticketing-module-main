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

    const recentNotifications = notifications.slice(0, 10);

    return (
        <div className="flex flex-col h-[400px] w-[380px]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
                <div>
                    <h3 className="font-bold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="mt-1">
                            {unreadCount} unread
                        </Badge>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            <ScrollArea className="flex-1 px-3 py-3">
                {recentNotifications.length > 0 ? (
                    <div className="space-y-2 pr-4">
                        {recentNotifications.map((notification) => (
                            <NotificationItem
                                key={notification._id}
                                notification={notification}
                                onClose={onClose}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-32">
                        <p className="text-sm text-muted-foreground">No notifications</p>
                    </div>
                )}
            </ScrollArea>

            {/* Footer Actions */}
            {notifications.length > 0 && (
                <div className="flex gap-2 px-4 py-3 border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => markAllAsRead()}
                        disabled={unreadCount === 0}
                    >
                        Mark all as read
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => clearNotifications()}
                    >
                        Clear all
                    </Button>
                </div>
            )}
        </div>
    );
}
