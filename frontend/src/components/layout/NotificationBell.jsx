'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from '@/components/ui/sheet';
import NotificationList from './NotificationList';
import useNotificationStore from '@/store/notificationStore';
import useAuthStore from '@/store/authStore';

/**
 * NotificationBell - Bell icon with notifications dropdown
 */
export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const initialized = useRef(false);
    const { unreadCount, fetchNotifications } = useNotificationStore();
    const { user } = useAuthStore();

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640); // sm breakpoint
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fetch notifications on mount
    useEffect(() => {
        if (user && !initialized.current) {
            fetchNotifications();
            initialized.current = true;
        }
    }, [user, fetchNotifications]);

    const TriggerButton = (
        <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
        >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2.5 w-2.5 flex">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
                </span>
            )}
            <span className="sr-only">Notifications</span>
        </Button>
    );

    // Mobile: Sheet (slide-in drawer)
    if (isMobile) {
        return (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    {TriggerButton}
                </SheetTrigger>
                <SheetContent side="right" className="p-0 w-full max-w-[320px]">
                    <NotificationList onClose={() => setIsOpen(false)} />
                </SheetContent>
            </Sheet>
        );
    }

    // Desktop: Popover
    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                {TriggerButton}
            </PopoverTrigger>
            <PopoverContent
                className="p-0 w-[400px] h-[500px]"
                align="end"
                sideOffset={8}
            >
                <NotificationList onClose={() => setIsOpen(false)} />
            </PopoverContent>
        </Popover>
    );
}

