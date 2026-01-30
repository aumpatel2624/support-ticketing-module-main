'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, File, Image, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn, formatFileSize } from '@/lib/utils';
import { FILE_UPLOAD } from '@/lib/constants';
import toast from 'react-hot-toast';

/**
 * FileUpload component - Drag-and-drop file upload with validation and progress
 */
export default function FileUpload({
    onFilesSelected,
    onFileRemove,
    files = [],
    maxFiles = 5,
    maxSize = FILE_UPLOAD.MAX_SIZE,
    allowedTypes = FILE_UPLOAD.ALLOWED_TYPES,
    disabled = false,
    uploadProgress = {}
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [errors, setErrors] = useState([]);
    const inputRef = useRef(null);

    const validateFile = (file) => {
        const errors = [];

        // Check file size
        if (file.size > maxSize) {
            errors.push(`${file.name}: File size exceeds ${formatFileSize(maxSize)}`);
        }

        // Check file type
        if (!allowedTypes.includes(file.type)) {
            errors.push(`${file.name}: File type not allowed`);
        }

        return errors;
    };

    const handleFiles = (newFiles) => {
        setErrors([]);
        const validationErrors = [];
        const validFiles = [];

        // Check max files limit
        if (files.length + newFiles.length > maxFiles) {
            toast.error(`Maximum ${maxFiles} files allowed`);
            return;
        }

        Array.from(newFiles).forEach(file => {
            const fileErrors = validateFile(file);
            if (fileErrors.length > 0) {
                validationErrors.push(...fileErrors);
            } else {
                validFiles.push(file);
            }
        });

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            validationErrors.forEach(err => toast.error(err));
        }

        if (validFiles.length > 0 && onFilesSelected) {
            onFilesSelected(validFiles);
        }
    };

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragging(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            // Call handleFiles logic directly to avoid dependency issues
            setErrors([]);
            const validationErrors = [];
            const validFiles = [];

            // Check max files limit
            if (files.length + droppedFiles.length > maxFiles) {
                toast.error(`Maximum ${maxFiles} files allowed`);
                return;
            }

            Array.from(droppedFiles).forEach(file => {
                const fileErrors = [];

                // Check file size
                if (file.size > maxSize) {
                    fileErrors.push(`${file.name}: File size exceeds ${formatFileSize(maxSize)}`);
                }

                // Check file type
                if (!allowedTypes.includes(file.type)) {
                    fileErrors.push(`${file.name}: File type not allowed`);
                }

                if (fileErrors.length > 0) {
                    validationErrors.push(...fileErrors);
                } else {
                    validFiles.push(file);
                }
            });

            if (validationErrors.length > 0) {
                setErrors(validationErrors);
                validationErrors.forEach(err => toast.error(err));
            }

            if (validFiles.length > 0 && onFilesSelected) {
                onFilesSelected(validFiles);
            }
        }
    }, [disabled, files.length, maxFiles, maxSize, allowedTypes, onFilesSelected]);

    const handleInputChange = (e) => {
        const selectedFiles = e.target.files;
        if (selectedFiles.length > 0) {
            handleFiles(selectedFiles);
        }
        // Reset input so same files can be selected again
        e.target.value = '';
    };

    const handleRemoveFile = (index) => {
        if (onFileRemove) {
            onFileRemove(index);
        }
    };

    const getFileIcon = (file) => {
        if (file.type?.startsWith('image/')) {
            return <Image className="h-5 w-5 text-blue-500" />;
        }
        if (file.type?.includes('pdf')) {
            return <FileText className="h-5 w-5 text-red-500" />;
        }
        return <File className="h-5 w-5 text-gray-500" />;
    };

    const getFileStatus = (file, index) => {
        const progress = uploadProgress[file.name || index];
        if (progress === undefined) return null;
        if (progress === 100) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        if (progress === -1) return <AlertCircle className="h-4 w-4 text-red-500" />;
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    };

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !disabled && inputRef.current?.click()}
                className={cn(
                    "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
                    isDragging
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "border-border hover:border-primary/50 hover:bg-muted/50",
                    disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    onChange={handleInputChange}
                    accept={allowedTypes.join(',')}
                    className="hidden"
                    disabled={disabled}
                />

                <div className="flex flex-col items-center gap-3">
                    <div className={cn(
                        "p-4 rounded-full transition-colors",
                        isDragging ? "bg-primary/10" : "bg-muted"
                    )}>
                        <Upload className={cn(
                            "h-8 w-8 transition-colors",
                            isDragging ? "text-primary" : "text-muted-foreground"
                        )} />
                    </div>

                    <div className="space-y-1">
                        <p className="text-sm font-medium">
                            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            or click to browse
                        </p>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                        <p>Maximum {maxFiles} files</p>
                        <p>Max size: {formatFileSize(maxSize)} per file</p>
                        <p>Allowed: Images, PDF, DOC, DOCX, XLS, XLSX, TXT</p>
                    </div>
                </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((file, index) => {
                        const progress = uploadProgress[file.name || index];
                        const isUploading = progress !== undefined && progress >= 0 && progress < 100;

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all",
                                    isUploading && "border-primary/50 bg-primary/5"
                                )}
                            >
                                {/* File Icon */}
                                <div className="shrink-0">
                                    {getFileIcon(file)}
                                </div>

                                {/* File Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatFileSize(file.size)}
                                    </p>

                                    {/* Progress Bar */}
                                    {isUploading && (
                                        <div className="mt-2">
                                            <Progress value={progress} className="h-1" />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {progress}%
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Status / Remove */}
                                <div className="shrink-0 flex items-center gap-2">
                                    {getFileStatus(file, index)}

                                    {!disabled && progress === undefined && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={() => handleRemoveFile(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Error Messages */}
            {errors.length > 0 && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm font-medium">Validation Errors</p>
                    </div>
                    <ul className="mt-2 text-xs text-destructive space-y-1">
                        {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
