
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
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Commitment, DayOfWeek, TimeSlot, DaySpecificTime } from '@/types';
import { PlusCircle, Trash2, CalendarDays } from 'lucide-react';

const daysOfWeek: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const daysOfWeekEnumValues = daysOfWeek as [DayOfWeek, ...DayOfWeek[]];


const timeSlotSchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "HH:MM format").optional().or(z.literal("")),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "HH:MM format").optional().or(z.literal("")),
}).refine(data => {
  if (data.startTime && data.endTime) {
    return data.endTime > data.startTime;
  }
  return true;
}, { message: "End time must be after start time.", path: ["endTime"] });

const daySpecificTimeSchema = z.object({
  day: z.enum(daysOfWeekEnumValues),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "HH:MM").optional().or(z.literal("")),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "HH:MM").optional().or(z.literal("")),
}).refine(data => {
  if (data.startTime && data.endTime) {
    return data.endTime > data.startTime;
  }
  return true;
}, { message: "End time must be after start time.", path: ["endTime"] });

const commitmentItemSchema = z.object({
  id: z.string(), 
  name: z.string().min(1, 'Commitment name is required.'),
  days: z.array(z.enum(daysOfWeekEnumValues)).min(1, 'Select at least one day.'),
  timeType: z.enum(['uniform', 'per-day']),
  uniformTime: timeSlotSchema.optional(),
  daySpecificTimes: z.array(daySpecificTimeSchema).optional(),
}).superRefine((data, ctx) => {
  if (data.timeType === 'uniform') {
    if (!data.uniformTime || !data.uniformTime.startTime || !data.uniformTime.endTime) {
      if (!data.uniformTime?.startTime) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['uniformTime', 'startTime'], message: 'Start time is required for uniform.' });
      if (!data.uniformTime?.endTime) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['uniformTime', 'endTime'], message: 'End time is required for uniform.' });
    }
  } else if (data.timeType === 'per-day') {
    if (!data.daySpecificTimes || data.daySpecificTimes.length === 0) {
       if (data.days.length > 0) { 
         ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['daySpecificTimes'], message: 'Times for selected days are required.' });
       }
    } else {
        let allPerDayTimesValid = true;
        data.days.forEach(selectedDay => {
            const timeEntry = data.daySpecificTimes?.find(dt => dt.day === selectedDay);
            if (!timeEntry || !timeEntry.startTime || !timeEntry.endTime) {
                allPerDayTimesValid = false;
                 ctx.addIssue({ 
                    code: z.ZodIssueCode.custom, 
                    path: ['daySpecificTimes'], // General path, specific errors will be on inputs
                    message: `Time for ${selectedDay} is incomplete.` 
                });
            }
        });
        if (!allPerDayTimesValid && data.daySpecificTimes.length !== data.days.length) {
             // This condition might be redundant if individual day checks are thorough
        }
    }
  }
});

const commitmentsFormSchema = z.object({
  commitments: z.array(commitmentItemSchema),
});

type CommitmentsFormValues = z.infer<typeof commitmentsFormSchema>;

const newCommitmentTemplate: Omit<Commitment, 'id'> = {
  name: '',
  days: [],
  timeType: 'uniform',
  uniformTime: { startTime: '', endTime: '' },
  daySpecificTimes: [],
};

interface CommitmentDefinitionFormProps {
  onSubmit: (commitments: Commitment[]) => void;
  onBack?: () => void;
  defaultValues?: Commitment[]; 
}

export function CommitmentDefinitionForm({ onSubmit, onBack, defaultValues: propDefaultValues }: CommitmentDefinitionFormProps) {
  
  const initialFormValues = React.useMemo(() => {
    const mapCommitmentToFormValue = (cv: Partial<Commitment>, newId?: string) => ({
      id: cv.id || newId || `new_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: cv.name || '',
      days: cv.days || [],
      timeType: cv.timeType || 'uniform',
      uniformTime: {
        startTime: cv.uniformTime?.startTime || '',
        endTime: cv.uniformTime?.endTime || '',
      },
      daySpecificTimes: (cv.daySpecificTimes || []).map(dst => ({
        day: dst.day,
        startTime: dst.startTime || '',
        endTime: dst.endTime || '',
      })),
    });


    if (propDefaultValues && propDefaultValues.length > 0) {
      return { commitments: propDefaultValues.map(cv => mapCommitmentToFormValue(cv)) };
    }
    return { commitments: [mapCommitmentToFormValue(newCommitmentTemplate)] };
  }, [propDefaultValues]);


  const form = useForm<CommitmentsFormValues>({
    resolver: zodResolver(commitmentsFormSchema),
    defaultValues: initialFormValues,
    mode: 'onChange', // Validate on change for better UX
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'commitments',
    keyName: "fieldId", 
  });

  const watchedCommitments = form.watch('commitments');

  fields.forEach((field, index) => {
    React.useEffect(() => {
      const commitment = watchedCommitments[index];
      if (!commitment) return;

      const selectedDays = commitment.days || [];
      const currentTimeType = commitment.timeType;
      
      // Ensure daySpecificTimes is an array
      const currentDaySpecificTimes = form.getValues(`commitments.${index}.daySpecificTimes`) || [];


      if (currentTimeType === 'per-day') {
        const newDaySpecificTimes = selectedDays.map(day => {
          const existing = Array.isArray(currentDaySpecificTimes) ? currentDaySpecificTimes.find(dt => dt.day === day) : undefined;
          return { 
            day, 
            startTime: existing?.startTime || '', 
            endTime: existing?.endTime || '' 
          };
        });
        
        // Only update if there's an actual structural change or if currentDaySpecificTimes was not an array
        if (JSON.stringify(newDaySpecificTimes) !== JSON.stringify(currentDaySpecificTimes) || !Array.isArray(currentDaySpecificTimes)) {
          form.setValue(`commitments.${index}.daySpecificTimes`, newDaySpecificTimes, { shouldValidate: true });
        }

      } else { // Uniform time
         const currentUniformTime = form.getValues(`commitments.${index}.uniformTime`);
         if (!currentUniformTime || typeof currentUniformTime.startTime === 'undefined' || typeof currentUniformTime.endTime === 'undefined') {
            form.setValue(`commitments.${index}.uniformTime`, { startTime: '', endTime: '' }, { shouldValidate: false });
         }
         // Clear daySpecificTimes if switching to uniform and they exist
         if (Array.isArray(currentDaySpecificTimes) && currentDaySpecificTimes.length > 0) {
           form.setValue(`commitments.${index}.daySpecificTimes`, [], { shouldValidate: false });
         }
      }
    }, [form, index, watchedCommitments[index]?.days, watchedCommitments[index]?.timeType]);
  });


  function handleFormSubmit(data: CommitmentsFormValues) {
    const formattedCommitments: Commitment[] = data.commitments.map(c => ({
      id: c.id, 
      name: c.name,
      days: c.days,
      timeType: c.timeType,
      uniformTime: c.timeType === 'uniform' ? {startTime: c.uniformTime?.startTime || '', endTime: c.uniformTime?.endTime || ''} : undefined,
      daySpecificTimes: c.timeType === 'per-day' 
        ? (c.daySpecificTimes || []).filter(dt => c.days.includes(dt.day)).map(dt => ({...dt, startTime: dt.startTime || '', endTime: dt.endTime || ''}))
        : undefined,
    }));
    onSubmit(formattedCommitments);
  }
  
  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl flex items-center">
          <CalendarDays className="mr-2 h-8 w-8 text-primary" />
          Define Your Commitments
        </CardTitle>
        <CardDescription>List your fixed commitments like work, school, or appointments.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
            {fields.map((field, index) => ( 
              <div key={field.fieldId} className="p-4 border rounded-lg space-y-4 relative shadow">
                <FormField
                  control={form.control}
                  name={`commitments.${index}.name`}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>Commitment Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Work, Math Class" {...formField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`commitments.${index}.days`}
                  render={() => (
                    <FormItem>
                      <FormLabel>Days of the Week</FormLabel>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                        {daysOfWeek.map((day) => (
                          <FormField
                            key={day}
                            control={form.control}
                            name={`commitments.${index}.days`}
                            render={({ field: daysField }) => {
                              return (
                                <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={daysField.value?.includes(day)}
                                      onCheckedChange={(checked) => {
                                        const newValue = checked
                                          ? [...(daysField.value || []), day]
                                          : (daysField.value || []).filter(v => v !== day);
                                        daysField.onChange(newValue);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{day}</FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`commitments.${index}.timeType`}
                  render={({ field: timeTypeField }) => (
                    <FormItem>
                      <FormLabel>Time Configuration</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            timeTypeField.onChange(value);
                          }}
                          value={timeTypeField.value}
                          className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2">
                            <FormControl><RadioGroupItem value="uniform" /></FormControl>
                            <FormLabel className="font-normal">Same time for all selected days</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl><RadioGroupItem value="per-day" /></FormControl>
                            <FormLabel className="font-normal">Different time per selected day</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedCommitments[index]?.timeType === 'uniform' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                    <FormField
                      control={form.control}
                      name={`commitments.${index}.uniformTime.startTime`}
                      render={({ field: startTimeField }) => (
                        <FormItem>
                          <FormLabel>Start Time (HH:MM)</FormLabel>
                          <FormControl><Input type="time" {...startTimeField} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`commitments.${index}.uniformTime.endTime`}
                      render={({ field: endTimeField }) => (
                        <FormItem>
                          <FormLabel>End Time (HH:MM)</FormLabel>
                          <FormControl><Input type="time" {...endTimeField} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {watchedCommitments[index]?.timeType === 'per-day' && watchedCommitments[index]?.days && watchedCommitments[index]?.days.length > 0 && (
                  <div className="space-y-3 mt-2">
                    <FormLabel className="text-sm font-medium">Set times for each selected day:</FormLabel>
                    {(watchedCommitments[index]?.daySpecificTimes || []).map((dayTime, daySpecificIndex) => (
                       <div key={`${field.fieldId}-${dayTime.day}-${daySpecificIndex}`} className="p-3 border rounded-md bg-muted/30">
                        <FormLabel className="font-medium text-sm">{dayTime.day}</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mt-1">
                          <FormField
                            control={form.control}
                            name={`commitments.${index}.daySpecificTimes.${daySpecificIndex}.startTime`}
                            render={({ field: dayStartTimeField }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Start Time</FormLabel>
                                <FormControl><Input type="time" {...dayStartTimeField} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`commitments.${index}.daySpecificTimes.${daySpecificIndex}.endTime`}
                            render={({ field: dayEndTimeField }) => (
                              <FormItem>
                                <FormLabel className="text-xs">End Time</FormLabel>
                                <FormControl><Input type="time" {...dayEndTimeField} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                     <Controller
                        control={form.control}
                        name={`commitments.${index}.daySpecificTimes`}
                        render={({ fieldState }) => fieldState.error ? <FormMessage>{fieldState.error.message || fieldState.error.root?.message}</FormMessage> : null}
                      />
                  </div>
                )}

                {fields.length > 1 && (
                   <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(index)}
                    className="absolute top-2 right-2"
                    aria-label="Remove commitment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const newId = `new_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                append({
                  id: newId, 
                  ...JSON.parse(JSON.stringify(newCommitmentTemplate))
                });
              }}
              className="w-full border-dashed"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Another Commitment
            </Button>

            <div className="flex justify-between items-center pt-4">
               {onBack && <Button type="button" variant="outline" onClick={onBack}>Back</Button>}
               <div className="flex-grow"></div> {}
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Next: Define Desired Activities
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

