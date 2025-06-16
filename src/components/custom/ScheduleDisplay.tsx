
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, CalendarDays } from 'lucide-react';

interface ScheduleDisplayProps {
  summaryLifestyle: string;
  summaryCommitments: string;
  summaryDesiredActivities: string;
  timetableHtml: string;
}

export function ScheduleDisplay({ 
  summaryLifestyle, 
  summaryCommitments, 
  summaryDesiredActivities, 
  timetableHtml 
}: ScheduleDisplayProps) {
  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl flex items-center">
          <FileText className="mr-2 h-8 w-8 text-primary" />
          Your Personalized Schedule
        </CardTitle>
        <CardDescription>Here's the overview and timetable generated based on your input.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-headline text-xl flex items-center text-primary mb-2">
            <CalendarDays className="mr-2 h-5 w-5" />
            Lifestyle Summary
          </h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-md">{summaryLifestyle || "Not provided."}</p>
        </div>
        
        <div>
          <h3 className="font-headline text-xl flex items-center text-primary mb-2">
            <CalendarDays className="mr-2 h-5 w-5" />
            Fixed Commitments Summary
          </h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-md">{summaryCommitments || "No commitments listed."}</p>
        </div>

        <div>
          <h3 className="font-headline text-xl flex items-center text-primary mb-2">
            <CalendarDays className="mr-2 h-5 w-5" />
            Desired Activities Summary
          </h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-md">{summaryDesiredActivities || "No desired activities listed."}</p>
        </div>
        
        <div>
          <h3 className="font-headline text-xl flex items-center text-primary mb-2">
             <CalendarDays className="mr-2 h-5 w-5" />
            Proposed Timetable
          </h3>
          {timetableHtml ? (
           <ScrollArea className="h-[500px] w-full rounded-md border bg-muted/20">
             <div className="p-1 md:p-2" dangerouslySetInnerHTML={{ __html: timetableHtml }} />
           </ScrollArea>
          ) : (
            <p className="text-muted-foreground">Timetable could not be generated.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
