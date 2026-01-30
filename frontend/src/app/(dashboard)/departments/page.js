'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import CreateDepartmentDialog from '@/components/settings/CreateDepartmentDialog';
import departmentService from '@/lib/services/departmentService';
import toast from 'react-hot-toast';

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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
        </div>
    );
}
