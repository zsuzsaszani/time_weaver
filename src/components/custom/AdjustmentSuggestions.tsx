import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThumbsUp, ThumbsDown, Edit3, Wand2 } from 'lucide-react';

interface AdjustmentSuggestionsProps {
  suggestions: string;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  onRefine?: () => void; // For fetching more suggestions using schedule-adjuster
  isLoadingRefine?: boolean;
}

export function AdjustmentSuggestions({ 
  suggestions, 
  onAcceptAll, 
  onRejectAll,
  onRefine,
  isLoadingRefine
}: AdjustmentSuggestionsProps) {
  const suggestionLines = suggestions.split('\n').filter(line => line.trim() !== '');

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
          <Wand2 className="mr-2 h-7 w-7 text-primary" />
          Adjustment Suggestions
        </CardTitle>
        <CardDescription>AI-powered tips to potentially enhance your schedule.</CardDescription>
      </CardHeader>
      <CardContent>
        {suggestionLines.length > 0 ? (
          <>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4 mb-4 bg-muted/50">
              <pre className="whitespace-pre-wrap text-sm font-mono">{suggestions}</pre>
            </ScrollArea>
            <div className="flex flex-wrap gap-2 justify-end">
              {onAcceptAll && (
                <Button variant="outline" size="sm" onClick={onAcceptAll}>
                  <ThumbsUp className="mr-2 h-4 w-4" /> Accept All
                </Button>
              )}
              {onRejectAll && (
                <Button variant="outline" size="sm" onClick={onRejectAll}>
                  <ThumbsDown className="mr-2 h-4 w-4" /> Reject All
                </Button>
              )}
               {onRefine && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={onRefine} 
                  disabled={isLoadingRefine}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Edit3 className="mr-2 h-4 w-4" /> 
                  {isLoadingRefine ? 'Refining...' : 'Refine Further'}
                </Button>
              )}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">No suggestions available at the moment.</p>
        )}
      </CardContent>
    </Card>
  );
}
