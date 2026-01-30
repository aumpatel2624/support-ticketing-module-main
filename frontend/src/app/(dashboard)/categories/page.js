'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import CreateCategoryDialog from '@/components/settings/CreateCategoryDialog';
import EditCategoryDialog from '@/components/settings/EditCategoryDialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import categoryService from '@/lib/services/categoryService';
import useAuthStore from '@/store/authStore';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editCategory, setEditCategory] = useState(null);
    const [deleteCategory, setDeleteCategory] = useState(null);
    const { user } = useAuthStore();
    const isSuperAdmin = user?.role === 'SuperAdmin';

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const output = await categoryService.getCategories({ limit: 1000 });

            let list = [];
            if (output && Array.isArray(output.data)) {
                list = output.data;
            } else if (Array.isArray(output)) {
                list = output;
            } else if (output && output.data && Array.isArray(output.data.data)) {
                list = output.data.data;
            }

            setCategories(list);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            toast.error('Failed to load categories');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCategoryCreated = () => {
        fetchCategories();
    };

    const handleCategoryUpdated = () => {
        fetchCategories();
        setEditCategory(null);
    };

    const handleDeleteCategory = async () => {
        try {
            await categoryService.deleteCategory(deleteCategory._id);
            toast.success('Category deleted successfully');
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        } finally {
            setDeleteCategory(null);
        }
    };

    const columns = useMemo(
        () => createColumns(setEditCategory, setDeleteCategory),
        []
    );

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <PageHeader
                heading="Category Management"
                text="Manage ticket categories for departments."
            >
                <CreateCategoryDialog onCategoryCreated={handleCategoryCreated} />
            </PageHeader>

            <div className="flex-1">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <DataTable
                        data={categories}
                        columns={columns}
                    />
                )}
            </div>

            <EditCategoryDialog
                category={editCategory}
                open={!!editCategory}
                onOpenChange={(open) => !open && setEditCategory(null)}
                onCategoryUpdated={handleCategoryUpdated}
            />

            <ConfirmDialog
                open={!!deleteCategory}
                onOpenChange={(open) => !open && setDeleteCategory(null)}
                title="Delete Category"
                description={`Are you sure you want to delete "${deleteCategory?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
                onConfirm={handleDeleteCategory}
            />
        </div>
    );
}
