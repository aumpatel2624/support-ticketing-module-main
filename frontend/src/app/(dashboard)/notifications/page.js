'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import NotificationItem from '@/components/layout/NotificationItem';
import useNotificationStore from '@/store/notificationStore';
import useAuthStore from '@/store/authStore';

export default function NotificationsPage() {
    const initialized = useRef(false);
    const { notifications, unreadCount, markAllAsRead, clearNotifications, fetchNotifications } =
        useNotificationStore();
    const { user } = useAuthStore();

    // Fetch notifications on mount
    useEffect(() => {
        if (user && !initialized.current) {
            fetchNotifications();
            initialized.current = true;
        }
    }, [user, fetchNotifications]);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                        <p className="text-sm text-muted-foreground">
                            Stay updated with your latest activities
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2">
                            {unreadCount} unread
                        </Badge>
                    )}
                </div>

                {/* Action Buttons */}
                {notifications.length > 0 && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAllAsRead()}
                            disabled={unreadCount === 0}
                            className="gap-2"
                        >
                            <CheckCheck className="h-4 w-4" />
                            Mark all read
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => clearNotifications()}
                            className="gap-2 text-destructive hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                            Clear all
                        </Button>
                    </div>
                )}
            </div>

            {/* Notifications List */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">All Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                    {notifications.length > 0 ? (
                        <ScrollArea className="h-[calc(100vh-300px)] min-h-[400px]">
                            <div className="space-y-2 pr-4">
                                {notifications.map((notification) => (
                                    <NotificationItem
                                        key={notification._id}
                                        notification={notification}
                                        onClose={() => {}}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                                <Bell className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-lg font-medium text-muted-foreground">
                                No notifications yet
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                You&apos;re all caught up! New notifications will appear here.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
