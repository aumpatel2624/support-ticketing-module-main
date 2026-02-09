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
import { TICKET_PRIORITY, SLA_DEFAULTS } from '@/lib/constants';

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

    // Watch priority changes to update SLA
    const selectedPriority = form.watch('defaultPriority');

    // Only update SLA on priority change if it's a user interaction (not initial load dependent)
    // Actually, for edit, we might want to respect existing SLA if it differs from default?
    // The requirement says "remove SLA option... SLA is mapped with priority".
    // This implies strict mapping. So if priority changes, SLA changes.
    // If I open a category with High priority and SLA 24, and change to Urgent, SLA should become 4.
    // If I change back to High, it should be 24.
    // What if the loaded category has a custom SLA? usage says "SLA is mapped".
    // I will enforce the mapping when priority changes.
    useEffect(() => {
        if (selectedPriority && SLA_DEFAULTS[selectedPriority]) {
            // Check if it's different to avoid loops or overrides on initial load?
            // On initial load, form.reset sets the values.
            // This effect runs when selectedPriority changes.
            // If I just opened the dialog, selectedPriority is set from category.
            // If the category matches the default, great.
            // If I change priority, it updates.
            // One catch: `form.reset` might trigger this effect?
            // Yes, because `defaultPriority` changes.
            // But that's fine, it will just set SLA to the default for that priority.
            form.setValue('defaultSLA', SLA_DEFAULTS[selectedPriority], {
                shouldValidate: true,
                shouldDirty: true
            });
        }
    }, [selectedPriority, form]);

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

                        <div className="grid grid-cols-1 gap-4">
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

                            {/* Hidden SLA field included in submission */}
                            <input type="hidden" {...form.register('defaultSLA')} />
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
