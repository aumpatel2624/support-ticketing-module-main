'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Menu,
    User as UserIcon,
    LogOut,
    Settings,
    CircleUser,
    Command
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import useAuthStore from '@/store/authStore';
import { getInitials, getAvatarColor } from '@/lib/utils';
import Link from 'next/link';

export default function Header() {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    // Handle search submission
    const handleSearch = useCallback((query) => {
        if (query.trim()) {
            router.push(`/tickets?search=${encodeURIComponent(query.trim())}`);
        }
    }, [router]);

    // Handle Enter key press
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch(searchQuery);
        }
    };

    // Handle Cmd/Ctrl+K shortcut
    useEffect(() => {
        const handleShortcut = (e) => {
            if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                document.getElementById('global-search-input')?.focus();
            }
        };
        window.addEventListener('keydown', handleShortcut);
        return () => window.removeEventListener('keydown', handleShortcut);
    }, []);

    return (
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 bg-background px-6 md:px-8 border-b shadow-sm">
            {/* Mobile Menu Trigger */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0 md:hidden hover:bg-muted rounded-xl">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 border-r-0 w-[300px]">
                    <div className="h-full">
                        <Sidebar isMobile={true} />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Global Search - Functional */}
            <div className="hidden md:flex flex-1 max-w-md">
                <div className="relative group w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        id="global-search-input"
                        type="search"
                        placeholder="Search tickets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full h-11 rounded-xl bg-secondary/50 border-transparent pl-10 pr-12 focus-visible:bg-background focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded border bg-background text-[10px] font-medium text-muted-foreground">
                        <Command className="h-2.5 w-2.5" />
                        <span>K</span>
                    </div>
                </div>
            </div>

            <div className="ml-auto flex items-center gap-3 md:gap-5">
                {/* Notifications */}
                <NotificationBell />

                {/* User Profile - More Premium */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative group flex items-center gap-3 pl-1 pr-1 md:pr-4 h-12 rounded-2xl hover:bg-secondary/80 transition-all border border-transparent hover:border-border/50">
                            <div className="relative">
                                <Avatar className="h-9 w-9 border-2 border-background shadow-sm group-hover:border-primary/20 transition-all">
                                    <AvatarImage src={user?.profilePicture} alt={user?.name} />
                                    <AvatarFallback className={`${getAvatarColor(user?.name)} text-white font-bold`}>
                                        {getInitials(user?.name || 'User')}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></div>
                            </div>
                            <div className="hidden md:flex flex-col items-start leading-tight">
                                <span className="text-sm font-bold text-foreground">{user?.name}</span>
                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">{user?.role}</span>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl border-border/40 animate-in fade-in zoom-in duration-200">
                        <DropdownMenuLabel className="px-3 py-3">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-bold leading-none">{user?.name}</p>
                                <p className="text-xs font-medium text-muted-foreground truncate">{user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="opacity-50" />
                        <DropdownMenuItem asChild className="rounded-xl py-2.5 my-0.5 focus:bg-primary/5 focus:text-primary cursor-pointer">
                            <Link href="/settings/system" className="flex items-center">
                                <Settings className="mr-3 h-4 w-4" />
                                <span className="font-medium">Settings</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="opacity-50" />
                        <DropdownMenuItem onClick={logout} className="rounded-xl py-2.5 my-0.5 text-destructive focus:bg-destructive/5 focus:text-destructive cursor-pointer">
                            <LogOut className="mr-3 h-4 w-4" />
                            <span className="font-bold">Sign out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
