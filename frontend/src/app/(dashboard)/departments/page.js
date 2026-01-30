'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { createColumns } from './columns';
import CreateDepartmentDialog from '@/components/settings/CreateDepartmentDialog';
import EditDepartmentDialog from '@/components/settings/EditDepartmentDialog';
import departmentService from '@/lib/services/departmentService';
import toast from 'react-hot-toast';

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editDepartment, setEditDepartment] = useState(null);
    const [deleteDepartment, setDeleteDepartment] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchDepartments = async () => {
        try {
            setIsLoading(true);
            const output = await departmentService.getDepartments();
            // Handle response
            let list = [];
            if (output.data && Array.isArray(output.data)) list = output.data;
            else if (Array.isArray(output)) list = output;

            setDepartments(list);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
            toast.error('Failed to load departments');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleDepartmentCreated = () => {
        fetchDepartments();
    };

    const handleDepartmentUpdated = () => {
        fetchDepartments();
        setEditDepartment(null);
    };

    const handleDeleteDepartment = async () => {
        setIsDeleting(true);
        setDeleteError(null);
        try {
            await departmentService.deleteDepartment(deleteDepartment._id);
            toast.success('Department deleted successfully');
            setDeleteDepartment(null);
            setDeleteError(null);
            fetchDepartments();
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to delete department';
            setDeleteError(errorMessage);
            // Keep the dialog open to show the error
        } finally {
            setIsDeleting(false);
        }
    };

    const columns = useMemo(
        () => createColumns(setEditDepartment, setDeleteDepartment),
        []
    );

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <PageHeader
                heading="Departments"
                text="Configure organizational structure and teams."
            >
                <CreateDepartmentDialog onDepartmentCreated={handleDepartmentCreated} />
            </PageHeader>

            <div className="flex-1">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <DataTable
                        data={departments}
                        columns={columns}
                    />
                )}
            </div>

            <EditDepartmentDialog
                department={editDepartment}
                open={!!editDepartment}
                onOpenChange={(open) => !open && setEditDepartment(null)}
                onDepartmentUpdated={handleDepartmentUpdated}
            />

            <ConfirmDialog
                open={!!deleteDepartment}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteDepartment(null);
                        setDeleteError(null);
                    }
                }}
                title="Delete Department"
                description={`Are you sure you want to delete "${deleteDepartment?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
                onConfirm={handleDeleteDepartment}
                isLoading={isDeleting}
                error={deleteError}
            />
        </div>
    );
}
