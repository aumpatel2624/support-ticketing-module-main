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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { USER_ROLES } from '@/lib/constants';
import userService from '@/lib/services/userService';
import departmentService from '@/lib/services/departmentService';
import useAuthStore from '@/store/authStore';

// Schema
const userSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email address'),
    role: z.enum(Object.values(USER_ROLES)),
    department: z.string().optional(),
    shift: z.enum(['US', 'UK']),
});

export default function EditUserDialog({ user, open, onOpenChange, onUserUpdated }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [departments, setDepartments] = useState([]);
    const { user: currentUser } = useAuthStore();

    const isSuperAdmin = currentUser?.role === 'SuperAdmin';

    // Fetch departments
    useEffect(() => {
        if (open) {
            const fetchDepts = async () => {
                try {
                    const output = await departmentService.getDepartments();
                    let list = [];
                    if (output.data && Array.isArray(output.data)) list = output.data;
                    else if (Array.isArray(output)) list = output;
                    setDepartments(list);
                } catch (err) {
                    console.error('Failed to load departments', err);
                }
            };
            fetchDepts();
        }
    }, [open]);

    const form = useForm({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: '',
            email: '',
            role: USER_ROLES.NORMAL_USER,
            department: '',
            shift: 'US',
        },
    });

    // Update form when user changes
    useEffect(() => {
        if (user && open) {
            form.reset({
                name: user.name || '',
                email: user.email || '',
                role: user.role || USER_ROLES.NORMAL_USER,
                department: user.departmentId || user.department?._id || user.department || '',
                shift: user.shift || 'US',
            });
        }
    }, [user, open, form]);

    const onSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            const payload = { ...values };
            // Handle department 'none'
            if (payload.department === 'none' || !payload.department) {
                payload.department = null;
            }

            await userService.updateUser(user._id, payload);

            toast.success('User updated successfully');
            if (onUserUpdated) onUserUpdated();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to update user');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Update user information.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="john@company.com" type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {isSuperAdmin && (
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.values(USER_ROLES).map((role) => (
                                                    <SelectItem key={role} value={role}>
                                                        {role}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="department"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Department</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select dept" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {departments.map((dept) => (
                                                    <SelectItem key={dept.id || dept._id} value={dept.id || dept._id}>
                                                        {dept.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="shift"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Shift</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select shift" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="US">US Shift</SelectItem>
                                                <SelectItem value="UK">UK Shift</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

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
