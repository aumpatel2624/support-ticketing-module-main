'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Clock,
    MessageSquare,
    MoreVertical,
    Paperclip,
    User,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Upload,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getStatusColor, getPriorityColor, formatDate, getInitials, getAvatarColor, formatRelativeTime } from '@/lib/utils';
import PageHeader from '@/components/common/PageHeader';
import AttachmentList from './AttachmentList';
import FileUpload from './FileUpload';
import ticketService from '@/lib/services/ticketService';
import toast from 'react-hot-toast';

export default function TicketDetailView({ ticket, onTicketUpdate }) {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [showUpload, setShowUpload] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const isInitialMount = useRef(true);

    if (!ticket) return <div>Ticket not found</div>;

    const handleStatusChange = async (newStatus) => {
        // Skip on initial mount to prevent unwanted API calls
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // Validate that newStatus is one of the allowed values
        const validStatuses = ['New', 'Assigned', 'InProgress', 'Pending', 'Completed', 'Closed', 'Escalated'];
        if (!validStatuses.includes(newStatus)) {
            console.error('Invalid status:', newStatus);
            toast.error('Invalid status value');
            return;
        }

        try {
            setIsUpdatingStatus(true);
            await ticketService.updateTicket(ticket._id, {
                status: newStatus
            });
            toast.success(`Ticket status updated to ${newStatus}`);
            if (onTicketUpdate) {
                onTicketUpdate();
            }
        } catch (error) {
            console.error('Failed to update ticket status:', error);
            toast.error('Failed to update ticket status');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleEscalate = () => {
        handleStatusChange('Escalated');
    };

    const handleCloseTicket = () => {
        handleStatusChange('Closed');
    };

    const handleFileUpload = async (files) => {
        setIsUploading(true);
        const newProgress = {};
        
        try {
            for (const file of files) {
                newProgress[file.name] = 0;
                setUploadProgress({ ...newProgress });

                await ticketService.uploadAttachment(
                    ticket._id,
                    file,
                    (progress) => {
                        newProgress[file.name] = progress;
                        setUploadProgress({ ...newProgress });
                    }
                );

                newProgress[file.name] = 100;
                setUploadProgress({ ...newProgress });
            }

            toast.success('Files uploaded successfully');
            setShowUpload(false);
            if (onTicketUpdate) {
                onTicketUpdate();
            }
        } catch (error) {
            toast.error('Failed to upload files');
            console.error(error);
        } finally {
            setIsUploading(false);
            setUploadProgress({});
        }
    };

    const handleDeleteAttachment = async (attachment) => {
        try {
            await ticketService.deleteAttachment(ticket._id, attachment._id || attachment.id);
            toast.success('Attachment deleted');
            if (onTicketUpdate) {
                onTicketUpdate();
            }
        } catch (error) {
            toast.error('Failed to delete attachment');
            throw error;
        }
    };

    const handleDownloadAttachment = async (attachment) => {
        try {
            await ticketService.downloadAttachment(
                ticket._id,
                attachment._id || attachment.id,
                attachment.originalName || attachment.name || attachment.filename
            );
        } catch (error) {
            toast.error('Failed to download file');
            throw error;
        }
    };

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="w-fit"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tickets
            </Button>

            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                            {ticket.ticketId}
                        </span>
                        <Badge variant="outline" className={getStatusColor(ticket.status)}>
                            {ticket.status}
                        </Badge>
                    </div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
                        {ticket.subject}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    {/* <Button variant="outline">Edit</Button> */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleEscalate} disabled={isUpdatingStatus}>
                                Escalate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleCloseTicket} disabled={isUpdatingStatus} className="text-destructive">
                                Close Ticket
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content - Left 2 Columns */}
                <div className="md:col-span-2 space-y-6">
                    {/* Description Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose max-w-none text-muted-foreground whitespace-pre-wrap">
                                {ticket.description}
                            </div>

                            {/* Attachments Section */}
                            <div className="mt-6 pt-4 border-t">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                        <Paperclip className="h-4 w-4" />
                                        Attachments ({ticket.attachments?.length || 0})
                                    </h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowUpload(!showUpload)}
                                    >
                                        <Upload className="mr-1 h-3 w-3" />
                                        {showUpload ? 'Cancel' : 'Add'}
                                    </Button>
                                </div>

                                {showUpload && (
                                    <div className="mb-4">
                                        <FileUpload
                                            onFilesSelected={handleFileUpload}
                                            disabled={isUploading}
                                            uploadProgress={uploadProgress}
                                        />
                                    </div>
                                )}

                                <AttachmentList
                                    attachments={ticket.attachments || []}
                                    onDelete={handleDeleteAttachment}
                                    onDownload={handleDownloadAttachment}
                                    canDelete={true}
                                    ticketId={ticket._id}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Activity/Comments Placeholder for now */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                Activity feed and comments will be implemented in Phase 4.4
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Right Column */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                Ticket Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <span className="text-xs text-muted-foreground block mb-1">Status</span>
                                {ticket.status ? (
                                    <Select value={ticket.status} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="New">New</SelectItem>
                                            <SelectItem value="Assigned">Assigned</SelectItem>
                                            <SelectItem value="InProgress">In Progress</SelectItem>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                            <SelectItem value="Closed">Closed</SelectItem>
                                            <SelectItem value="Escalated">Escalated</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge variant="outline">No Status</Badge>
                                )}
                            </div>

                            <Separator />

                            <div>
                                <span className="text-xs text-muted-foreground block mb-1">Priority</span>
                                <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                                    <AlertCircle className="mr-1 h-3 w-3" />
                                    {ticket.priority}
                                </Badge>
                            </div>

                            <Separator />

                            <div>
                                <span className="text-xs text-muted-foreground block mb-1">Category</span>
                                <div className="font-medium">{ticket.categoryId?.name || 'Uncategorized'}</div>
                            </div>

                            <Separator />

                            <div>
                                <span className="text-xs text-muted-foreground block mb-1">Assignee</span>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarFallback className={`${getAvatarColor(ticket.assignedTo?.name)} text-[10px] text-white`}>
                                            {getInitials(ticket.assignedTo?.name || '?')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{ticket.assignedTo?.name || 'Unassigned'}</span>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <span className="text-xs text-muted-foreground block mb-1">Reporter</span>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarFallback className={`${getAvatarColor(ticket.createdBy?.name)} text-[10px] text-white`}>
                                            {getInitials(ticket.createdBy?.name || '?')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{ticket.createdBy?.name || 'Unknown'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6 space-y-4 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> Created
                                </span>
                                <span>{formatDate(ticket.createdAt)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Updated
                                </span>
                                <span>{formatRelativeTime(ticket.updatedAt || ticket.createdAt)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
