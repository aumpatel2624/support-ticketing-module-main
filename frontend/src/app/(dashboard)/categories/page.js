'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import CreateCategoryDialog from '@/components/settings/CreateCategoryDialog';
import categoryService from '@/lib/services/categoryService';
import useAuthStore from '@/store/authStore';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuthStore();
    const isSuperAdmin = user?.role === 'SuperAdmin';

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const output = await categoryService.getCategories({ limit: 1000 }); // get all
            console.log('Categories API Output:', output);

            let list = [];
            if (output && Array.isArray(output.data)) {
                list = output.data;
            } else if (Array.isArray(output)) {
                list = output;
            } else if (output && output.data && Array.isArray(output.data.data)) {
                // Handle potentially nested data like { data: { data: [] } } if pagination structure varies
                list = output.data.data;
            }

            console.log('Categories List:', list);
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
                    // We can add a toolbar later for filtering
                    />
                )}
            </div>
        </div>
    );
}
