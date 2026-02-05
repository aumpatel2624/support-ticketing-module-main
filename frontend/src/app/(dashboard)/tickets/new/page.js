'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import CreateTicketForm from '@/components/tickets/CreateTicketForm';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CreateTicketPage() {
    return (
        <div className="min-h-screen">
            <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/tickets"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Tickets
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Create New Ticket</h1>
                        <p className="text-muted-foreground">
                            Submit a new support request and we&apos;ll get back to you as soon as possible
                        </p>
                    </div>
                </div>

                {/* Form Card */}
                <Card className="shadow-sm border-border/50">
                    <CardContent className="p-6 md:p-8">
                        <CreateTicketForm />
                    </CardContent>
                </Card>

                {/* Help Text */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Need immediate assistance? Contact our support team directly at{' '}
                        <a href="mailto:support@company.com" className="text-primary hover:underline">
                            support@company.com
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
