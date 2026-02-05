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
            await ticketService.deleteAttachment(ticket._id, attachment._id || attachment.id);

            // Refetch the ticket to get updated attachments list
            const response = await ticketService.getTicket(ticket._id);
            const updatedTicket = response.data || response;
            setTicket(updatedTicket);

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
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Back Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="w-fit hover:bg-slate-100 transition-colors"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tickets
            </Button>

            {/* Header Section */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pb-4 border-b">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-slate-500">
                            {ticket.ticketId}
                        </span>
                        <Badge variant="outline" className={getStatusColor(ticket.status)}>
                            {ticket.status}
                        </Badge>
                        {ticket.wasReopened && ticket.status !== 'Resolved' && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 gap-1">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                                Reopened
                            </Badge>
                        )}
                    </div>
                    <h1 className="font-semibold text-lg md:text-xl text-slate-900">
                        {ticket.subject}
                    </h1>
                </div>
                {/* Action buttons */}
                <div className="flex items-center gap-2">
                    {/* Created by user action for Resolved tickets */}
                    {ticket.status === 'Resolved' &&
                        (ticket.createdBy?._id === user?._id || ticket.createdBy === user?._id) && (
                            <Button
                                onClick={() => setShowResolutionModal(true)}
                                variant="outline"
                                size="sm"
                                className="border-green-500 text-green-600 hover:bg-green-50"
                            >
                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
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
                            size="sm"
                            className="border-purple-500 text-purple-600 hover:bg-purple-50"
                        >
                            ↻ Reassign
                        </Button>
                    )}

                    {/* Reassign to Me button for TeamMember in same department */}
                    {user && user.role === 'TeamMember' &&
                        user.department?.toString() === (ticket.departmentId?._id || ticket.departmentId)?.toString() &&
                        ticket.assignedTo?._id?.toString() !== user._id?.toString() &&
                        ticket.assignedTo?.toString() !== user._id?.toString() && (
                            <Button
                                onClick={() => handleReassignUser(user)}
                                variant="outline"
                                size="sm"
                                className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                disabled={isUpdatingStatus}
                            >
                                <User className="mr-1.5 h-3.5 w-3.5" />
                                Reassign to Self
                            </Button>
                        )}

                    {/* Only show action buttons for staff members */}
                    {isStaff && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
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
                    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-slate-200/60">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-primary" />
                                Description
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose max-w-none text-slate-600 whitespace-pre-wrap leading-relaxed">
                                {ticket.description}
                            </div>

                            {/* Attachments Section */}
                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                                        <Paperclip className="h-4 w-4 text-primary" />
                                        Attachments
                                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                            {ticket.attachments?.length || 0}
                                        </span>
                                    </h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowUpload(!showUpload)}
                                        className="hover:bg-primary/10 hover:text-primary transition-colors"
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
                <div className="space-y-4">
                    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-slate-200/60 sticky top-4">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Ticket Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Status Section */}
                            <div className="p-3 rounded-lg bg-slate-50/80">
                                <span className="text-xs font-medium text-slate-500 block mb-2">Status</span>
                                {isStaff ? (
                                    // Staff can change status
                                    <div className="flex flex-col gap-2">
                                        <Badge variant="outline" className={`${getStatusColor(ticket.status)} w-fit shadow-sm`}>
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
                                                    buttonText = 'Start Progress';
                                                    break;
                                                case 'InProgress':
                                                    nextStatus = 'Resolved';
                                                    buttonText = 'Resolve Ticket';
                                                    buttonVariant = 'success';
                                                    break;
                                                case 'Reopened':
                                                case 'Escalated':
                                                    nextStatus = 'InProgress';
                                                    buttonText = 'Start Progress';
                                                    break;
                                                default:
                                                    break;
                                            }

                                            if (nextStatus) {
                                                return (
                                                    <Button
                                                        size="sm"
                                                        className={`w-full shadow-sm transition-all hover:shadow-md ${nextStatus === 'Resolved' ? 'bg-green-600 hover:bg-green-700' : ''}`}
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
                                    <Badge variant="outline" className={`${getStatusColor(ticket.status)} shadow-sm`}>
                                        {ticket.status || 'No Status'}
                                    </Badge>
                                )}
                            </div>

                            {/* Priority Section */}
                            <div className="p-3 rounded-lg bg-slate-50/80">
                                <span className="text-xs font-medium text-slate-500 block mb-2">Priority</span>
                                <Badge variant="outline" className={`${getPriorityColor(ticket.priority)} shadow-sm`}>
                                    <AlertCircle className="mr-1 h-3 w-3" />
                                    {ticket.priority}
                                </Badge>
                            </div>

                            <Separator className="bg-slate-100" />

                            {/* Category */}
                            <div>
                                <span className="text-xs font-medium text-slate-500 block mb-1.5">Category</span>
                                <div className="font-medium text-slate-800">{ticket.category?.name || ticket.categoryId?.name || 'Uncategorized'}</div>
                            </div>

                            <Separator className="bg-slate-100" />

                            {/* Assignee */}
                            <div>
                                <span className="text-xs font-medium text-slate-500 block mb-2">Assignee</span>
                                <div className="flex items-center gap-2.5">
                                    <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
                                        <AvatarFallback className={`${getAvatarColor(ticket.assignedTo?.name)} text-xs text-white font-medium`}>
                                            {getInitials(ticket.assignedTo?.name || '?')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium text-slate-800">{ticket.assignedTo?.name || 'Unassigned'}</span>
                                </div>
                            </div>

                            <Separator className="bg-slate-100" />

                            {/* Reporter */}
                            <div>
                                <span className="text-xs font-medium text-slate-500 block mb-2">Reporter</span>
                                <div className="flex items-center gap-2.5">
                                    <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
                                        <AvatarFallback className={`${getAvatarColor(ticket.createdBy?.name)} text-xs text-white font-medium`}>
                                            {getInitials(ticket.createdBy?.name || '?')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium text-slate-800">{ticket.createdBy?.name || 'Unknown'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timestamps Card */}
                    <Card className="shadow-sm border-slate-200/60">
                        <CardContent className="pt-4 space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" /> Created
                                </span>
                                <span className="font-medium text-slate-700">{formatDate(ticket.createdAt)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" /> Updated
                                </span>
                                <span className="font-medium text-slate-700">{formatRelativeTime(ticket.updatedAt || ticket.createdAt)}</span>
                            </div>
                        </CardContent>
                    </Card>
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
        </div >
    );
}
