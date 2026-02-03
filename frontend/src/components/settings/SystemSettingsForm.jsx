'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import LogoUpload from './LogoUpload';
import useSettingsStore from '@/store/settingsStore';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MultiSelect } from '@/components/ui/multi-select';
import api from '@/lib/api';

// Allowed MIME types for file uploads
const ALLOWED_MIME_TYPES = [
  { value: 'image/jpeg', label: '.jpg' },
  { value: 'image/png', label: '.png' },
  { value: 'image/gif', label: '.gif' },
  { value: 'application/pdf', label: '.pdf' },
  { value: 'application/msword', label: '.doc' },
  { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: '.docx' },
  { value: 'application/vnd.ms-excel', label: '.xls' },
  { value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: '.xlsx' },
  { value: 'text/plain', label: '.txt' },
];

// Default settings values
const DEFAULT_SETTINGS = {
  companyName: 'Support System',
  companyLogo: '',
  emailFrom: 'noreply@company.com',
  emailReplyTo: '',
  emailNotificationsEnabled: true,
  inAppNotificationsEnabled: true,
  fileUploadMaxSize: 5,
  allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  slaDefaults: {
    lowPriority: 72,
    mediumPriority: 48,
    highPriority: 24,
    urgentPriority: 4
  }
};

// Simplified Validation Schema
const systemSettingsSchema = z.object({
  // General
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  companyLogo: z.string().url('Invalid URL').optional().or(z.literal('')).nullable(),

  // Email
  emailFrom: z.string().email('Invalid email address'),
  emailReplyTo: z.string().email('Invalid email address').optional().or(z.literal('')).nullable(),
  emailNotificationsEnabled: z.boolean(),
  inAppNotificationsEnabled: z.boolean(),

  // File Upload
  fileUploadMaxSize: z.number().int().min(1, 'Minimum 1 MB').max(100),
  allowedFileTypes: z.array(z.string()).min(1, 'Select at least one file type'),

  // SLA Defaults
  slaDefaults: z.object({
    lowPriority: z.number().int().min(1, 'Minimum 1 hour').max(720, 'Maximum 720 hours'),
    mediumPriority: z.number().int().min(1, 'Minimum 1 hour').max(720, 'Maximum 720 hours'),
    highPriority: z.number().int().min(1, 'Minimum 1 hour').max(720, 'Maximum 720 hours'),
    urgentPriority: z.number().int().min(1, 'Minimum 1 hour').max(720, 'Maximum 720 hours')
  }).optional()
});

export default function SystemSettingsForm() {
  const {
    systemSettings: settings,
    fetchSystemSettings,
    updateSystemSettings,
    systemSettingsLoading: isLoading
  } = useSettingsStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  const form = useForm({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: DEFAULT_SETTINGS,
  });

  // Fetch settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        await fetchSystemSettings();
      } catch (error) {
        toast.error('Failed to load system settings');
      }
    };

    loadSettings();
  }, [fetchSystemSettings]);

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

      toast.success('System settings have been updated successfully.');

      form.reset(data);
    } catch (error) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    setShowResetDialog(false);
    form.reset(DEFAULT_SETTINGS);

    toast.success('All settings have been reset to defaults. Click Save to apply changes.', { duration: 5000 });
  };

  const handleSendTestEmail = async () => {
    try {
      setIsSendingTestEmail(true);
      await api.post('/admin/settings/test-email');

      toast.success('Test email sent successfully. Check your inbox.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send test email');
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const { control } = form;

  if (isLoading && !settings) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="sla">SLA</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Basic information about your organization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter company name" {...field} />
                        </FormControl>
                        <FormDescription>This name will be displayed throughout the application</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="companyLogo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Logo</FormLabel>
                        <FormControl>
                          <LogoUpload
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Email Tab */}
            <TabsContent value="email" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email Configuration</CardTitle>
                  <CardDescription>Configure email addresses used for notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={control}
                    name="emailFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="noreply@company.com" {...field} />
                        </FormControl>
                        <FormDescription>Email address used as the sender for all notifications</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="emailReplyTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reply-To Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="support@company.com" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormDescription>Email address that appears in the reply-to header</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Separator />

              <Card>
                <CardHeader>
                  <CardTitle>Notification Channels</CardTitle>
                  <CardDescription>Enable or disable notification delivery methods</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={control}
                    name="emailNotificationsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Email Notifications</FormLabel>
                          <FormDescription>Send notifications via email</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="inAppNotificationsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>In-App Notifications</FormLabel>
                          <FormDescription>Show notifications within the application</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Separator />

              <Card>
                <CardHeader>
                  <CardTitle>Test Email</CardTitle>
                  <CardDescription>Send a test email to verify SMTP configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={isSendingTestEmail}
                    className="gap-2"
                  >
                    {isSendingTestEmail && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSendingTestEmail ? 'Sending...' : 'Send Test Email'}
                  </Button>
                  <p className="mt-3 text-sm text-gray-600">
                    Click to send a test email to your account.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>File Upload Settings</CardTitle>
                  <CardDescription>Configure file upload limits and allowed types</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={control}
                    name="fileUploadMaxSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum File Size (MB)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="5"
                            min="1"
                            max="100"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormDescription>Maximum allowed file size for uploads (1-100 MB)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="allowedFileTypes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allowed File Types</FormLabel>
                        <FormControl>
                          <MultiSelect
                            options={ALLOWED_MIME_TYPES}
                            selected={field.value || []}
                            onChange={field.onChange}
                            placeholder="Select allowed file types..."
                          />
                        </FormControl>
                        <FormDescription>Select which file types users can upload</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* SLA Tab */}
            <TabsContent value="sla" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>SLA Configuration</CardTitle>
                  <CardDescription>Set response time deadlines (in hours) for each ticket priority level. These determine when a ticket is considered &quot;at risk&quot; or &quot;breached&quot;.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={control}
                      name="slaDefaults.lowPriority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                            Low Priority
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="72"
                              min="1"
                              max="720"
                              {...field}
                              value={field.value ?? 72}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 72)}
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value ? `${(field.value / 24).toFixed(1)} days` : '3 days'} deadline
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="slaDefaults.mediumPriority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-full bg-yellow-500"></span>
                            Medium Priority
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="48"
                              min="1"
                              max="720"
                              {...field}
                              value={field.value ?? 48}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 48)}
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value ? `${(field.value / 24).toFixed(1)} days` : '2 days'} deadline
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="slaDefaults.highPriority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-full bg-orange-500"></span>
                            High Priority
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="24"
                              min="1"
                              max="720"
                              {...field}
                              value={field.value ?? 24}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 24)}
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value ? `${(field.value / 24).toFixed(1)} days` : '1 day'} deadline
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="slaDefaults.urgentPriority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                            Urgent Priority
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="4"
                              min="1"
                              max="720"
                              {...field}
                              value={field.value ?? 4}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 4)}
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value ? (field.value >= 24 ? `${(field.value / 24).toFixed(1)} days` : `${field.value} hours`) : '4 hours'} deadline
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
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
      </Form>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all system settings to their default values. You will need to click Save to apply the changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
