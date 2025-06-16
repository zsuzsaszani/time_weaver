'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating an initial schedule based on user lifestyle assessment and commitments.
 *
 * - generateInitialSchedule - A function that generates an initial schedule.
 * - ScheduleInput - The input type for the generateInitialSchedule function.
 * - ScheduleOutput - The return type for the generateInitialSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScheduleInputSchema = z.object({
  lifestyleAssessment: z
    .string()
    .describe('A description of the user lifestyle and preferences.'),
  commitments: z
    .string()
    .describe('A description of the user commitments and fixed schedules.'),
});
export type ScheduleInput = z.infer<typeof ScheduleInputSchema>;

const ScheduleOutputSchema = z.object({
  schedule: z
    .string()
    .describe('A detailed schedule based on the user lifestyle and commitments.'),
  suggestions:
    z.string().describe('Suggestions for minor changes to improve the schedule.'),
});
export type ScheduleOutput = z.infer<typeof ScheduleOutputSchema>;

export async function generateInitialSchedule(input: ScheduleInput): Promise<ScheduleOutput> {
  return generateInitialScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInitialSchedulePrompt',
  input: {schema: ScheduleInputSchema},
  output: {schema: ScheduleOutputSchema},
  prompt: `You are an AI scheduling assistant. Your job is to generate an initial schedule that optimizes productivity and time balance.

  Consider the user's lifestyle assessment and their existing commitments.

  Lifestyle Assessment: {{{lifestyleAssessment}}}
  Commitments: {{{commitments}}}

  Generate a schedule and some suggestions for changes to improve the schedule.
  Ensure that the schedule is easily readable and well-organized.
  `,
});

const generateInitialScheduleFlow = ai.defineFlow(
  {
    name: 'generateInitialScheduleFlow',
    inputSchema: ScheduleInputSchema,
    outputSchema: ScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
