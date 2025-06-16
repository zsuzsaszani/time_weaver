
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { DesiredActivity, ActivityFrequency, PreferredTime } from '@/types';
import { PlusCircle, Trash2, ListChecks } from 'lucide-react';

const activityFrequencyValues: [ActivityFrequency, ...ActivityFrequency[]] = ['daily', 'weekly'];
const preferredTimeValues: [PreferredTime, ...PreferredTime[]] = ['any', 'morning', 'afternoon', 'evening'];

const numberOrDecimalString = z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a positive number (e.g., 1, 0.5, 2.5)");

const desiredActivityItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Activity name is required.'),
  durationHours: numberOrDecimalString.min(1, 'Duration is required'),
  minDurationPerSession: numberOrDecimalString.min(1, 'Min session duration is required'),
  maxDurationPerSession: numberOrDecimalString.min(1, 'Max session duration is required'),
  frequency: z.enum(activityFrequencyValues, { required_error: 'Frequency is required.' }),
  preferredTime: z.enum(preferredTimeValues, { required_error: 'Preferred time is required.' }),
}).refine(data => {
    const duration = parseFloat(data.durationHours);
    const minSession = parseFloat(data.minDurationPerSession);
    const maxSession = parseFloat(data.maxDurationPerSession);
    if (minSession > maxSession) {
        return false;
    }
    if (data.frequency === 'daily' && (duration < minSession || duration > maxSession)) {
        return false;
    }
    if (data.frequency === 'weekly' && duration < minSession ) { // Total weekly hours must be at least min session
        return false;
    }
    return true;
}, (data) => {
    const duration = parseFloat(data.durationHours);
    const minSession = parseFloat(data.minDurationPerSession);
    const maxSession = parseFloat(data.maxDurationPerSession);

    if (minSession > maxSession) {
        return { message: 'Min session duration cannot exceed Max.', path: ['minDurationPerSession'] };
    }
    if (data.frequency === 'daily' && (duration < minSession || duration > maxSession)) {
        return { message: 'Daily duration must be between Min and Max session duration.', path: ['durationHours'] };
    }
     if (data.frequency === 'weekly' && duration < minSession ) {
        return { message: 'Total weekly hours must be at least the Min session duration.', path: ['durationHours'] };
    }
    return { message: "Invalid configuration."}; // Fallback, should be caught by specific checks
});


const desiredActivitiesFormSchema = z.object({
  activities: z.array(desiredActivityItemSchema),
});

type DesiredActivitiesFormValues = z.infer<typeof desiredActivitiesFormSchema>;

const newActivityTemplate: Omit<DesiredActivity, 'id'> = {
  name: '',
  durationHours: '1',
  minDurationPerSession: '0.5',
  maxDurationPerSession: '2',
  frequency: 'weekly',
  preferredTime: 'any',
};

interface DesiredActivitiesFormProps {
  onSubmit: (activities: DesiredActivity[]) => void;
  onBack?: () => void;
  defaultValues?: DesiredActivity[];
}

export function DesiredActivitiesForm({ onSubmit, onBack, defaultValues: propDefaultValues }: DesiredActivitiesFormProps) {
  const initialFormValues = React.useMemo(() => {
    const mapActivityToForm = (act: Partial<DesiredActivity>, newId?: string) => ({
        id: act.id || newId || `new_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: act.name || '',
        durationHours: act.durationHours || '1',
        minDurationPerSession: act.minDurationPerSession || '0.5',
        maxDurationPerSession: act.maxDurationPerSession || '2',
        frequency: act.frequency || 'weekly',
        preferredTime: act.preferredTime || 'any',
    });

    if (propDefaultValues && propDefaultValues.length > 0) {
      return { activities: propDefaultValues.map(act => mapActivityToForm(act)) };
    }
    return { 
      activities: [mapActivityToForm(newActivityTemplate)]
    };
  }, [propDefaultValues]);

  const form = useForm<DesiredActivitiesFormValues>({
    resolver: zodResolver(desiredActivitiesFormSchema),
    defaultValues: initialFormValues,
    mode: 'onChange', 
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'activities',
    keyName: "fieldId",
  });

  const watchedActivities = form.watch('activities');

  function handleFormSubmit(data: DesiredActivitiesFormValues) {
    onSubmit(data.activities);
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl flex items-center">
          <ListChecks className="mr-2 h-8 w-8 text-primary" />
          Define Your Desired Activities
        </CardTitle>
        <CardDescription>List activities you want to make time for, like hobbies, learning, or exercise.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
            {fields.map((field, index) => (
              <div key={field.fieldId} className="p-4 border rounded-lg space-y-4 relative shadow bg-card">
                <FormField
                  control={form.control}
                  name={`activities.${index}.name`}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>Activity Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Learn Guitar, Read, Jogging" {...formField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name={`activities.${index}.frequency`}
                        render={({ field: formField }) => (
                        <FormItem>
                            <FormLabel>Frequency</FormLabel>
                            <FormControl>
                            <RadioGroup
                                onValueChange={(value) => {
                                    formField.onChange(value);
                                    form.trigger(`activities.${index}.durationHours`); // Trigger validation for duration
                                }}
                                value={formField.value}
                                className="flex space-x-4"
                            >
                                <FormItem className="flex items-center space-x-2">
                                <FormControl><RadioGroupItem value="daily" /></FormControl>
                                <FormLabel className="font-normal">Daily</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2">
                                <FormControl><RadioGroupItem value="weekly" /></FormControl>
                                <FormLabel className="font-normal">Weekly</FormLabel>
                                </FormItem>
                            </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name={`activities.${index}.durationHours`}
                        render={({ field: formField }) => (
                        <FormItem>
                            <FormLabel>
                            {watchedActivities[index]?.frequency === 'weekly' ? 'Total Weekly Hours' : 'Duration (Hours per day)'}
                            </FormLabel>
                            <FormControl>
                            <Input type="text" placeholder="e.g., 1.5" {...formField} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name={`activities.${index}.minDurationPerSession`}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>Min. Hours per Session</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="e.g., 0.5" {...formField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`activities.${index}.maxDurationPerSession`}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>Max. Hours per Session</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="e.g., 2" {...formField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name={`activities.${index}.preferredTime`}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>Preferred Time of Day</FormLabel>
                      <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select preferred time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="any">Any Time</SelectItem>
                          <SelectItem value="morning">Morning (7 AM - 12 PM)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                          <SelectItem value="evening">Evening (5 PM - 10 PM)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(index)}
                    className="absolute top-2 right-2"
                    aria-label="Remove activity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ 
                id: `new_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, 
                ...JSON.parse(JSON.stringify(newActivityTemplate)) 
              })}
              className="w-full border-dashed"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Another Activity
            </Button>

            <div className="flex justify-between items-center pt-4">
              {onBack && <Button type="button" variant="outline" onClick={onBack}>Back</Button>}
              <div className="flex-grow"></div>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Generate Schedule & Timetable
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
