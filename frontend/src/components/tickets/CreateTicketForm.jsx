'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Send, AlertCircle, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
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
import { TICKET_PRIORITY } from '@/lib/constants';
import ticketService from '@/lib/services/ticketService';
import categoryService from '@/lib/services/categoryService';
import useAuthStore from '@/store/authStore';
import FileUpload from './FileUpload';

// Schema
const ticketSchema = z.object({
    subject: z.string().min(5, 'Subject must be at least 5 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    priority: z.enum(Object.values(TICKET_PRIORITY)),
    categoryId: z.string().min(1, 'Please select a category'),
});

export default function CreateTicketForm() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [attachments, setAttachments] = useState([]);

    const form = useForm({
        resolver: zodResolver(ticketSchema),
        defaultValues: {
            subject: '',
            description: '',
            priority: TICKET_PRIORITY.MEDIUM,
            categoryId: '',
        },
    });

    // Fetch Categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const output = await categoryService.getCategories();
                // Handle response format
                let catList = [];
                if (Array.isArray(output)) catList = output;
                else if (output.data && Array.isArray(output.data)) catList = output.data;

                setCategories(catList);
            } catch (error) {
                console.error('Error fetching categories:', error);
                toast.error('Failed to load categories');
            } finally {
                setIsLoadingCategories(false);
            }
        };

        fetchCategories();
    }, []);

    const onSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            // Find selected category to get departmentId
            const selectedCategory = categories.find(c => c.id === values.categoryId || c._id === values.categoryId);

            if (!selectedCategory) {
                toast.error('Invalid category selected');
                return;
            }

            const payload = {
                ...values,
                departmentId: selectedCategory.departmentId || selectedCategory.department, // Handle both structures
                createdBy: user?.id || user?._id, // Backend might need this if not inferred from token
                attachments: attachments.length > 0 ? attachments : undefined
            };

            await ticketService.createTicket(payload);

            toast.success('Ticket created successfully!');
            router.push('/tickets');
            router.refresh();
        } catch (error) {
            console.error('Error creating ticket:', error);
            toast.error(error.response?.data?.message || 'Failed to create ticket. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
                <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                                <Input placeholder="Brief summary of the issue" {...field} />
                            </FormControl>
                            <FormDescription>
                                Provide a concise title for your request.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingCategories}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={isLoadingCategories ? "Loading..." : "Select a category"} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id || category._id} value={category.id || category._id}>
                                                {category.name}
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
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Priority</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.values(TICKET_PRIORITY).map((priority) => (
                                            <SelectItem key={priority} value={priority}>
                                                {priority}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription className="text-xs">
                                    Low (Routine) to Urgent (System Critical).
                                </FormDescription>
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
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Detailed description of the problem..."
                                    className="min-h-[150px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Please include any error messages or steps to reproduce the issue.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* File Upload */}
                <div className="space-y-3">
                    <FormLabel className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        Attachments
                    </FormLabel>
                    <FileUpload
                        files={attachments}
                        onFilesSelected={(newFiles) => setAttachments([...attachments, ...newFiles])}
                        onFileRemove={(index) => setAttachments(attachments.filter((_, i) => i !== index))}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Submit Ticket
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
