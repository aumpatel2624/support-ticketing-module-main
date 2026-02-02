'use client';

import { useState, useEffect } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getInitials, getAvatarColor } from '@/lib/utils';
import userService from '@/lib/services/userService';
import toast from 'react-hot-toast';
import { USER_ROLES } from '@/lib/constants';

export default function AssignTicketModal({
    isOpen,
    onClose,
    onAssign,
    isLoading,
    title = 'Assign Ticket',
    description = 'Select a team member or head to assign this ticket to',
    currentAssignee = null
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isFetchingUsers, setIsFetchingUsers] = useState(false);

    // Fetch users on mount
    useEffect(() => {
        if (isOpen && users.length === 0) {
            fetchUsers();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            setIsFetchingUsers(true);
            const response = await userService.getUsers();
            let usersData = response;
            if (response.data) usersData = response.data;
            if (response.users) usersData = response.users;

            // Filter to show only Admins (heads) and TeamMembers
            const assignableUsers = usersData.filter(user =>
                user.role === USER_ROLES.ADMIN ||
                user.role === USER_ROLES.TEAM_MEMBER ||
                user.role === USER_ROLES.SUPER_ADMIN
            );

            setUsers(assignableUsers);
            setFilteredUsers(assignableUsers);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to load users');
        } finally {
            setIsFetchingUsers(false);
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setFilteredUsers(users);
        } else {
            const filtered = users.filter(user =>
                user.name?.toLowerCase().includes(query.toLowerCase()) ||
                user.email?.toLowerCase().includes(query.toLowerCase()) ||
                user.employeeId?.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    };

    const handleAssign = async () => {
        if (!selectedUser) {
            toast.error('Please select a user');
            return;
        }
        await onAssign(selectedUser);
        handleClose();
    };

    const handleClose = () => {
        setSearchQuery('');
        setSelectedUser(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>

                {/* Current Assignee Info */}
                {currentAssignee && (
                    <div className="text-sm bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-700">
                            <strong>Currently assigned to:</strong> {currentAssignee.name || 'Unknown'}
                        </p>
                    </div>
                )}

                <div className="space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, or ID..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10"
                            disabled={isFetchingUsers || isLoading}
                        />
                    </div>

                    {/* Users List */}
                    {isFetchingUsers ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : filteredUsers.length > 0 ? (
                        <ScrollArea className="h-64 border rounded-lg p-2">
                            <div className="space-y-2">
                                {filteredUsers.map((user) => (
                                    <button
                                        key={user._id}
                                        onClick={() => setSelectedUser(user)}
                                        className={`w-full p-3 rounded-lg flex items-center gap-3 text-left transition-colors ${selectedUser?._id === user._id
                                            ? 'bg-primary/10 border border-primary'
                                            : 'hover:bg-muted border border-transparent'
                                            }`}
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className={`text-xs ${getAvatarColor(user.name)}`}>
                                                {getInitials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                {user.department?.name && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">
                                                        {user.department.name}
                                                    </span>
                                                )}
                                                <p className="font-medium text-sm truncate">{user.name}</p>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                                                    {user.role === USER_ROLES.SUPER_ADMIN ? 'Super Admin' :
                                                        user.role === USER_ROLES.ADMIN ? 'Head' : 'Team Member'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                        {selectedUser?._id === user._id && (
                                            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                                <span className="text-white text-xs">✓</span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">
                            {searchQuery ? 'No users found' : 'No users available'}
                        </div>
                    )}

                    {/* Selected User Display */}
                    {selectedUser && (
                        <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className={`text-xs ${getAvatarColor(selectedUser.name)}`}>
                                    {getInitials(selectedUser.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    {selectedUser.department?.name && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">
                                            {selectedUser.department.name}
                                        </span>
                                    )}
                                    <p className="font-medium text-sm">{selectedUser.name}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleAssign} disabled={!selectedUser || isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Assigning...
                            </>
                        ) : (
                            'Assign'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
