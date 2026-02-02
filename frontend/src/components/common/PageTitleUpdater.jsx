'use client';

import { useEffect } from 'react';
import useSettingsStore from '@/store/settingsStore';

export default function PageTitleUpdater() {
    const { systemSettings, fetchPublicSettings } = useSettingsStore();

    useEffect(() => {
        // Initial fetch of public settings (company name, etc.)
        fetchPublicSettings();
    }, [fetchPublicSettings]);

    useEffect(() => {
        if (systemSettings?.companyName) {
            document.title = `${systemSettings.companyName} | Ticketing System`;
        }
    }, [systemSettings?.companyName]);

    return null; // This component doesn't render anything
}
