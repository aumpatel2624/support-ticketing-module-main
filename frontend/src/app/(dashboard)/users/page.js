'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import { UserDataTableToolbar } from './user-data-table-toolbar';
import PageHeader from '@/components/common/PageHeader';
import CreateUserDialog from '@/components/settings/CreateUserDialog';
import userService from '@/lib/services/userService';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuthStore();
    const isSuperAdmin = user?.role === 'SuperAdmin';

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const output = await userService.getUsers();
            // Handle response structure { data: [...], ... }
            let list = [];
            if (output.data && Array.isArray(output.data)) list = output.data;
            else if (Array.isArray(output)) list = output;

            setUsers(list);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUserCreated = () => {
        fetchUsers(); // Refresh list
    };

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <PageHeader
                heading="User Management"
                text="Manage system users, roles, and permissions."
            >
                {isSuperAdmin && <CreateUserDialog onUserCreated={handleUserCreated} />}
            </PageHeader>

            <div className="flex-1">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <DataTable
                        data={users}
                        columns={columns}
                        toolbar={UserDataTableToolbar}
                    />
                )}
            </div>
        </div>
    );
}
