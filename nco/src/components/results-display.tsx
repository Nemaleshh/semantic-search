import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface SearchResult {
  title: string;
  NCO2004: string;
  NCO2015: string;
  confidence: number;
  hierarchy: {
    division: string;
    family: string;
    group: string;
    subdivision: string;
  };
}

interface ResultsDisplayProps {
  results: SearchResult[];
  isLoading: boolean;
  onFeedback?: () => void;
}

export const ResultsDisplay = ({ results, isLoading, onFeedback }: ResultsDisplayProps) => {
  const [feedbackStates, setFeedbackStates] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  const sendFeedback = async (feedback: 'good' | 'bad', result: SearchResult) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: feedback,
          result: result,
          user_input: result.title // Using title as fallback for user input
        }),
      });

      if (response.ok) {
        const key = `${result.NCO2015}-${result.title}`;
        setFeedbackStates(prev => ({ ...prev, [key]: feedback }));
        
        console.log(`[NCO] Feedback sent: ${feedback} for: ${result.title}`);
        
        toast({
          title: "Feedback Submitted",
          description: `Thank you for your ${feedback} feedback!`,
        });

        if (onFeedback) {
          onFeedback();
        }
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('[NCO] Error sending feedback:', error);
      toast({
        title: "Feedback Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-6 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            No results to display. Try searching for an occupation.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-primary">
        Search Results ({results.length} found)
      </h3>
      
      {results.map((result, index) => {
        const key = `${result.NCO2015}-${result.title}`;
        const currentFeedback = feedbackStates[key];
        
        return (
          <Card key={`${result.NCO2015}-${index}`} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg text-primary">{result.title}</CardTitle>
                <Badge variant="secondary" className="ml-2">
                  {(result.confidence * 100).toFixed(1)}%
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">NCO 2015:</span>
                  <p className="font-mono">{result.NCO2015}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">NCO 2004:</span>
                  <p className="font-mono">{result.NCO2004 || "-"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-muted-foreground">Hierarchy:</h4>
                <div className="text-sm space-y-1 pl-4 border-l-2 border-primary/20">
                  <p><span className="font-medium">Division:</span> {result.hierarchy.division}</p>
                  <p><span className="font-medium">Subdivision:</span> {result.hierarchy.subdivision}</p>
                  <p><span className="font-medium">Group:</span> {result.hierarchy.group}</p>
                  <p><span className="font-medium">Family:</span> {result.hierarchy.family}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => sendFeedback('good', result)}
                  variant={currentFeedback === 'good' ? 'default' : 'outline'}
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={!!currentFeedback}
                >
                  <ThumbsUp className="w-4 h-4" />
                  Good
                </Button>
                
                <Button
                  onClick={() => sendFeedback('bad', result)}
                  variant={currentFeedback === 'bad' ? 'destructive' : 'outline'}
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={!!currentFeedback}
                >
                  <ThumbsDown className="w-4 h-4" />
                  Bad
                </Button>

                {currentFeedback && (
                  <Badge variant={currentFeedback === 'good' ? 'default' : 'destructive'}>
                    Feedback: {currentFeedback}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};