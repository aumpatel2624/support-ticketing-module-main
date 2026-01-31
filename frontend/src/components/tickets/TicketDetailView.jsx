/* eslint-disable react-hooks/rules-of-hooks */
'use client';

import { useState, useRef, useEffect } from 'react';
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
import AssignTicketModal from './AssignTicketModal';
import ActivityFeed from './ActivityFeed';
import FeedbackDialog from './FeedbackDialog';
import useAuth from '@/hooks/useAuth';
import useTicketUpdates from '@/hooks/useTicketUpdates';
import ticketService from '@/lib/services/ticketService';
import toast from 'react-hot-toast';

export default function TicketDetailView({ ticket: initialTicket, onTicketUpdate }) {
    const router = useRouter();
    const { user } = useAuth();
    const [ticket, setTicket] = useState(initialTicket);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [showUpload, setShowUpload] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [pendingStatus, setPendingStatus] = useState(null);
    const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

    if (!ticket) return <div>Ticket not found</div>;

    // Check if current user is staff (can modify tickets)
    const isStaff = user && ['Admin', 'TeamMember', 'SuperAdmin'].includes(user.role);
    const isNormalUser = user && user.role === 'NormalUser';

    // Update local ticket state when prop changes
    useEffect(() => {
        setTicket(initialTicket);
    }, [initialTicket]);

    // Listen for real-time ticket updates
    useTicketUpdates((data) => {
        // Only update if this is the current ticket
        if (data.ticketId === ticket._id) {
            // Refetch the full ticket data to get all updates
            ticketService.getTicket(ticket._id)
                .then((response) => {
                    const updatedTicket = response.data || response;
                    setTicket(updatedTicket);
                    toast.success('Ticket updated');
                })
                .catch((error) => {
                    console.error('Failed to fetch updated ticket:', error);
                });
        }
    });

    // Mark component as ready for user interaction after mount
    useEffect(() => {
        setIsReady(true);
    }, []);

    // Show feedback dialog if ticket is completed and creator hasn't given feedback
    useEffect(() => {
        const isCreator = ticket?.createdBy?._id === user?._id || ticket?.createdBy === user?._id;
        if (
            ticket?.status === 'Completed' &&
            isCreator &&
            !ticket?.feedbackGiven &&
            isReady
        ) {
            setShowFeedbackDialog(true);
        }
    }, [ticket?.status, ticket?.feedbackGiven, ticket?.createdBy, user?._id, isReady]);

    const handleStatusChange = async (newStatus) => {
        // Only allow status changes after component is ready (after mount)
        if (!isReady) {
            return;
        }

        // Only staff members can change status
        if (!isStaff) {
            toast.error('You do not have permission to change ticket status');
            return;
        }

        // Debug: Log the status value being sent
        console.log('Status change:', { newStatus, currentStatus: ticket.status, newStatusLength: newStatus?.length });

        // Validate that newStatus is one of the allowed values
        const validStatuses = ['New', 'Assigned', 'InProgress', 'Pending', 'Completed', 'Closed', 'Escalated'];
        if (!validStatuses.includes(newStatus)) {
            console.error('Invalid status:', newStatus, 'Valid statuses:', validStatuses);
            toast.error('Invalid status value');
            return;
        }

        // If changing to "Assigned" and ticket is unassigned, show assign modal
        if (newStatus === 'Assigned' && !ticket.assignedTo) {
            setPendingStatus(newStatus);
            setShowAssignModal(true);
            return;
        }

        try {
            setIsUpdatingStatus(true);
            const updateData = { status: newStatus };
            console.log('Sending status update:', updateData);
            const response = await ticketService.updateTicket(ticket._id, updateData);
            // Update local ticket state with the response
            if (response.data) {
                setTicket(response.data);
            }
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

    const handleAssignUser = async (selectedUser) => {
        try {
            setIsUpdatingStatus(true);
            const response = await ticketService.updateTicket(ticket._id, {
                status: pendingStatus,
                assignedTo: selectedUser._id
            });
            // Update local ticket state with the response
            if (response.data) {
                setTicket(response.data);
            }
            toast.success(`Ticket assigned to ${selectedUser.name} and status updated to ${pendingStatus}`);
            if (onTicketUpdate) {
                onTicketUpdate();
            }
        } catch (error) {
            console.error('Failed to assign ticket:', error);
            toast.error('Failed to assign ticket');
        } finally {
            setIsUpdatingStatus(false);
            setPendingStatus(null);
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

                const response = await ticketService.uploadAttachment(
                    ticket._id,
                    file,
                    (progress) => {
                        newProgress[file.name] = progress;
                        setUploadProgress({ ...newProgress });
                    }
                );

                // Update local ticket state with the response
                if (response.data) {
                    setTicket(response.data);
                }

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
            const response = await ticketService.deleteAttachment(ticket._id, attachment._id || attachment.id);
            // Update local ticket state with the response
            if (response.data) {
                setTicket(response.data);
            }
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
                {/* Action buttons */}
                <div className="flex items-center gap-2">
                    {/* Feedback button for creator when ticket is completed */}
                    {ticket.status === 'Completed' &&
                        ticket.createdBy?._id === user?._id &&
                        !ticket.feedbackGiven && (
                        <Button
                            onClick={() => setShowFeedbackDialog(true)}
                            className="bg-blue-500 hover:bg-blue-600"
                        >
                            ★ Submit Feedback
                        </Button>
                    )}

                    {/* Only show action buttons for staff members */}
                    {isStaff && (
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
                    )}
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

                    {/* Activity Feed */}
                    <ActivityFeed
                        ticket={ticket}
                        onCommentAdded={() => {
                            // Ticket state is already updated via refetchTicket in ActivityFeed
                        }}
                    />
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
                                {isStaff ? (
                                    // Staff can change status
                                    ticket.status ? (
                                        <Select value={ticket.status} onValueChange={handleStatusChange} disabled={isUpdatingStatus || !isReady}>
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
                                    )
                                ) : (
                                    // Normal users can only view status
                                    <Badge variant="outline" className={getStatusColor(ticket.status)}>
                                        {ticket.status || 'No Status'}
                                    </Badge>
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

            {/* Assign Ticket Modal */}
            <AssignTicketModal
                isOpen={showAssignModal}
                onClose={() => {
                    setShowAssignModal(false);
                    setPendingStatus(null);
                }}
                onAssign={handleAssignUser}
                isLoading={isUpdatingStatus}
            />

            {/* Feedback Dialog */}
            <FeedbackDialog
                open={showFeedbackDialog}
                onOpenChange={setShowFeedbackDialog}
                ticketId={ticket._id}
                onFeedbackSubmitted={() => {
                    // Refetch ticket to get updated status
                    ticketService.getTicket(ticket._id)
                        .then((response) => {
                            setTicket(response.data || response);
                        })
                        .catch((error) => {
                            console.error('Failed to refetch ticket:', error);
                        });
                }}
            />
        </div>
    );
}
