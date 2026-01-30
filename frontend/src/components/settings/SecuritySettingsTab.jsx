'use client';

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

export default function SecuritySettingsTab({ form }) {
  const { control, watch } = form;
  const auditEnabled = watch('auditEnabled');

  return (
    <div className="space-y-8">
      {/* Password Policy Section */}
      <Card>
        <CardHeader>
          <CardTitle>Password Policy</CardTitle>
          <CardDescription>Configure password requirements for all users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            control={control}
            name="passwordPolicy.minLength"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Password Length</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="8"
                    min="6"
                    max="32"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Minimum number of characters required in passwords
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormField
              control={control}
              name="passwordPolicy.requireUppercase"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Require Uppercase Letters</FormLabel>
                    <FormDescription>
                      Passwords must contain at least one uppercase letter (A-Z)
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
              name="passwordPolicy.requireNumbers"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Require Numbers</FormLabel>
                    <FormDescription>
                      Passwords must contain at least one number (0-9)
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
              name="passwordPolicy.requireSpecialChars"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Require Special Characters</FormLabel>
                    <FormDescription>
                      Passwords must contain special characters (!@#$%^&*)
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
          </div>

          <FormField
            control={control}
            name="passwordPolicy.passwordExpiryDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password Expiry (Days)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="90"
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Days before password expires (0 = never expires)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Session Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
          <CardDescription>Configure user session settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            control={control}
            name="sessionTimeoutMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Session Timeout (Minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="30"
                    min="5"
                    max="1440"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Minutes of inactivity before user session expires
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="maxConcurrentSessions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Concurrent Sessions</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="5"
                    min="1"
                    max="10"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Maximum number of simultaneous sessions per user
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Audit Logging Section */}
      <Card>
        <CardHeader>
          <CardTitle>Audit & Logging</CardTitle>
          <CardDescription>Configure system audit logging for compliance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            control={control}
            name="auditEnabled"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Enable Audit Logging</FormLabel>
                  <FormDescription>
                    Track all system activities for compliance and security
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

          {auditEnabled && (
            <FormField
              control={control}
              name="auditRetentionDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audit Log Retention (Days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="90"
                      min="7"
                      max="730"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    How long to retain audit logs (7 days minimum, 730 days maximum)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
