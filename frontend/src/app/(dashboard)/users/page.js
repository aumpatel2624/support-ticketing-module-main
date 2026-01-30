'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { createColumns } from './columns';
import { UserDataTableToolbar } from './user-data-table-toolbar';
import PageHeader from '@/components/common/PageHeader';
import CreateUserDialog from '@/components/settings/CreateUserDialog';
import EditUserDialog from '@/components/settings/EditUserDialog';
import userService from '@/lib/services/userService';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editUser, setEditUser] = useState(null);
    const [deleteUser, setDeleteUser] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [deleteReferences, setDeleteReferences] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
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
        fetchUsers();
    };

    const handleUserUpdated = () => {
        fetchUsers();
        setEditUser(null);
    };

    const handleDeleteUser = async () => {
        setIsDeleting(true);
        setDeleteError(null);
        setDeleteReferences(null);
        try {
            await userService.deleteUser(deleteUser._id);
            toast.success('User deactivated successfully');
            setDeleteUser(null);
            setDeleteError(null);
            setDeleteReferences(null);
            fetchUsers();
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to deactivate user';
            const references = error.response?.data?.references || null;
            setDeleteError(errorMessage);
            setDeleteReferences(references);
            // Keep the dialog open to show the error and references
        } finally {
            setIsDeleting(false);
        }
    };

    const columns = useMemo(
        () => createColumns(setEditUser, setDeleteUser),
        []
    );

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

            <EditUserDialog
                user={editUser}
                open={!!editUser}
                onOpenChange={(open) => !open && setEditUser(null)}
                onUserUpdated={handleUserUpdated}
            />

            <ConfirmDialog
                open={!!deleteUser}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteUser(null);
                        setDeleteError(null);
                        setDeleteReferences(null);
                    }
                }}
                title="Deactivate User"
                description={`Are you sure you want to deactivate "${deleteUser?.name}"? They will no longer be able to access the system.`}
                confirmText="Deactivate"
                variant="destructive"
                onConfirm={handleDeleteUser}
                isLoading={isDeleting}
                error={deleteError}
                references={deleteReferences}
            />
        </div>
    );
}
