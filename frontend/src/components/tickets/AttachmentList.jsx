'use client';

import { useState } from 'react';
import {
    File,
    Image,
    FileText,
    Download,
    Trash2,
    ExternalLink,
    Eye,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize, cn } from '@/lib/utils';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import toast from 'react-hot-toast';

/**
 * AttachmentList component - Display and manage ticket attachments
 */
export default function AttachmentList({
    attachments = [],
    onDelete,
    onDownload,
    canDelete = false,
    ticketId
}) {
    const [previewAttachment, setPreviewAttachment] = useState(null);
    const [deleteAttachment, setDeleteAttachment] = useState(null);

    const getFileIcon = (attachment) => {
        const mimetype = attachment.mimetype || attachment.type;
        if (mimetype?.startsWith('image/')) {
            return <Image className="h-5 w-5 text-blue-500" />;
        }
        if (mimetype?.includes('pdf')) {
            return <FileText className="h-5 w-5 text-red-500" />;
        }
        return <File className="h-5 w-5 text-gray-500" />;
    };

    const isImage = (attachment) => {
        const mimetype = attachment.mimetype || attachment.type;
        return mimetype?.startsWith('image/');
    };

    const isPDF = (attachment) => {
        const mimetype = attachment.mimetype || attachment.type;
        return mimetype?.includes('pdf');
    };

    const isVideo = (attachment) => {
        const mimetype = attachment.mimetype || attachment.type;
        return mimetype?.startsWith('video/');
    };

    const isAudio = (attachment) => {
        const mimetype = attachment.mimetype || attachment.type;
        return mimetype?.startsWith('audio/');
    };

    const isText = (attachment) => {
        const mimetype = attachment.mimetype || attachment.type;
        const filename = attachment.originalName || attachment.name || attachment.filename || '';
        return mimetype?.startsWith('text/') ||
            filename.endsWith('.txt') ||
            filename.endsWith('.json') ||
            filename.endsWith('.xml') ||
            filename.endsWith('.csv');
    };

    const isOfficeDoc = (attachment) => {
        const mimetype = attachment.mimetype || attachment.type;
        const filename = attachment.originalName || attachment.name || attachment.filename || '';
        const officeMimes = [
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];
        const officeExts = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
        return officeMimes.includes(mimetype) || officeExts.some(ext => filename.toLowerCase().endsWith(ext));
    };

    const canPreview = (attachment) => {
        return isImage(attachment) || isPDF(attachment) || isVideo(attachment) || isAudio(attachment) || isText(attachment) || isOfficeDoc(attachment);
    };

    const handleDownload = async (attachment) => {
        if (onDownload) {
            try {
                await onDownload(attachment);
            } catch (error) {
                toast.error('Failed to download file');
            }
        } else {
            // Default download behavior
            const link = document.createElement('a');
            link.href = attachment.path || attachment.url;
            link.download = attachment.originalName || attachment.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleDelete = async () => {
        if (!deleteAttachment) return;

        try {
            if (onDelete) {
                await onDelete(deleteAttachment);
                toast.success('Attachment deleted successfully');
            }
        } catch (error) {
            toast.error('Failed to delete attachment');
        } finally {
            setDeleteAttachment(null);
        }
    };

    const getAttachmentUrl = (attachment) => {
        // Prefer S3 URL (new system)
        if (attachment.s3Url) {
            return attachment.s3Url;
        }

        // Fallback to local path (legacy system)
        if (attachment.path) {
            // Backend stores path, construct URL
            return `${process.env.NEXT_PUBLIC_API_URL || ''}/${attachment.path.replace(/\\/g, '/')}`;
        }

        // Generic URL field
        if (attachment.url) {
            return attachment.url;
        }

        return '#';
    };

    if (attachments.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <File className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No attachments</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-2">
                {attachments.map((attachment, index) => {
                    const fileName = attachment.originalName || attachment.name || attachment.filename;
                    const fileSize = attachment.size ? formatFileSize(attachment.size) : '';
                    const isImageFile = isImage(attachment);

                    return (
                        <div
                            key={attachment._id || attachment.id || index}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border bg-card",
                                "hover:border-primary/50 transition-colors group"
                            )}
                        >
                            {/* File Icon / Thumbnail */}
                            <div className="shrink-0">
                                {isImageFile ? (
                                    <div
                                        className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden cursor-pointer"
                                        onClick={() => setPreviewAttachment(attachment)}
                                    >
                                        <img
                                            src={getAttachmentUrl(attachment)}
                                            alt={fileName}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                        <Image className="h-5 w-5 text-blue-500 hidden" />
                                    </div>
                                ) : (
                                    getFileIcon(attachment)
                                )}
                            </div>

                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" title={fileName}>
                                    {fileName}
                                </p>
                                {fileSize && (
                                    <p className="text-xs text-muted-foreground">
                                        {fileSize}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {canPreview(attachment) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setPreviewAttachment(attachment)}
                                        title="Preview"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                )}

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleDownload(attachment)}
                                    title="Download"
                                >
                                    <Download className="h-4 w-4" />
                                </Button>

                                {canDelete && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                        onClick={() => setDeleteAttachment(attachment)}
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Document Preview Drawer (Left Side) */}
            <Sheet open={!!previewAttachment} onOpenChange={() => setPreviewAttachment(null)}>
                <SheetContent side="left" className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0 flex flex-col">
                    <SheetHeader className="p-4 border-b shrink-0">
                        <SheetTitle className="flex items-center justify-between pr-8">
                            <span className="truncate">
                                {previewAttachment?.originalName || previewAttachment?.name || 'Preview'}
                            </span>
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 p-4 flex items-center justify-center bg-muted/50 overflow-auto">
                        {previewAttachment && (
                            <>
                                {/* Image Preview */}
                                {isImage(previewAttachment) && (
                                    <img
                                        src={getAttachmentUrl(previewAttachment)}
                                        alt={previewAttachment?.originalName || previewAttachment?.name || 'Image preview'}
                                        className="max-w-full max-h-full object-contain rounded-lg"
                                    />
                                )}

                                {/* PDF Preview */}
                                {isPDF(previewAttachment) && (
                                    <iframe
                                        src={getAttachmentUrl(previewAttachment)}
                                        title={previewAttachment?.originalName || 'PDF Preview'}
                                        className="w-full h-full rounded-lg border"
                                    />
                                )}

                                {/* Video Preview */}
                                {isVideo(previewAttachment) && (
                                    <video
                                        src={getAttachmentUrl(previewAttachment)}
                                        controls
                                        className="max-w-full max-h-full rounded-lg"
                                    >
                                        Your browser does not support video playback.
                                    </video>
                                )}

                                {/* Audio Preview */}
                                {isAudio(previewAttachment) && (
                                    <div className="flex flex-col items-center gap-4 py-8">
                                        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                                            <File className="h-12 w-12 text-primary" />
                                        </div>
                                        <audio
                                            src={getAttachmentUrl(previewAttachment)}
                                            controls
                                            className="w-full max-w-md"
                                        >
                                            Your browser does not support audio playback.
                                        </audio>
                                    </div>
                                )}

                                {/* Text File Preview */}
                                {isText(previewAttachment) && (
                                    <div className="w-full h-full overflow-auto bg-slate-900 rounded-lg p-4">
                                        <iframe
                                            src={getAttachmentUrl(previewAttachment)}
                                            title={previewAttachment?.originalName || 'Text Preview'}
                                            className="w-full h-full bg-white rounded"
                                        />
                                    </div>
                                )}

                                {/* Office Document - No Browser Preview */}
                                {isOfficeDoc(previewAttachment) && (
                                    <div className="flex flex-col items-center gap-4 py-8 text-center">
                                        <div className="h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center">
                                            <FileText className="h-12 w-12 text-blue-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="font-medium text-lg">
                                                {previewAttachment?.originalName || previewAttachment?.name}
                                            </p>
                                            <p className="text-muted-foreground text-sm">
                                                This document type cannot be previewed in the browser.
                                            </p>
                                            <p className="text-muted-foreground text-sm">
                                                Please download the file to view it.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => handleDownload(previewAttachment)}
                                            className="mt-2"
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            Download File
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <div className="p-4 border-t flex justify-end gap-2 shrink-0">
                        <Button
                            variant="outline"
                            onClick={() => setPreviewAttachment(null)}
                        >
                            Close
                        </Button>
                        {previewAttachment && !isOfficeDoc(previewAttachment) && (
                            <Button
                                onClick={() => handleDownload(previewAttachment)}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteAttachment} onOpenChange={() => setDeleteAttachment(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this file?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
