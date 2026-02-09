'use client';

import { useState, useRef } from 'react';
import { Loader2, Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import userService from '@/lib/services/userService';

export default function ImportUsersDialog({ onUsersImported }) {
    const [open, setOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel'
            ];
            if (!validTypes.includes(file.type)) {
                toast.error('Please upload an Excel file (.xlsx or .xls)');
                return;
            }
            setSelectedFile(file);
            setImportResult(null);
        }
    };

    const handleDownloadTemplate = async () => {
        setIsDownloading(true);
        try {
            await userService.downloadSampleTemplate();
            toast.success('Template downloaded');
        } catch (error) {
            console.error('Failed to download template:', error);
            toast.error('Failed to download template');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleImport = async () => {
        if (!selectedFile) {
            toast.error('Please select a file to import');
            return;
        }

        setIsImporting(true);
        setImportResult(null);

        try {
            const result = await userService.importUsers(selectedFile);
            setImportResult(result.data);

            if (result.data.success.length > 0) {
                toast.success(`${result.data.success.length} users imported successfully`);
                if (onUsersImported) onUsersImported();
            }

            if (result.data.errors.length === 0) {
                // Close dialog after short delay if all succeeded
                setTimeout(() => {
                    setOpen(false);
                    resetState();
                }, 1500);
            }
        } catch (error) {
            console.error('Import failed:', error);
            toast.error(error.response?.data?.message || 'Failed to import users');
        } finally {
            setIsImporting(false);
        }
    };

    const resetState = () => {
        setSelectedFile(null);
        setImportResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleOpenChange = (newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
            resetState();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Users
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Import Users from Excel</DialogTitle>
                    <DialogDescription>
                        Upload an Excel file to bulk import users. Download the sample template first.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Download Template Button */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <FileSpreadsheet className="h-8 w-8 text-green-600" />
                            <div>
                                <p className="font-medium text-sm">Sample Template</p>
                                <p className="text-xs text-muted-foreground">Download and fill with user data</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadTemplate}
                            disabled={isDownloading}
                        >
                            {isDownloading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                </>
                            )}
                        </Button>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Upload Excel File</label>
                        <div className="flex gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                className="flex-1 text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                            />
                        </div>
                        {selectedFile && (
                            <p className="text-xs text-muted-foreground">
                                Selected: {selectedFile.name}
                            </p>
                        )}
                    </div>

                    {/* Import Results */}
                    {importResult && (
                        <div className="space-y-3">
                            {/* Success Summary */}
                            {importResult.success.length > 0 && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="text-sm font-medium">
                                        {importResult.success.length} users created successfully
                                    </span>
                                </div>
                            )}

                            {/* Errors */}
                            {importResult.errors.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-red-600">
                                        <XCircle className="h-5 w-5" />
                                        <span className="text-sm font-medium">
                                            {importResult.errors.length} rows failed
                                        </span>
                                    </div>
                                    <ScrollArea className="h-[150px] rounded-md border p-3">
                                        <div className="space-y-2">
                                            {importResult.errors.map((error, index) => (
                                                <div key={index} className="text-xs p-2 bg-red-50 rounded">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <AlertCircle className="h-3 w-3 text-red-500" />
                                                        <span className="font-medium">Row {error.row}</span>
                                                        <span className="text-muted-foreground">
                                                            ({error.email || error.employeeId})
                                                        </span>
                                                    </div>
                                                    <ul className="list-disc list-inside text-red-600 ml-4">
                                                        {error.errors.map((err, i) => (
                                                            <li key={i}>{err}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        {importResult ? 'Close' : 'Cancel'}
                    </Button>
                    {!importResult && (
                        <Button onClick={handleImport} disabled={!selectedFile || isImporting}>
                            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Import Users
                        </Button>
                    )}
                    {importResult && importResult.errors.length > 0 && (
                        <Button onClick={resetState}>
                            Import Another File
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
