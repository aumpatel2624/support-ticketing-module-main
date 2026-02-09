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
import departmentService from '@/lib/services/departmentService';
import userService from '@/lib/services/userService';
import useAuthStore from '@/store/authStore';

// Schema
const departmentSchema = z.object({
    code: z.string().min(2, 'Code must be at least 2 characters').max(10, 'Code cannot exceed 10 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    headUserId: z.string().optional(),
});

export default function EditDepartmentDialog({ department, open, onOpenChange, onDepartmentUpdated }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [users, setUsers] = useState([]);
    const { user } = useAuthStore();

    // Check if user is SuperAdmin
    const isSuperAdmin = user?.role === 'SuperAdmin';

    // Fetch users for Head selection
    useEffect(() => {
        if (open && !isSuperAdmin) {
            const fetchUsers = async () => {
                try {
                    const output = await userService.getUsers();
                    let list = [];
                    if (output.data) list = output.data;
                    else if (Array.isArray(output)) list = output;
                    setUsers(list);
                } catch (err) {
                    console.error(err);
                }
            };
            fetchUsers();
        }
    }, [open, isSuperAdmin]);

    const form = useForm({
        resolver: zodResolver(departmentSchema),
        defaultValues: {
            code: '',
            name: '',
            description: '',
            headUserId: '',
        },
    });

    // Update form when department changes
    useEffect(() => {
        if (department && open) {
            form.reset({
                code: department.code || '',
                name: department.name || '',
                description: department.description || '',
                headUserId: department.headUserId || '',
            });
        }
    }, [department, open, form]);

    const onSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            // Clean up values
            const payload = { ...values };
            if (payload.headUserId === 'none' || !payload.headUserId) delete payload.headUserId;

            await departmentService.updateDepartment(department._id, payload);

            toast.success('Department updated successfully');
            if (onDepartmentUpdated) onDepartmentUpdated();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to update department');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Department</DialogTitle>
                    <DialogDescription>
                        Update department information.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Department Code</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g. IT, HR, FIN"
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        2-10 character unique code for this department
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. IT Support" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {!isSuperAdmin && (
                            <FormField
                                control={form.control}
                                name="headUserId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Head of Department</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a user" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {users.map((u) => (
                                                    <SelectItem key={u.id || u._id} value={u.id || u._id}>
                                                        {u.name} ({u.role})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Optional: Assign a manager for this department.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Brief description of responsibilities..."
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
