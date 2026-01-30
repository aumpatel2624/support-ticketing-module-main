'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function EmailSettingsTab({ form }) {
  const { control } = form;
  const { toast } = useToast();
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  const handleSendTestEmail = async () => {
    try {
      setIsSendingTestEmail(true);
      await api.post('/admin/settings/test-email');

      toast({
        title: 'Success',
        description: 'Test email sent successfully. Check your inbox.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to send test email',
        variant: 'destructive',
      });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Email Configuration Section */}
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
                  <Input
                    type="email"
                    placeholder="noreply@company.com"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Email address used as the sender for all notifications
                </FormDescription>
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
                  <Input
                    type="email"
                    placeholder="support@company.com"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Email address that appears in the reply-to header
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Notification Settings Section */}
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
                  <FormDescription>
                    Send notifications via email
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
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
                  <FormDescription>
                    Show notifications within the application
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Test Email Section */}
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
            Click to send a test email to your account. This helps verify that email notifications are working correctly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
