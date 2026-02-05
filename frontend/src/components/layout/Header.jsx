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
                {/* User Profile moved to Sidebar */}
            </div>
        </header>
    );
}
