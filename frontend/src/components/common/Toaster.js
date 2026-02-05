'use client';

import toast, { Toaster as HotToaster, ToastBar } from 'react-hot-toast';
import { X } from 'lucide-react';

/**
 * Toast Notification Component
 * Wrapper for react-hot-toast with custom styling and click-to-dismiss
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
                    cursor: 'pointer',
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
        >
            {(t) => (
                <ToastBar toast={t}>
                    {({ icon, message }) => (
                        <div
                            className="flex items-center gap-2 w-full"
                            onClick={() => toast.dismiss(t.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    toast.dismiss(t.id);
                                }
                            }}
                        >
                            {icon}
                            <span className="flex-1">{message}</span>
                            {t.type !== 'loading' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toast.dismiss(t.id);
                                    }}
                                    className="p-1 rounded-full hover:bg-muted transition-colors shrink-0"
                                    aria-label="Dismiss"
                                >
                                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                            )}
                        </div>
                    )}
                </ToastBar>
            )}
        </HotToaster>
    );
}
