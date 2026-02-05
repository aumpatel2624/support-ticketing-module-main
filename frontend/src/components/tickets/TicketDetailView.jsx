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
import { getStatusColor, getPriorityColor, formatDate, getInitials, getAvatarColor, formatRelativeTime } from '@/lib/utils';
import PageHeader from '@/components/common/PageHeader';
import AttachmentList from './AttachmentList';
import FileUpload from './FileUpload';
import AssignTicketModal from './AssignTicketModal';
import ChangeStatusModal from './ChangeStatusModal';
import ResolutionModal from './ResolutionModal';
import ReopenDialog from './ReopenDialog';
import ActivityFeed from './ActivityFeed';
import EscalateTicketDialog from './EscalateTicketDialog';
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
    const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
    const [showResolutionModal, setShowResolutionModal] = useState(false);
    const [showReopenDialog, setShowReopenDialog] = useState(false);
    const [assignmentMode, setAssignmentMode] = useState(null); // 'assign' or 'reassign'
    const [showEscalateDialog, setShowEscalateDialog] = useState(false);

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

    // Show resolution modal if ticket is resolved (for non-staff creator)
    // Show resolution modal if ticket is resolved (ONLY for the creator)
    useEffect(() => {
        const isCreator = user?._id && (
            (ticket.createdBy?._id === user._id) ||
            (ticket.createdBy === user._id)
        );

        if (ticket?.status === 'Resolved' && isReady && isCreator) {
            setShowResolutionModal(true);
        }
    }, [ticket?.status, isReady, user?._id, ticket.createdBy]);

    const handleStatusChangeClick = () => {
        setShowChangeStatusModal(true);
    };

    const handleStatusUpdate = async (newStatus) => {
        // If changing to "Assigned", show assign modal if:
        // 1. Ticket is unassigned (New -> Assigned)
        // 2. Ticket is Reopened (Reopened -> Assigned) - to confirm/change assignee
        if (newStatus === 'Assigned' && (!ticket.assignedTo || ticket.status === 'Reopened')) {
            setPendingStatus(newStatus);
            setShowAssignModal(true);
            return;
        }

        try {
            setIsUpdatingStatus(true);
            const updateData = { status: newStatus };

            // If resolving, show resolution modal? Or just update.
            // For now just update. Component will handle 'Resolved' state display.

            // Use dedicate status update endpoint (PATCH) which allows assignees to change status
            const response = await ticketService.updateTicketStatus(ticket._id, newStatus);
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

    const handleReopenCallback = () => {
        setShowReopenDialog(true);
    };

    const handleConfirmReopen = async (remarks) => {
        try {
            setIsUpdatingStatus(true);
            const updateData = {
                status: 'Reopened',
                // You might need to add a way to send remarks to backend if Ticket model supports it directly 
                // or just add it as a comment manually
            };

            // 1. Update status
            const response = await ticketService.updateTicket(ticket._id, updateData);

            // 2. Add remarks as a comment
            if (remarks) {
                await ticketService.addComment(ticket._id, { text: `[Reopen Remarks]: ${remarks}` });
            }

            if (response.data) {
                setTicket(response.data);
            }
            toast.success('Ticket reopened');
            if (onTicketUpdate) {
                onTicketUpdate();
            }
        } catch (error) {
            console.error('Failed to reopen ticket:', error);
            toast.error('Failed to reopen ticket');
        } finally {
            setIsUpdatingStatus(false);
            setShowReopenDialog(false);
            setShowResolutionModal(false);
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
            setAssignmentMode(null);
        }
    };

    const handleReassignUser = async (selectedUser) => {
        try {
            setIsUpdatingStatus(true);
            // Use the assignTicket endpoint which doesn't change status
            const response = await ticketService.assignTicket(
                ticket._id,
                selectedUser._id,
                `Ticket reassigned from ${ticket.assignedTo?.name || 'unassigned'} to ${selectedUser.name}`
            );
            // Update local ticket state with the response
            if (response.data) {
                setTicket(response.data);
            }
            toast.success(`Ticket reassigned to ${selectedUser.name}`);
            if (onTicketUpdate) {
                onTicketUpdate();
            }
        } catch (error) {
            console.error('Failed to reassign ticket:', error);
            toast.error('Failed to reassign ticket');
        } finally {
            setIsUpdatingStatus(false);
            setAssignmentMode(null);
        }
    };

    const handleEscalate = () => {
        setShowEscalateDialog(true);
    };

    const handleCloseTicket = () => {
        handleStatusUpdate('Closed');
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

            // Refetch the full ticket to get updated attachments
            const response = await ticketService.getTicket(ticket._id);
            const updatedTicket = response.data || response;
            setTicket(updatedTicket);

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
                        {ticket.status === 'Reopened' ? (
                            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 gap-1">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                                Reopened
                            </Badge>
                        ) : (
                            <Badge variant="outline" className={getStatusColor(ticket.status)}>
                                {ticket.status}
                            </Badge>
                        )}
                    </div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
                        {ticket.subject}
                    </h1>
                </div>
                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Created by user action for Resolved tickets */}
                    {ticket.status === 'Resolved' &&
                        (ticket.createdBy?._id === user?._id || ticket.createdBy === user?._id) && (
                            <Button
                                onClick={() => setShowResolutionModal(true)}
                                variant="outline"
                                className="border-green-500 text-green-600 hover:bg-green-50"
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Resolved
                            </Button>
                        )}

                    {/* Reassign button for Admin/SuperAdmin - Only if already assigned */}
                    {user && ['Admin', 'SuperAdmin'].includes(user.role) && ticket.assignedTo && (
                        <Button
                            onClick={() => {
                                setAssignmentMode('reassign');
                                setShowAssignModal(true);
                            }}
                            variant="outline"
                            className="border-purple-500 text-purple-600 hover:bg-purple-50"
                        >
                            ↻ Reassign
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
                                <DropdownMenuItem onClick={() => setShowChangeStatusModal(true)} disabled={isUpdatingStatus}>
                                    Change Status
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
                                    <div className="flex flex-col gap-2">
                                        <Badge variant="outline" className={`${getStatusColor(ticket.status)} w-fit`}>
                                            {ticket.status}
                                        </Badge>
                                        {(() => {
                                            let nextStatus = null;
                                            let buttonText = '';
                                            let buttonVariant = 'default'; // Use default (primary) for main action

                                            switch (ticket.status) {
                                                case 'New':
                                                    nextStatus = 'Assigned';
                                                    buttonText = 'Assign Ticket';
                                                    break;
                                                case 'Assigned':
                                                    nextStatus = 'InProgress';
                                                    buttonText = 'Move to In Progress';
                                                    break;
                                                case 'InProgress':
                                                    nextStatus = 'Resolved';
                                                    buttonText = 'Resolve Ticket';
                                                    buttonVariant = 'success'; // You might need to define this variant or use explicit className
                                                    break;
                                                case 'Reopened':
                                                case 'Escalated':
                                                    nextStatus = 'InProgress';
                                                    buttonText = 'Move to In Progress';
                                                    break;
                                                default:
                                                    // Resolved or other terminal states
                                                    break;
                                            }

                                            if (nextStatus) {
                                                return (
                                                    <Button
                                                        size="sm"
                                                        // Use specific styles for different actions if needed, or just default primary
                                                        className={`w-full ${nextStatus === 'Resolved' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                                        onClick={() => handleStatusUpdate(nextStatus)}
                                                        disabled={isUpdatingStatus || !isReady}
                                                    >
                                                        {buttonText}
                                                    </Button>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
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
                                <div className="font-medium">{ticket.category?.name || ticket.categoryId?.name || 'Uncategorized'}</div>
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
                                <span>{formatDate(ticket.createdAt)} <span className="text-muted-foreground/50 mx-1">•</span> {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Updated
                                </span>
                                <span>{formatRelativeTime(ticket.updatedAt || ticket.createdAt)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Removed FeedbackResultCard */}
                </div>
            </div>

            {/* Change Status Modal */}
            <ChangeStatusModal
                isOpen={showChangeStatusModal}
                onClose={() => setShowChangeStatusModal(false)}
                currentStatus={ticket.status}
                onStatusChange={handleStatusUpdate}
                isLoading={isUpdatingStatus}
            />

            {/* Resolution Modal */}
            <ResolutionModal
                isOpen={showResolutionModal}
                onClose={() => setShowResolutionModal(false)}
                onReopen={handleReopenCallback}
            />

            {/* Reopen Dialog */}
            <ReopenDialog
                isOpen={showReopenDialog}
                onClose={() => setShowReopenDialog(false)}
                onConfirm={handleConfirmReopen}
                isLoading={isUpdatingStatus}
            />

            {/* Assign/Reassign Ticket Modal */}
            <AssignTicketModal
                isOpen={showAssignModal}
                onClose={() => {
                    setShowAssignModal(false);
                    setPendingStatus(null);
                    setAssignmentMode(null);
                }}
                onAssign={assignmentMode === 'reassign' ? handleReassignUser : handleAssignUser}
                isLoading={isUpdatingStatus}
                title={assignmentMode === 'reassign' ? 'Reassign Ticket' : 'Assign Ticket'}
                description={assignmentMode === 'reassign'
                    ? 'Select a new team member or head to reassign this ticket to'
                    : 'Select a team member or head to assign this ticket to'}
                currentAssignee={assignmentMode === 'reassign' ? ticket.assignedTo : null}
            />

            {/* Removed FeedbackDialog */}

            {/* Escalate Ticket Dialog */}
            <EscalateTicketDialog
                open={showEscalateDialog}
                onOpenChange={setShowEscalateDialog}
                ticket={ticket}
                onSuccess={() => {
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
