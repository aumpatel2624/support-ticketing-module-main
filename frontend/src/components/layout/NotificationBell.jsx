'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import NotificationList from './NotificationList';
import useNotificationStore from '@/store/notificationStore';
import useAuthStore from '@/store/authStore';

/**
 * NotificationBell - Bell icon with notifications dropdown
 */
export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const initialized = useRef(false);
    const { unreadCount, fetchNotifications } = useNotificationStore();
    const { user } = useAuthStore();

    // Fetch notifications on mount
    useEffect(() => {
        if (user && !initialized.current) {
            fetchNotifications();
            initialized.current = true;
        }
    }, [user, fetchNotifications]);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <>
                            <span className="absolute right-2.5 top-2.5 h-2 w-2 flex">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                            </span>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[400px] h-[520px]" align="end">
                <NotificationList onClose={() => setIsOpen(false)} />
            </PopoverContent>
        </Popover>
    );
}
