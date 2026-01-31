'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import useSettingsStore from '@/store/settingsStore';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_SYSTEM_SETTINGS, SYSTEM_SETTINGS_DATE_FORMATS, SYSTEM_SETTINGS_TIME_FORMATS, TIMEZONES, ESCALATION_TARGETS, NOTIFY_VIA_OPTIONS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import GeneralSettingsTab from './GeneralSettingsTab';
import TicketSettingsTab from './TicketSettingsTab';
import SLASettingsTab from './SLASettingsTab';
import EmailSettingsTab from './EmailSettingsTab';
import FileUploadSettingsTab from './FileUploadSettingsTab';

// Validation Schema
const systemSettingsSchema = z.object({
  // General
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  companyLogo: z.string().url('Invalid URL').optional().or(z.literal('')),
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color (use format #RRGGBB)'),
  brandSecondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color (use format #RRGGBB)'),
  timezone: z.string().min(1, 'Timezone is required'),
  dateFormat: z.enum(SYSTEM_SETTINGS_DATE_FORMATS),
  timeFormat: z.enum(SYSTEM_SETTINGS_TIME_FORMATS),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().optional(),

  // Ticket Settings
  ticketAutoCloseAfterDays: z.number().int().min(1, 'Must be at least 1 day').max(365),
  allowReopeningClosedTickets: z.boolean(),
  requireResolutionCommentOnClose: z.boolean(),
  enableKanbanView: z.boolean(),
  enableCardView: z.boolean(),
  enableTableView: z.boolean(),
  enableAdvancedFilters: z.boolean(),
  enableBulkOperations: z.boolean(),

  // SLA
  slaDefaults: z.object({
    lowPriority: z.number().int().min(1, 'Must be at least 1 hour'),
    mediumPriority: z.number().int().min(1, 'Must be at least 1 hour'),
    highPriority: z.number().int().min(1, 'Must be at least 1 hour'),
    criticalPriority: z.number().int().min(1, 'Must be at least 1 hour'),
  }),
  escalationRules: z.array(
    z.object({
      afterHours: z.number().int().min(1, 'Must be at least 1 hour'),
      escalateTo: z.enum(ESCALATION_TARGETS),
      notifyVia: z.enum(NOTIFY_VIA_OPTIONS),
      enabled: z.boolean(),
    })
  ),

  // Email
  emailFrom: z.string().email('Invalid email address'),
  emailReplyTo: z.string().email('Invalid email address'),
  emailNotificationsEnabled: z.boolean(),
  inAppNotificationsEnabled: z.boolean(),

  // File Upload
  fileUploadMaxSize: z.number().int().min(1, 'Minimum 1 MB').max(100),
  allowedFileTypes: z.array(z.string()).min(1, 'Select at least one file type'),
  enableReportExports: z.boolean(),
  enableDarkMode: z.boolean(),
});

export default function SystemSettingsForm() {
  const { toast } = useToast();
  const {
    systemSettings: settings,
    fetchSystemSettings,
    updateSystemSettings,
    systemSettingsLoading: isLoading
  } = useSettingsStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const form = useForm({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: DEFAULT_SYSTEM_SETTINGS,
  });

  // Fetch settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        await fetchSystemSettings();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load system settings',
          variant: 'destructive',
        });
      }
    };

    loadSettings();
  }, []);

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      await updateSystemSettings(data);

      toast({
        title: 'Success',
        description: 'System settings have been updated successfully.',
      });

      form.reset(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    setShowResetDialog(false);
    form.reset(DEFAULT_SYSTEM_SETTINGS);

    toast({
      title: 'Settings Reset',
      description: 'All settings have been reset to defaults. Click Save to apply changes.',
    });
  };

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="sla">SLA</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="files">Files & Features</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-6">
            <GeneralSettingsTab form={form} />
          </TabsContent>

          <TabsContent value="tickets" className="space-y-6 mt-6">
            <TicketSettingsTab form={form} />
          </TabsContent>

          <TabsContent value="sla" className="space-y-6 mt-6">
            <SLASettingsTab form={form} />
          </TabsContent>

          <TabsContent value="email" className="space-y-6 mt-6">
            <EmailSettingsTab form={form} />
          </TabsContent>

          <TabsContent value="files" className="space-y-6 mt-6">
            <FileUploadSettingsTab form={form} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowResetDialog(true)}
            disabled={isSubmitting || isLoading}
          >
            Reset to Defaults
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Defaults</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all system settings to their default values. This action cannot be undone. You will need to click Save to apply these changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-red-600 hover:bg-red-700">
              Reset All Settings
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
