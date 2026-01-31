'use client';

import { MessageSquare, GitCommit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRelativeTime, getInitials, getAvatarColor } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import useAuth from '@/hooks/useAuth';

export default function ActivityItem({ item, user: itemUser }) {
    const { user: currentUser } = useAuth();
    const isStaff = currentUser && ['Admin', 'TeamMember', 'SuperAdmin'].includes(currentUser.role);

    // Hide internal comments from non-staff
    if (item.type === 'comment' && item.data.isInternal && !isStaff) {
        return null;
    }

    const fullName = itemUser?.name || '';
    const userInitials = getInitials(fullName);
    const avatarColor = getAvatarColor(fullName);

    return (
        <div className="flex gap-4">
            {/* Avatar */}
            <Avatar className="h-9 w-9 flex-shrink-0 mt-1">
                <AvatarImage src={itemUser?.avatar} alt={itemUser?.firstName} />
                <AvatarFallback style={{ backgroundColor: avatarColor }}>
                    {userInitials}
                </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                        {fullName || 'Unknown User'}
                    </span>

                    {/* Type Badge */}
                    {item.type === 'comment' ? (
                        <>
                            <Badge variant="outline" className="text-xs gap-1">
                                <MessageSquare className="h-3 w-3" />
                                Comment
                            </Badge>
                            {item.data.isInternal && (
                                <Badge variant="secondary" className="text-xs">
                                    Internal
                                </Badge>
                            )}
                        </>
                    ) : (
                        <Badge variant="outline" className="text-xs gap-1">
                            <GitCommit className="h-3 w-3" />
                            Status Changed
                        </Badge>
                    )}

                    <span className="text-xs text-muted-foreground ml-auto">
                        {formatRelativeTime(item.timestamp)}
                    </span>
                </div>

                {/* Comment or Status Change Content */}
                {item.type === 'comment' ? (
                    <div className="mt-2">
                        <p className="text-sm text-foreground break-words whitespace-pre-wrap">
                            {item.data.text}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(item.timestamp, 'MMM dd, yyyy HH:mm')}
                        </p>
                    </div>
                ) : (
                    <div className="mt-2">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Changed status to</span>
                            <Badge className="text-xs">
                                {item.data.newStatus}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(item.timestamp, 'MMM dd, yyyy HH:mm')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
