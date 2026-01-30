'use client';

import { useFieldArray } from 'react-hook-form';
import { ESCALATION_TARGETS, NOTIFY_VIA_OPTIONS } from '@/lib/constants';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { X, Plus } from 'lucide-react';

export default function SLASettingsTab({ form }) {
  const { control } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'escalationRules',
  });

  const addRule = () => {
    append({
      afterHours: 24,
      escalateTo: 'manager',
      notifyVia: 'email',
      enabled: true,
    });
  };

  return (
    <div className="space-y-8">
      {/* SLA Defaults Section */}
      <Card>
        <CardHeader>
          <CardTitle>SLA Default Hours</CardTitle>
          <CardDescription>Set default SLA response times by priority level</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <FormField
              control={control}
              name="slaDefaults.lowPriority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Low Priority (hours)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="168"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Default response time in hours</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="slaDefaults.mediumPriority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medium Priority (hours)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="48"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Default response time in hours</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="slaDefaults.highPriority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>High Priority (hours)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="24"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Default response time in hours</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="slaDefaults.criticalPriority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Critical Priority (hours)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="4"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Default response time in hours</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Escalation Rules Section */}
      <Card>
        <CardHeader>
          <CardTitle>Escalation Rules</CardTitle>
          <CardDescription>Define when and how tickets should be escalated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {fields.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>No escalation rules defined yet</p>
              <p className="text-sm">Click "Add Rule" to create your first escalation rule</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 rounded-lg border p-4">
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={control}
                        name={`escalationRules.${index}.afterHours`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">After Hours</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="24"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`escalationRules.${index}.escalateTo`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Escalate To</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ESCALATION_TARGETS.map((target) => (
                                  <SelectItem key={target} value={target}>
                                    {target.charAt(0).toUpperCase() + target.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={control}
                        name={`escalationRules.${index}.notifyVia`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Notify Via</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {NOTIFY_VIA_OPTIONS.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option === 'inApp' ? 'In-App' : option.charAt(0).toUpperCase() + option.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`escalationRules.${index}.enabled`}
                        render={({ field }) => (
                          <FormItem className="flex items-end gap-2">
                            <div className="flex-1">
                              <FormLabel className="text-sm">Enabled</FormLabel>
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
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="mt-0 self-start text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={addRule}
            className="gap-2 w-full mt-4"
          >
            <Plus className="h-4 w-4" />
            Add Escalation Rule
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
