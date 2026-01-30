'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import categoryService from '@/lib/services/categoryService';
import departmentService from '@/lib/services/departmentService';
import useAuthStore from '@/store/authStore';
import { TICKET_PRIORITY } from '@/lib/constants';

// Schema
const categorySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    departmentId: z.string().optional(),
    defaultPriority: z.enum(Object.values(TICKET_PRIORITY)),
    defaultSLA: z.coerce.number().min(1, 'SLA must be at least 1 hour').max(720, 'SLA cannot exceed 720 hours'),
});

export default function EditCategoryDialog({ category, open, onOpenChange, onCategoryUpdated }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [departments, setDepartments] = useState([]);
    const { user } = useAuthStore();

    const isSuperAdmin = user?.role === 'SuperAdmin';

    // Fetch departments for SuperAdmin
    useEffect(() => {
        if (open && isSuperAdmin) {
            const fetchDepartments = async () => {
                try {
                    const output = await departmentService.getDepartments();
                    let list = [];
                    if (output.data) list = output.data;
                    else if (Array.isArray(output)) list = output;
                    setDepartments(list);
                } catch (err) {
                    console.error(err);
                    toast.error('Failed to load departments');
                }
            };
            fetchDepartments();
        }
    }, [open, isSuperAdmin]);

    const form = useForm({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: '',
            description: '',
            departmentId: '',
            defaultPriority: 'Medium',
            defaultSLA: 48,
        },
    });

    // Update form when category changes
    useEffect(() => {
        if (category && open) {
            form.reset({
                name: category.name || '',
                description: category.description || '',
                departmentId: category.departmentId?._id || category.departmentId || '',
                defaultPriority: category.defaultPriority || 'Medium',
                defaultSLA: category.defaultSLA || 48,
            });
        }
    }, [category, open, form]);

    const onSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            // Validate department selection for SuperAdmin
            if (isSuperAdmin && !values.departmentId) {
                form.setError('departmentId', { message: 'Department is required' });
                setIsSubmitting(false);
                return;
            }

            const payload = { ...values };
            if (!isSuperAdmin && !payload.departmentId) {
                delete payload.departmentId;
            }

            await categoryService.updateCategory(category._id, payload);

            toast.success('Category updated successfully');
            if (onCategoryUpdated) onCategoryUpdated();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to update category');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Category</DialogTitle>
                    <DialogDescription>
                        Update the ticket category details.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Hardware Issue, Login Problem" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {isSuperAdmin && (
                            <FormField
                                control={form.control}
                                name="departmentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Department</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select department" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {departments.map((dept) => (
                                                    <SelectItem key={dept.id || dept._id} value={dept.id || dept._id}>
                                                        {dept.name} ({dept.code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="defaultPriority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Default Priority</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.values(TICKET_PRIORITY).map((p) => (
                                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="defaultSLA"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Default SLA (Hours)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="1" max="720" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Brief description..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
