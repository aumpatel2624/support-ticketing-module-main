'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

export default function LogoUpload({ value, onChange }) {
    const { toast } = useToast();
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate type
        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Invalid file type',
                description: 'Please upload an image file (JPEG, PNG, GIF)',
                variant: 'destructive',
            });
            return;
        }

        // Validate size (e.g., 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast({
                title: 'File too large',
                description: 'Logo must be less than 2MB',
                variant: 'destructive',
            });
            return;
        }

        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/admin/settings/logo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                onChange(response.data.data.url);
                toast({
                    title: 'Logo uploaded',
                    description: 'Company logo has been updated successfully.',
                });
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast({
                title: 'Upload failed',
                description: error.response?.data?.message || 'Failed to upload logo',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = () => {
        onChange('');
    };

    return (
        <div className="flex flex-col gap-4">
            <Input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
            />

            <div className="flex items-center gap-6">
                {/* Preview */}
                <div className="relative group shrink-0">
                    <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50 overflow-hidden">
                        {value ? (
                            <div className="relative h-full w-full">
                                <Image
                                    src={value}
                                    alt="Company Logo"
                                    fill
                                    className="object-contain p-1"
                                    sizes="80px"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                        )}
                    </div>
                    {isUploading && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            {value ? 'Change Logo' : 'Upload Logo'}
                        </Button>

                        {value && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleRemove}
                                disabled={isUploading}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Remove
                            </Button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Recommended size: 180x40px. Max 2MB.
                    </p>
                </div>
            </div>

            {/* Fallback URL Input */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Or use URL:</span>
                <Input
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="h-8 text-xs"
                />
            </div>
        </div>
    );
}
