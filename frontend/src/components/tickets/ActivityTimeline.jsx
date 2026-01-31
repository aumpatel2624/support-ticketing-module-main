'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import ActivityItem from './ActivityItem';

export default function ActivityTimeline({ items, usersMap = {} }) {
    if (!items || items.length === 0) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                No activity yet
            </div>
        );
    }

    return (
        <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-6">
                {items.map((item) => (
                    <div key={item.id} className="relative">
                        {/* Timeline connector line */}
                        <div className="absolute left-[17px] top-9 bottom-0 w-0.5 bg-border" />

                        <ActivityItem
                            item={item}
                            user={usersMap[item.data.createdBy] || {}}
                        />
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
