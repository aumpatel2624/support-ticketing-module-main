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
    // Building2
} from 'lucide-react';
import Image from 'next/image';


import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import useAuthStore from '@/store/authStore';
import useUIStore from '@/store/uiStore';
import useSettingsStore from '@/store/settingsStore';
import { NAVIGATION_ITEMS } from '@/lib/constants';

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
};

export default function Sidebar({ isMobile = false }) {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const { sidebarCollapsed, toggleSidebar } = useUIStore();
    const { systemSettings, fetchSystemSettings } = useSettingsStore();

    // Fetch system settings on mount
    useEffect(() => {
        fetchSystemSettings().catch(() => { });
    }, []);

    // Force expanded if mobile, otherwise use store state
    const isCollapsed = isMobile ? false : sidebarCollapsed;

    // Get company name from settings
    const companyName = systemSettings?.companyName || 'Support';

    // Get navigation items based on user role
    const navItems = user?.role && NAVIGATION_ITEMS[user.role]
        ? NAVIGATION_ITEMS[user.role]
        : [];

    return (
        <div
            className={cn(
                "relative flex flex-col h-full border-r bg-card transition-all duration-500 ease-in-out",
                isMobile ? "w-full border-none" : (isCollapsed ? "w-[88px]" : "w-[280px]")
            )}
        >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-6 h-20 border-b/50 shrink-0">
                <div className={cn("flex flex-col items-center justify-center transition-all duration-300", isCollapsed ? "h-12 w-12" : "h-12 w-full max-w-[180px]")}>
                    <Image
                        src={systemSettings?.companyLogo || "/logo.webp"}
                        alt={`${companyName} Logo`}
                        width={180}
                        height={40}
                        className="object-contain"
                        priority
                        unoptimized
                    />
                    {!isCollapsed && companyName !== 'Support' && (
                        <span className="mt-1 text-xs font-semibold text-muted-foreground tracking-wide truncate max-w-full">
                            {companyName}
                        </span>
                    )}
                </div>
                {!isMobile && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-8 w-8 hover:bg-muted rounded-lg transition-all",
                            isCollapsed ? "mx-auto" : "ml-auto"
                        )}
                        onClick={toggleSidebar}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </Button>
                )}
            </div>

            {/* Navigation Items */}
            <ScrollArea className="flex-1 py-6">
                <nav className="grid gap-2 px-4">
                    <TooltipProvider delayDuration={0}>
                        {navItems.map((item, index) => {
                            const Icon = IconMap[item.icon] || Ticket;
                            // Check if current pathname matches a nav item exactly (for sibling routes)
                            const hasExactMatch = navItems.some(navItem => pathname === navItem.href);
                            // Only match parent routes if there's no exact match (prevents parent highlighting when child route exists)
                            const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/dashboard') || (!hasExactMatch && item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));

                            return (
                                <Tooltip key={index}>
                                    <TooltipTrigger asChild>
                                        <Link
                                            href={item.href}
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
                                            {isActive && !isCollapsed && (
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
