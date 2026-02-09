import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ConfirmDialog({
    open,
    onOpenChange,
    title = "Are you sure?",
    description = "This action cannot be undone.",
    confirmText = "Continue",
    cancelText = "Cancel",
    onConfirm,
    variant = "default", // default or destructive
    isLoading = false,
    error = null,
    references = null,
}) {
    const getReferenceBadgeColor = (type) => {
        switch (type) {
            case 'users':
                return 'bg-blue-100 text-blue-800';
            case 'tickets':
                return 'bg-purple-100 text-purple-800';
            case 'categories':
                return 'bg-green-100 text-green-800';
            case 'departments':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeLabel = (type) => {
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4">
                    {error && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                            <div className="font-semibold mb-1">⚠️ Cannot Complete Action</div>
                            <div>{error}</div>
                        </div>
                    )}

                    {references && references.length > 0 && (
                        <div className="space-y-3">
                            <div className="font-semibold text-sm text-gray-700">Active References Found:</div>
                            <ScrollArea className="border rounded-md max-h-[300px]">
                                <div className="space-y-3 p-4">
                                    {references.map((ref, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm">
                                                    {getTypeLabel(ref.type)}
                                                </span>
                                                <Badge className={getReferenceBadgeColor(ref.type)}>
                                                    {ref.count}
                                                </Badge>
                                            </div>
                                            <div className="space-y-1 ml-2">
                                                {ref.items.slice(0, 5).map((item, itemIdx) => (
                                                    <div key={itemIdx} className="text-sm text-gray-600 bg-gray-50 p-2 rounded truncate">
                                                        {ref.type === 'users' && (
                                                            <>
                                                                <div className="font-medium">{item.name}</div>
                                                                <div className="text-xs text-gray-500">{item.email} • {item.employeeId}</div>
                                                            </>
                                                        )}
                                                        {ref.type === 'tickets' && (
                                                            <>
                                                                <div className="font-medium">{item.ticketId} - {item.title}</div>
                                                                <div className="text-xs text-gray-500">{item.status} • {item.priority}</div>
                                                            </>
                                                        )}
                                                        {ref.type === 'categories' && (
                                                            <div className="font-medium">{item.name}</div>
                                                        )}
                                                        {ref.type === 'departments' && (
                                                            <>
                                                                <div className="font-medium">{item.name}</div>
                                                                <div className="text-xs text-gray-500">{item.code}</div>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                                {ref.items.length > 5 && (
                                                    <div className="text-xs text-gray-500 italic p-2">
                                                        ... and {ref.items.length - 5} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onConfirm();
                        }}
                        disabled={isLoading}
                        className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed" : "disabled:opacity-50 disabled:cursor-not-allowed"}
                    >
                        {isLoading ? "Processing..." : confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
