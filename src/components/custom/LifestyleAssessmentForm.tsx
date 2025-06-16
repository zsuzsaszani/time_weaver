
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { LifestyleData } from '@/types';
import { Lightbulb } from 'lucide-react';

const lifestyleFormSchema = z.object({
  wakeUpTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)"}).optional().or(z.literal("")),
  bedTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)"}).optional().or(z.literal("")),
  mealsPerDay: z.string().min(1, { message: 'Required' }),
  mealTimes: z.string().optional(),
  creativeWorkPreference: z.enum(['morning', 'afternoon', 'evening', '']),
  focusedWorkPreference: z.enum(['morning', 'afternoon', 'evening', '']), // Added new field
  exerciseInfo: z.string().optional(),
  otherPreferences: z.string().optional(),
});

type LifestyleFormValues = z.infer<typeof lifestyleFormSchema>;

interface LifestyleAssessmentFormProps {
  onSubmit: (data: LifestyleData) => void;
  onBack?: () => void;
  defaultValues?: Partial<LifestyleData>;
}

export function LifestyleAssessmentForm({ onSubmit, onBack, defaultValues }: LifestyleAssessmentFormProps) {
  const form = useForm<LifestyleFormValues>({
    resolver: zodResolver(lifestyleFormSchema),
    defaultValues: {
      wakeUpTime: defaultValues?.wakeUpTime || '',
      bedTime: defaultValues?.bedTime || '',
      mealsPerDay: defaultValues?.mealsPerDay || '3',
      mealTimes: defaultValues?.mealTimes || '',
      creativeWorkPreference: defaultValues?.creativeWorkPreference || '',
      focusedWorkPreference: defaultValues?.focusedWorkPreference || '', // Added new field
      exerciseInfo: defaultValues?.exerciseInfo || '',
      otherPreferences: defaultValues?.otherPreferences || '',
    },
  });

  function handleFormSubmit(data: LifestyleFormValues) {
    onSubmit(data as LifestyleData);
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl flex items-center">
          <Lightbulb className="mr-2 h-8 w-8 text-primary" />
          Lifestyle Assessment
        </CardTitle>
        <CardDescription>Help us understand your daily habits and preferences to tailor your schedule.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="wakeUpTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typical Wake-Up Time (HH:MM)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bedTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typical Bedtime (HH:MM)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="mealsPerDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How many meals do you typically eat per day?</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mealTimes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Any preferred times for meals? (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Lunch around 1 PM, Dinner not too late" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="creativeWorkPreference"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>When do you prefer to do creative work? (Optional)</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1 md:flex-row md:space-x-4 md:space-y-0"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="morning" />
                        </FormControl>
                        <FormLabel className="font-normal">Morning</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="afternoon" />
                        </FormControl>
                        <FormLabel className="font-normal">Afternoon</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="evening" />
                        </FormControl>
                        <FormLabel className="font-normal">Evening</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="focusedWorkPreference"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>When do you prefer to do focused/deep work? (Optional)</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1 md:flex-row md:space-x-4 md:space-y-0"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="morning" />
                        </FormControl>
                        <FormLabel className="font-normal">Morning</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="afternoon" />
                        </FormControl>
                        <FormLabel className="font-normal">Afternoon</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="evening" />
                        </FormControl>
                        <FormLabel className="font-normal">Evening</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="exerciseInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Any regular exercise? If so, when and for how long? (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Morning run 30 mins, Gym Mon/Wed/Fri 6 PM - 7 PM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="otherPreferences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Other preferences or non-negotiable personal time? (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Daily meditation 15 mins, Family time 7 PM - 8 PM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              {onBack && <Button type="button" variant="outline" onClick={onBack}>Back</Button>}
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Next: Define Commitments
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
