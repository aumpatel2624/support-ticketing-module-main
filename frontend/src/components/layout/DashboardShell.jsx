'use client';

import Sidebar from './Sidebar';
import Header from './Header';
import useUIStore from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function DashboardShell({ children }) {
    const { sidebarCollapsed } = useUIStore();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    // Handle responsive sidebar behavior
    useEffect(() => {
        setMounted(true);

        const handleResize = () => {
            if (window.innerWidth >= 768 && window.innerWidth < 1024) {
                useUIStore.getState().setSidebarCollapsed(true);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background relative">
            {/* Desktop Sidebar */}
            <div className="hidden md:block fixed inset-y-0 z-40">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div
                className={cn(
                    "flex flex-col min-h-screen transition-all duration-500 ease-in-out",
                    sidebarCollapsed ? "md:pl-[88px]" : "md:pl-[200px]"
                )}
            >
                {!pathname.includes('/tickets') && <Header />}
                <main className="flex-1 w-full h-full">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
