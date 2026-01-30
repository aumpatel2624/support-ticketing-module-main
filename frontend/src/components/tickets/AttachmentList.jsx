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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
                                {isImageFile && (
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

            {/* Image Preview Dialog */}
            <Dialog open={!!previewAttachment} onOpenChange={() => setPreviewAttachment(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle className="flex items-center justify-between">
                            <span className="truncate pr-8">
                                {previewAttachment?.originalName || previewAttachment?.name || 'Preview'}
                            </span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-4 flex items-center justify-center bg-muted/50 min-h-[300px]">
                        {previewAttachment && (
                            <img
                                src={getAttachmentUrl(previewAttachment)}
                                alt={previewAttachment?.originalName || previewAttachment?.name}
                                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                            />
                        )}
                    </div>
                    <div className="p-4 border-t flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setPreviewAttachment(null)}
                        >
                            Close
                        </Button>
                        {previewAttachment && (
                            <Button
                                onClick={() => handleDownload(previewAttachment)}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

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
