'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
    const initialLoadDone = useRef(false);
    const [editCategory, setEditCategory] = useState(null);
    const [deleteCategory, setDeleteCategory] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [deleteReferences, setDeleteReferences] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { user } = useAuthStore();
    const isSuperAdmin = user?.role === 'SuperAdmin';

    const fetchCategories = async () => {
        try {
            if (!initialLoadDone.current) {
                setIsLoading(true);
            }
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
            initialLoadDone.current = true;
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
        setIsDeleting(true);
        setDeleteError(null);
        setDeleteReferences(null);
        try {
            await categoryService.deleteCategory(deleteCategory._id);
            toast.success('Category deleted successfully');
            setDeleteCategory(null);
            setDeleteError(null);
            setDeleteReferences(null);
            fetchCategories();
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to delete category';
            const references = error.response?.data?.references || null;
            setDeleteError(errorMessage);
            setDeleteReferences(references);
            // Keep the dialog open to show the error and references
        } finally {
            setIsDeleting(false);
        }
    };

    const columns = useMemo(
        () => createColumns(setEditCategory, setDeleteCategory),
        []
    );

    const stableCategories = useMemo(() => categories, [categories]);

    return (
        <div className="h-full flex-1 flex-col space-y-6 p-4 sm:p-6 md:p-8 md:flex">
            <PageHeader
                heading="Category Management"
                text="Manage ticket categories for departments."
            >
                <CreateCategoryDialog onCategoryCreated={handleCategoryCreated} />
            </PageHeader>

            <div className="flex-1 overflow-x-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="min-w-[320px]">
                        <DataTable
                            data={stableCategories}
                            columns={columns}
                        />
                    </div>
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
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteCategory(null);
                        setDeleteError(null);
                        setDeleteReferences(null);
                    }
                }}
                title="Delete Category"
                description={`Are you sure you want to delete "${deleteCategory?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
                onConfirm={handleDeleteCategory}
                isLoading={isDeleting}
                error={deleteError}
                references={deleteReferences}
            />
        </div>
    );
}
