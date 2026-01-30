'use client';

import { Toaster as HotToaster } from 'react-hot-toast';

/**
 * Toast Notification Component
 * Wrapper for react-hot-toast with custom styling
 */
export default function Toaster() {
    return (
        <HotToaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
                // Default options
                duration: 4000,
                style: {
                    background: 'hsl(var(--card))',
                    color: 'hsl(var(--card-foreground))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                },
                // Success
                success: {
                    duration: 3000,
                    iconTheme: {
                        primary: 'hsl(var(--success))',
                        secondary: 'hsl(var(--success-foreground))',
                    },
                },
                // Error
                error: {
                    duration: 5000,
                    iconTheme: {
                        primary: 'hsl(var(--destructive))',
                        secondary: 'hsl(var(--destructive-foreground))',
                    },
                },
                // Loading
                loading: {
                    iconTheme: {
                        primary: 'hsl(var(--primary))',
                        secondary: 'hsl(var(--primary-foreground))',
                    },
                },
            }}
        />
    );
}
