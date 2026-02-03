'use client';

import { useEffect } from 'react';

export default function LogSuppressor() {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const originalLog = console.log;
            const originalInfo = console.info;
            const originalWarn = console.warn;
            const originalError = console.error;

            const shouldSuppress = (args) => {
                const msg = args[0];
                if (typeof msg === 'string') {
                    if (msg.includes('[HMR]') || msg.includes('Socket.io initialized')) {
                        return true;
                    }
                }
                return false;
            };

            console.log = (...args) => {
                if (!shouldSuppress(args)) originalLog.apply(console, args);
            };

            // Also suppress info/warn/error if needed, but HMR usually comes as log or info
            console.info = (...args) => {
                if (!shouldSuppress(args)) originalInfo.apply(console, args);
            };
        }
    }, []);

    return null;
}
