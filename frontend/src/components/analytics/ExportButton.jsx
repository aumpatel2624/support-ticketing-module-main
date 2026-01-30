'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, File as FilePdf, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import analyticsService from '@/lib/services/analyticsService';
import toast from 'react-hot-toast';

/**
 * ExportButton component - Export analytics reports in various formats
 */
export default function ExportButton({ 
    dateRange = null,
    filters = {},
    variant = 'outline',
    size = 'default',
    className
}) {
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [showProgress, setShowProgress] = useState(false);

    const handleExport = async (format) => {
        setIsExporting(true);
        setShowProgress(true);
        setExportProgress(0);

        try {
            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setExportProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 200);

            const params = {
                format,
                ...(dateRange?.from && { dateFrom: dateRange.from }),
                ...(dateRange?.to && { dateTo: dateRange.to }),
                ...filters
            };

            await analyticsService.exportAnalytics(params);

            clearInterval(progressInterval);
            setExportProgress(100);
            
            toast.success(`Report exported as ${format.toUpperCase()}`);
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export report');
        } finally {
            setTimeout(() => {
                setIsExporting(false);
                setShowProgress(false);
                setExportProgress(0);
            }, 500);
        }
    };

    const formatIcons = {
        excel: <FileSpreadsheet className="h-4 w-4 text-green-600" />,
        csv: <FileText className="h-4 w-4 text-blue-600" />,
        pdf: <FilePdf className="h-4 w-4 text-red-600" />
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant={variant} 
                        size={size}
                        className={className}
                        disabled={isExporting}
                    >
                        {isExporting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        Export
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                        onClick={() => handleExport('excel')}
                        disabled={isExporting}
                    >
                        {formatIcons.excel}
                        <span className="ml-2">Excel (.xlsx)</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                        onClick={() => handleExport('csv')}
                        disabled={isExporting}
                    >
                        {formatIcons.csv}
                        <span className="ml-2">CSV (.csv)</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                        onClick={() => handleExport('pdf')}
                        disabled={isExporting}
                    >
                        {formatIcons.pdf}
                        <span className="ml-2">PDF (.pdf)</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Export Progress Dialog */}
            <Dialog open={showProgress} onOpenChange={setShowProgress}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Exporting Report</DialogTitle>
                        <DialogDescription>
                            Please wait while we generate your report...
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        <Progress value={exportProgress} className="h-2" />
                        <p className="text-center text-sm text-muted-foreground mt-3">
                            {exportProgress}%
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
