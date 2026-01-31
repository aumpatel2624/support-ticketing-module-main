'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { initSocket, emitSocketEvent } from '@/lib/socket';
import { Loader2 } from 'lucide-react';
import NotificationListener from '../common/NotificationListener';

const PUBLIC_PATHS = [
    '/login',
    '/forgot-password',
    '/reset-password',
    '/register',
];

export default function RouteGuard({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, token, user, isHydrated } = useAuthStore();
    const [authorized, setAuthorized] = useState(false);

    // Initialize Socket.io when user is authenticated
    useEffect(() => {
        if (isAuthenticated && token && user) {
            try {
                initSocket(token);
                console.log('Socket.io initialized');

                // Join user's personal room
                emitSocketEvent('join', user._id);

                // Join department room if applicable
                // Note: user.department might be an ID or an object depending on population
                const departmentId = typeof user.department === 'object' ? user.department?._id : user.department;
                if (departmentId) {
                    emitSocketEvent('join_department', departmentId);
                }
            } catch (error) {
                console.error('Failed to initialize Socket.io:', error);
            }
        }
    }, [isAuthenticated, token, user]);

    useEffect(() => {
        if (!isHydrated) return;

        // Function to check if the path is public
        const isPublicPath = PUBLIC_PATHS.some(path =>
            pathname === path || pathname.startsWith(`${path}/`)
        );

        function authCheck() {
            const hasAccess = isAuthenticated && !!token;
            console.log(`AuthCheck: path=${pathname}, hasAccess=${hasAccess}`);

            if (isPublicPath) {
                if (hasAccess) {
                    console.log('Redirecting to dashboard: User is already logged in.');
                    router.replace('/dashboard');
                    // We don't setAuthorized(false) here to avoid showing a loader
                    // during the brief redirection to dashboard
                } else {
                    setAuthorized(true);
                }
            } else {
                if (!hasAccess) {
                    console.log('Redirecting to login: User is not authenticated.');
                    setAuthorized(false);
                    router.replace('/login');
                } else {
                    setAuthorized(true);
                }
            }
        }

        authCheck();
    }, [pathname, isAuthenticated, token, isHydrated, router]);

    // Render loading state while hydrating or checking authorization
    if (!isHydrated) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">
                    Loading application...
                </p>
            </div>
        );
    }

    if (!authorized) {
        // If it's a public path and we are NOT logged in, we shouldn't show a spinner for long
        const isPublicPath = PUBLIC_PATHS.some(path =>
            pathname === path || pathname.startsWith(`${path}/`)
        );

        if (isPublicPath && !isAuthenticated) {
            return <>{children}</>;
        }

        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">
                    Verifying access...
                </p>
            </div>
        );
    }

    return (
        <>
            <NotificationListener />
            {children}
        </>
    );
}
