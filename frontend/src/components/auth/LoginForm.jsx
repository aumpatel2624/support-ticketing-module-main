'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import useAuth from '@/hooks/useAuth';

// Validation schema
const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    rememberMe: z.boolean().default(false),
});

export default function LoginForm() {
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading } = useAuth();

    // Initialize form
    const form = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false,
        },
    });

    // Handle form submission
    const onSubmit = async (values) => {
        try {
            await login(values);
        } catch (error) {
            // Error is already handled by useAuth hook
            console.debug('Form submission error handled', error);
        }
    };

    // Prevent accidental form submission
    const handleFormKeyDown = (e) => {
        if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
            // Let the form's normal submit handler take care of it
            // This is already prevented by React Hook Form
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown} className="space-y-6" noValidate>
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="name@company.com"
                                    type="email"
                                    autoComplete="email"
                                    disabled={isLoading}
                                    className="h-11"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        placeholder="Enter your password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        disabled={isLoading}
                                        className="h-11"
                                        {...field}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="sr-only">
                                            {showPassword ? "Hide password" : "Show password"}
                                        </span>
                                    </Button>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex items-center justify-between">
                    <FormField
                        control={form.control}
                        name="rememberMe"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={isLoading}
                                    />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer text-muted-foreground">
                                    Remember me
                                </FormLabel>
                            </FormItem>
                        )}
                    />

                    <Link
                        href="/forgot-password"
                        prefetch={false}
                        className="text-sm font-medium text-primary hover:underline hover:text-primary/80"
                        tabIndex={-1}
                    >
                        Forgot password?
                    </Link>
                </div>

                <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In to Dashboard
                </Button>
            </form>
        </Form>
    );
}
