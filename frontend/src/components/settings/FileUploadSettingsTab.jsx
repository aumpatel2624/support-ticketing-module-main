'use client';

import { FILE_TYPE_OPTIONS } from '@/lib/constants';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function FileUploadSettingsTab({ form }) {
  const { control } = form;

  return (
    <div className="space-y-8">
      {/* File Upload Settings Section */}
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
                <FormLabel>Maximum File Upload Size (MB)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="10"
                    min="1"
                    max="100"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Maximum size in megabytes for individual file uploads
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="allowedFileTypes"
            render={() => (
              <FormItem>
                <FormLabel>Allowed File Types</FormLabel>
                <div className="space-y-3 mt-3">
                  {FILE_TYPE_OPTIONS.map((type) => (
                    <FormField
                      key={type.value}
                      control={control}
                      name="allowedFileTypes"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(type.value)}
                              onCheckedChange={(checked) => {
                                const value = field.value || [];
                                if (checked) {
                                  field.onChange([...value, type.value]);
                                } else {
                                  field.onChange(value.filter((v) => v !== type.value));
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {type.label}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <FormDescription className="mt-3">
                  Select which file types users are allowed to upload
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Feature Toggles Section */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Toggles</CardTitle>
          <CardDescription>Enable or disable system features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            control={control}
            name="enableReportExports"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Enable Report Exports</FormLabel>
                  <FormDescription>
                    Allow users to export reports and data in various formats
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
            name="enableDarkMode"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Enable Dark Mode</FormLabel>
                  <FormDescription>
                    Allow users to switch to dark theme
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
    </div>
  );
}
