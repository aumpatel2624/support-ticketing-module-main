'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Ticket,
    Plus,
    User,
    ClipboardList,
    Building,
    Users,
    BarChart3,
    Settings,
    Building2,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Zap,
    Tags,
    Bell,
    Lock,
} from 'lucide-react';
import Image from 'next/image';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getAvatarColor } from '@/lib/utils';


import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import useAuthStore from '@/store/authStore';
import useAuth from '@/hooks/useAuth';
import useUIStore from '@/store/uiStore';
import useSettingsStore from '@/store/settingsStore';
import useNotificationStore from '@/store/notificationStore';
import { NAVIGATION_ITEMS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';

// Map icon strings to components
const IconMap = {
    LayoutDashboard,
    Ticket,
    Plus,
    User,
    ClipboardList,
    Building,
    Users,
    BarChart3,
    Settings,
    Building2,
    Tags,
    Bell,
};

export default function Sidebar({ isMobile = false }) {
    const pathname = usePathname();
    const { user } = useAuthStore();
    const { logout } = useAuth();
    const { sidebarCollapsed, toggleSidebar } = useUIStore();
    const { systemSettings, fetchSystemSettings } = useSettingsStore();

    // Fetch system settings on mount
    // Fetch system settings on mount (SuperAdmin only)
    useEffect(() => {
        if (user?.role === 'SuperAdmin') {
            fetchSystemSettings().catch(() => { });
        }
    }, [fetchSystemSettings, user?.role]);

    // Force expanded if mobile, otherwise use store state
    const isCollapsed = isMobile ? false : sidebarCollapsed;

    // Get company name from settings
    const companyName = systemSettings?.companyName || 'Support';

    // Get navigation items based on user role
    const navItems = user?.role && NAVIGATION_ITEMS[user.role]
        ? NAVIGATION_ITEMS[user.role]
        : [];

    // Get unread notification count
    const { unreadCount } = useNotificationStore();

    return (
        <div
            className={cn(
                "relative flex flex-col border-r bg-card transition-all duration-500 ease-in-out overflow-hidden",
                isMobile ? "h-[100dvh] w-full border-none" : (isCollapsed ? "h-full w-[88px]" : "h-full w-[200px]")
            )}
        >
            {/* Sidebar Header - Premium User Profile */}
            <div className={cn(
                "flex items-center gap-3 h-20 border-b/50 shrink-0 transition-all duration-300",
                isCollapsed ? "justify-center px-2" : "px-4"
            )}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className={cn(
                            "relative group flex items-center h-14 rounded-2xl hover:bg-secondary/80 transition-all border border-transparent hover:border-border/50 p-1",
                            isCollapsed ? "w-12 justify-center" : "w-full justify-start gap-3 md:pr-4"
                        )}>
                            <div className="relative shrink-0">
                                <Avatar className="h-10 w-10 border-2 border-background shadow-sm group-hover:border-primary/20 transition-all">
                                    <AvatarImage src={user?.profilePicture} alt={user?.name} />
                                    <AvatarFallback className={`${getAvatarColor(user?.name)} text-white font-bold`}>
                                        {getInitials(user?.name || 'User')}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></div>
                            </div>
                            {!isCollapsed && (
                                <div className="flex flex-col items-start leading-tight overflow-hidden">
                                    <span className="text-sm font-bold text-foreground truncate w-full">{user?.name}</span>
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">{user?.role}</span>
                                </div>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isCollapsed ? "start" : "center"} side={isCollapsed ? "right" : "bottom"} className="w-64 p-2 rounded-2xl shadow-2xl border-border/40 animate-in fade-in zoom-in duration-200 z-[50]">
                        <DropdownMenuLabel className="px-3 py-3">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-bold leading-none">{user?.name}</p>
                                <p className="text-xs font-medium text-muted-foreground truncate">{user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="opacity-50" />
                        <DropdownMenuItem asChild className="rounded-xl py-2.5 my-0.5 focus:bg-primary/5 focus:text-primary cursor-pointer">
                            <Link href="/settings/security" prefetch={false} className="flex items-center">
                                <Lock className="mr-3 h-4 w-4" />
                                <span className="font-medium">Change Password</span>
                            </Link>
                        </DropdownMenuItem>
                        {user?.role === 'SuperAdmin' && (
                            <DropdownMenuItem asChild className="rounded-xl py-2.5 my-0.5 focus:bg-primary/5 focus:text-primary cursor-pointer">
                                <Link href="/settings/system" prefetch={false} className="flex items-center">
                                    <Settings className="mr-3 h-4 w-4" />
                                    <span className="font-medium">System Settings</span>
                                </Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="opacity-50" />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Collapse/Expand Button - Centered on sidebar */}
            {!isMobile && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 bg-background border shadow-sm z-10 rounded-full hover:bg-muted"
                    onClick={toggleSidebar}
                >
                    {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
                </Button>
            )}

            {/* Navigation Items */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <ScrollArea className="h-full py-6">
                    <nav className="grid gap-2 px-4">
                        <TooltipProvider delayDuration={0}>
                            {navItems.map((item, index) => {
                                const Icon = IconMap[item.icon] || Ticket;

                                // Check for nested items
                                if (item.items && item.items.length > 0) {
                                    // For nested items, check if any child is active to expand/highlight parent
                                    const isChildActive = item.items.some(subItem => pathname === subItem.href);

                                    // Render collapsed state (icon only) differently than expanded
                                    if (isCollapsed) {
                                        return (
                                            <Tooltip key={index}>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className={cn(
                                                            "w-12 h-12 p-0 justify-center mx-auto mb-2",
                                                            isChildActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
                                                        )}
                                                        onClick={() => !isMobile && toggleSidebar()} // Expand on click if collapsed
                                                    >
                                                        <Icon className="h-5 w-5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="right" className="flex flex-col gap-1 p-2">
                                                    <div className="font-semibold pb-1 border-b mb-1">{item.name}</div>
                                                    {item.items.map((subItem, subIndex) => (
                                                        <Link
                                                            key={subIndex}
                                                            href={subItem.href}
                                                            prefetch={false}
                                                            className={cn(
                                                                "text-xs px-2 py-1 rounded block w-full text-left transition-colors",
                                                                pathname === subItem.href
                                                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                                                    : "hover:bg-accent hover:text-accent-foreground"
                                                            )}
                                                        >
                                                            {subItem.name}
                                                        </Link>
                                                    ))}
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    }

                                    // Expanded state: Render as simple list with indentation for now to avoid complexity of full accordion
                                    // or assume user wants simple grouping. Let's do a simple grouping details/summary or custom collapsible
                                    return (
                                        <div key={index} className="mb-2">
                                            <div className="px-3.5 py-2 text-sm font-semibold text-muted-foreground flex items-center gap-3">
                                                <Icon className="h-4 w-4" />
                                                <span>{item.name}</span>
                                            </div>
                                            <div className="flex flex-col gap-1 pl-4 mt-1 border-l ml-5">
                                                {item.items.map((subItem, subIndex) => {
                                                    const isSubActive = pathname === subItem.href;
                                                    return (
                                                        <Link
                                                            key={subIndex}
                                                            href={subItem.href}
                                                            prefetch={false}
                                                            className={cn(
                                                                "group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                                                                isSubActive
                                                                    ? "bg-primary/10 text-primary font-medium"
                                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                            )}
                                                        >
                                                            <span>{subItem.name}</span>
                                                            {isSubActive && (
                                                                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                                                            )}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                }

                                // Regular Item Rendering
                                // Check if current pathname matches a nav item exactly (for sibling routes)
                                const hasExactMatch = navItems.some(navItem => pathname === navItem.href);
                                // Only match parent routes if there's no exact match (prevents parent highlighting when child route exists)
                                const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/dashboard') || (!hasExactMatch && item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));

                                return (
                                    <Tooltip key={index}>
                                        <TooltipTrigger asChild>
                                            <Link
                                                href={item.href}
                                                prefetch={false}
                                                className={cn(
                                                    "group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-300",
                                                    isActive
                                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                                        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
                                                    isCollapsed && "justify-center px-0 w-12 mx-auto"
                                                )}
                                            >
                                                <Icon className={cn(
                                                    "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
                                                    isActive ? "text-white" : "text-muted-foreground group-hover:text-primary"
                                                )} />
                                                {!isCollapsed && (
                                                    <span className="truncate">{item.name}</span>
                                                )}
                                                {/* Notification dot for Notifications item */}
                                                {item.name === 'Notifications' && unreadCount > 0 && (
                                                    <span
                                                        className={cn(
                                                            "h-2.5 w-2.5 rounded-full bg-destructive",
                                                            isCollapsed ? "absolute -top-0.5 -right-0.5" : "ml-auto"
                                                        )}
                                                    />
                                                )}
                                                {isActive && !isCollapsed && item.name !== 'Notifications' && (
                                                    <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                                )}
                                            </Link>
                                        </TooltipTrigger>
                                        {isCollapsed && (
                                            <TooltipContent side="right" className="font-medium">
                                                {item.name}
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                );
                            })}
                        </TooltipProvider>
                    </nav>
                </ScrollArea>
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 mt-auto shrink-0 border-t/50 bg-secondary/30">
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start gap-3 rounded-xl py-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all",
                                    isCollapsed && "justify-center px-0 w-12 mx-auto"
                                )}
                                onClick={logout}
                            >
                                <LogOut className="h-5 w-5 shrink-0" />
                                {!isCollapsed && <span className="font-semibold">Logout</span>}
                            </Button>
                        </TooltipTrigger>
                        {isCollapsed && (
                            <TooltipContent side="right" className="bg-destructive text-destructive-foreground">
                                Logout
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
}
