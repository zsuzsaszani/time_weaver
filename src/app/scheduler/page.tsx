
'use client';

import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/custom/AppHeader';
import { LifestyleAssessmentForm } from '@/components/custom/LifestyleAssessmentForm';
import { CommitmentDefinitionForm } from '@/components/custom/CommitmentDefinitionForm';
import { DesiredActivitiesForm } from '@/components/custom/DesiredActivitiesForm';
import { ScheduleDisplay } from '@/components/custom/ScheduleDisplay';
import { AdjustmentSuggestions } from '@/components/custom/AdjustmentSuggestions';
import { LoadingSpinner } from '@/components/custom/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { useToast } from '@/hooks/use-toast';
import type { LifestyleData, Commitment, DesiredActivity, AppStep } from '@/types';
import { generateScheduleAction, adjustScheduleAction, type ScheduleOutput, type ScheduleInput } from '@/lib/actions';
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function SchedulerPage() {
  const [currentStep, setCurrentStep] = useState<AppStep>('lifestyle');
  const [lifestyleData, setLifestyleData] = useState<LifestyleData | null>(null);
  const [commitments, setCommitments] = useState<Commitment[] | null>(null);
  const [desiredActivities, setDesiredActivities] = useState<DesiredActivity[] | null>(null);
  const [generatedSchedule, setGeneratedSchedule] = useState<ScheduleOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [lastScheduleInput, setLastScheduleInput] = useState<ScheduleInput | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (currentStep === 'lifestyle') setProgressValue(25);
    else if (currentStep === 'commitments') setProgressValue(50);
    else if (currentStep === 'activities') setProgressValue(75);
    else if (currentStep === 'schedule') setProgressValue(100);
  }, [currentStep]);

  const formatLifestyleDataForUser = (data: LifestyleData): string => {
    let assessment = `User typically wakes up around ${data.wakeUpTime || 'unspecified'} and goes to bed around ${data.bedTime || 'unspecified'}. `;
    assessment += `Eats ${data.mealsPerDay} meals a day. `;
    if (data.mealTimes) assessment += `Preferred meal times: ${data.mealTimes}. `;
    if (data.creativeWorkPreference) assessment += `Prefers to do creative work in the ${data.creativeWorkPreference}. `;
    if (data.focusedWorkPreference) assessment += `Prefers to do focused/deep work in the ${data.focusedWorkPreference}. `;
    if (data.exerciseInfo) assessment += `Exercise habits: ${data.exerciseInfo}. `;
    if (data.otherPreferences) assessment += `Other preferences: ${data.otherPreferences}.`;
    return assessment;
  };

  const formatCommitmentsForUser = (commitmentsData: Commitment[]): string => {
    if (!commitmentsData || commitmentsData.length === 0) return "No fixed commitments specified.";
    return commitmentsData.map(c => {
      let commitmentStr = `${c.name}: `;
      if (c.days && c.days.length > 0) {
        commitmentStr += `${c.days.join(', ')}. `;
      } else {
        commitmentStr += `(No specific days selected). `;
      }

      if (c.timeType === 'uniform' && c.uniformTime && c.uniformTime.startTime && c.uniformTime.endTime) {
        commitmentStr += `Uniform time: ${c.uniformTime.startTime} to ${c.uniformTime.endTime}.`;
      } else if (c.timeType === 'per-day' && c.daySpecificTimes && c.daySpecificTimes.length > 0) {
        const dayTimesString = c.daySpecificTimes
          .filter(dt => c.days.includes(dt.day) && dt.startTime && dt.endTime)
          .map(dt => `${dt.day}: ${dt.startTime} to ${dt.endTime}`)
          .join('; ');
        if (dayTimesString) {
          commitmentStr += `Specific times: ${dayTimesString}.`;
        } else {
          commitmentStr += `(Per-day times not fully specified).`;
        }
      } else {
        commitmentStr += `(Time configuration incomplete).`;
      }
      return commitmentStr;
    }).join('\n\n');
  };

  const formatDesiredActivitiesForUser = (activitiesData: DesiredActivity[]): string => {
    if (!activitiesData || activitiesData.length === 0) return "No desired activities specified.";
    return activitiesData.map(a => 
      `${a.name}: ${a.durationHours} hours ${a.frequency}, Min/Max Session: ${a.minDurationPerSession}h/${a.maxDurationPerSession}h, Preferred time: ${a.preferredTime}`
    ).join('\n');
  };

  const handleLifestyleSubmit = (data: LifestyleData) => {
    setLifestyleData(data);
    setCurrentStep('commitments');
  };

  const handleCommitmentsSubmit = (data: Commitment[]) => {
    setCommitments(data);
    setCurrentStep('activities');
  };

  const handleActivitiesSubmit = async (data: DesiredActivity[]) => {
    setDesiredActivities(data);
    if (!lifestyleData) {
      toast({ title: "Error", description: "Lifestyle data is missing. Please go back.", variant: "destructive" });
      return;
    }
    if (!commitments) {
      toast({ title: "Error", description: "Commitments data is missing. Please go back.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const lifestyleAssessment = formatLifestyleDataForUser(lifestyleData);
      const commitmentsString = formatCommitmentsForUser(commitments);
      const desiredActivitiesString = formatDesiredActivitiesForUser(data);
      
      const scheduleGenInput: ScheduleInput = { 
        lifestyleAssessment, 
        commitments: commitmentsString,
        desiredActivities: desiredActivitiesString 
      };
      setLastScheduleInput(scheduleGenInput);
      
      await new Promise(resolve => setTimeout(resolve, 500)); 
      const result = await generateScheduleAction(scheduleGenInput);
      setGeneratedSchedule(result);
      setCurrentStep('schedule');
    } catch (error) {
      toast({
        title: "Error Generating Schedule",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefineSuggestions = async () => {
    if (!lifestyleData || !generatedSchedule?.timetableHtml) {
      toast({ title: "Error", description: "Missing data for refinement.", variant: "destructive"});
      return;
    }
    setIsLoading(true);
    try {
      const lifestyleSummary = formatLifestyleDataForUser(lifestyleData);
      const userGoals = "Optimize for productivity and well-being, find better times for creative work, and integrate desired activities.";
      
      await new Promise(resolve => setTimeout(resolve, 500));
      const adjustmentResult = await adjustScheduleAction({
        lifestyleSummary,
        currentScheduleHtml: generatedSchedule.timetableHtml,
        userGoals,
      });

      setGeneratedSchedule(prev => {
        if (!prev) return null;
        return {
          ...prev,
          suggestions: `${prev.suggestions}\n\nFurther Refinements:\n${adjustmentResult.suggestedAdjustments}\nRationale:\n${adjustmentResult.rationale}`
        };
      });

       toast({
        title: "Suggestions Updated",
        description: "New suggestions have been added.",
      });

    } catch (error) {
      toast({
        title: "Error Refining Suggestions",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateSchedule = async () => {
    if (!lastScheduleInput) {
      toast({ title: "Error", description: "No previous input found to regenerate schedule.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); 
      const result = await generateScheduleAction(lastScheduleInput);
      setGeneratedSchedule(result);
      toast({ title: "Schedule Regenerated", description: "A new schedule variation has been generated." });
    } catch (error) {
      toast({
        title: "Error Regenerating Schedule",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetApp = () => {
    setCurrentStep('lifestyle');
    setLifestyleData(null);
    setCommitments(null);
    setDesiredActivities(null);
    setGeneratedSchedule(null);
    setLastScheduleInput(null);
    setProgressValue(0);
    toast({ title: "Form Reset", description: "You can start over now." });
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-2 px-4 selection:bg-primary/20 selection:text-primary">
      <AppHeader />
      <main className="container mx-auto max-w-4xl w-full flex flex-col items-center space-y-8 pb-12">
        <Button variant="link" asChild className="self-start mb-2 -mt-4">
            <Link href="/">Back to Welcome</Link>
        </Button>
        <Progress value={progressValue} className="w-full mb-6 h-3" />
        {isLoading && (
          <div className="flex flex-col items-center justify-center space-y-4 p-8">
            <LoadingSpinner size={48} />
            <p className="text-lg text-primary font-medium">Processing your information... please wait.</p>
          </div>
        )}

        {!isLoading && currentStep === 'lifestyle' && (
          <LifestyleAssessmentForm 
            onSubmit={handleLifestyleSubmit} 
            defaultValues={lifestyleData || undefined} 
          />
        )}

        {!isLoading && currentStep === 'commitments' && (
          <CommitmentDefinitionForm 
            onSubmit={handleCommitmentsSubmit} 
            onBack={() => setCurrentStep('lifestyle')}
            defaultValues={commitments || undefined}
          />
        )}

        {!isLoading && currentStep === 'activities' && (
          <DesiredActivitiesForm
            onSubmit={handleActivitiesSubmit}
            onBack={() => setCurrentStep('commitments')}
            defaultValues={desiredActivities || undefined}
          />
        )}

        {!isLoading && currentStep === 'schedule' && generatedSchedule && (
          <>
            <ScheduleDisplay 
              summaryLifestyle={generatedSchedule.summaryLifestyle}
              summaryCommitments={generatedSchedule.summaryCommitments}
              summaryDesiredActivities={generatedSchedule.summaryDesiredActivities}
              timetableHtml={generatedSchedule.timetableHtml}
            />
            <AdjustmentSuggestions 
              suggestions={generatedSchedule.suggestions}
              onRefine={handleRefineSuggestions}
              isLoadingRefine={isLoading}
            />
            <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full justify-center">
              <Button variant="default" onClick={resetApp} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Start Over
              </Button>
              <Button variant="outline" onClick={handleRegenerateSchedule} disabled={isLoading}>
                <RefreshCw className="mr-2 h-4 w-4" /> 
                {isLoading ? 'Regenerating...' : 'Regenerate Schedule'}
              </Button>
            </div>
          </>
        )}
         {!isLoading && currentStep === 'schedule' && !generatedSchedule && (
          <div className="text-center p-8">
            <p className="text-muted-foreground mb-4">Something went wrong, or no schedule was generated.</p>
            <Button variant="outline" onClick={resetApp}>Start Over</Button>
          </div>
        )}
      </main>
    </div>
  );
}
