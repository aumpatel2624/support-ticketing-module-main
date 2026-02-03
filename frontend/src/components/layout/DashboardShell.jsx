'use client';

import Sidebar from './Sidebar';
import Header from './Header';
import useUIStore from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export default function DashboardShell({ children }) {
    const { sidebarCollapsed } = useUIStore();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
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
                    sidebarCollapsed ? "md:pl-[88px]" : "md:pl-[280px]"
                )}
            >
                <Header />
                <main className="flex-1 p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto w-full">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
