'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Send, Paperclip, Building2, FolderOpen, FileText, MessageSquare, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
import ticketService from '@/lib/services/ticketService';
import categoryService from '@/lib/services/categoryService';
import departmentService from '@/lib/services/departmentService';
import useAuthStore from '@/store/authStore';
import FileUpload from './FileUpload';

// Schema
const ticketSchema = z.object({
    subject: z.string().min(5, 'Subject must be at least 5 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    departmentId: z.string().min(1, 'Please select a department'),
    categoryId: z.string().min(1, 'Please select a category'),
});

export default function CreateTicketForm() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [attachments, setAttachments] = useState([]);

    const form = useForm({
        resolver: zodResolver(ticketSchema),
        defaultValues: {
            subject: '',
            description: '',
            departmentId: '',
            categoryId: '',
        },
    });

    // Fetch Departments
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const output = await departmentService.getDepartments();
                // Handle response format
                let deptList = [];
                if (Array.isArray(output)) deptList = output;
                else if (output.data && Array.isArray(output.data)) deptList = output.data;

                setDepartments(deptList);
            } catch (error) {
                console.error('Error fetching departments:', error);
                toast.error('Failed to load departments');
            } finally {
                setIsLoadingDepartments(false);
            }
        };

        fetchDepartments();
    }, []);

    // Fetch Categories when department changes
    const selectedDepartmentId = form.watch('departmentId');

    useEffect(() => {
        const fetchCategories = async () => {
            if (!selectedDepartmentId) {
                setCategories([]);
                form.setValue('categoryId', '');
                return;
            }

            setIsLoadingCategories(true);
            try {
                const output = await categoryService.getCategories({ departmentId: selectedDepartmentId });
                // Handle response format
                let catList = [];
                if (Array.isArray(output)) catList = output;
                else if (output.data && Array.isArray(output.data)) catList = output.data;

                setCategories(catList);
                // Reset category selection when department changes
                form.setValue('categoryId', '');
            } catch (error) {
                console.error('Error fetching categories:', error);
                toast.error('Failed to load categories');
            } finally {
                setIsLoadingCategories(false);
            }
        };

        fetchCategories();
    }, [selectedDepartmentId, form]);

    const onSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            // Create ticket first (without attachments)
            const ticketResponse = await ticketService.createTicket(values);
            const ticketId = ticketResponse.data._id;

            // Upload attachments if any were selected
            if (attachments.length > 0) {
                for (const file of attachments) {
                    try {
                        await ticketService.uploadAttachment(ticketId, file);
                    } catch (uploadError) {
                        console.error('Error uploading file:', file.name, uploadError);
                        toast.error(`Failed to upload file: ${file.name}`);
                    }
                }
            }

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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Subject Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Ticket Details</h3>
                            <p className="text-sm text-muted-foreground">Describe your issue or request</p>
                        </div>
                    </div>

                    <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium">Subject *</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="e.g., Unable to access email on mobile device"
                                        className="h-11 text-base"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    A brief, descriptive title for your request
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Classification Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Building2 className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Classification</h3>
                            <p className="text-sm text-muted-foreground">Help us route your ticket to the right team</p>
                        </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="departmentId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        Department *
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingDepartments}>
                                        <FormControl>
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder={isLoadingDepartments ? "Loading departments..." : "Select a department"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {departments.map((department) => (
                                                <SelectItem key={department.id || department._id} value={department.id || department._id}>
                                                    {department.name}
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
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium flex items-center gap-2">
                                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                                        Category *
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isLoadingCategories || !selectedDepartmentId || categories.length === 0}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder={
                                                    isLoadingCategories
                                                        ? "Loading categories..."
                                                        : !selectedDepartmentId
                                                            ? "Select department first"
                                                            : categories.length === 0
                                                                ? "No categories available"
                                                                : "Select a category"
                                                } />
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
                    </div>
                </div>

                {/* Description Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                        <div className="p-2 rounded-lg bg-green-500/10">
                            <MessageSquare className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Description</h3>
                            <p className="text-sm text-muted-foreground">Provide details about your issue</p>
                        </div>
                    </div>

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium">Detailed Description *</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Please describe your issue in detail. Include:&#10;• What you were trying to do&#10;• What happened instead&#10;• Any error messages you saw&#10;• Steps to reproduce the issue"
                                        className="min-h-[180px] text-base resize-none leading-relaxed"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    The more detail you provide, the faster we can help you
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Attachments Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                            <Paperclip className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Attachments</h3>
                            <p className="text-sm text-muted-foreground">Add screenshots or relevant files (optional)</p>
                        </div>
                    </div>

                    <FileUpload
                        files={attachments}
                        onFilesSelected={(newFiles) => setAttachments([...attachments, ...newFiles])}
                        onFileRemove={(index) => setAttachments(attachments.filter((_, i) => i !== index))}
                        disabled={isSubmitting}
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-border/50">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/tickets')}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="min-w-[140px] gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Submit Ticket
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    );
}
