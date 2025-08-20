import { useState, useEffect } from "react";
import { History, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface HistoryItem {
  user_input: string;
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
  text: string;
  embedding: number[];
  feedback: string;
}

interface HistorySidebarProps {
  refreshTrigger: number;
}

export const HistorySidebar = ({ refreshTrigger }: HistorySidebarProps) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/get_history');
      if (response.ok) {
        const data = await response.json();
        setHistory(Array.isArray(data) ? data : []);
      } else {
        console.error('[NCO] Failed to load history');
        setHistory([]);
      }
    } catch (error) {
      console.error('[NCO] Error loading history:', error);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/clear_history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "History Cleared",
          description: data.message || "Search history has been cleared",
        });
        setHistory([]);
      } else {
        throw new Error('Failed to clear history');
      }
    } catch (error) {
      console.error('[NCO] Error clearing history:', error);
      toast({
        title: "Error",
        description: "Failed to clear history. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadHistory();
  }, [refreshTrigger]);

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5" />
            Search History
          </CardTitle>
          <div className="flex gap-1">
            <Button
              onClick={loadHistory}
              variant="ghost"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={clearHistory}
              variant="ghost"
              size="sm"
              disabled={history.length === 0}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <p>No search history available</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {history.map((item, index) => (
                <div
                  key={`${item.NCO2015}-${index}`}
                  className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm line-clamp-2">
                        {item.title}
                      </h4>
                      {item.feedback && (
                        <Badge
                          variant={item.feedback === 'good' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {item.feedback}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p><span className="font-medium">NCO 2015:</span> {item.NCO2015}</p>
                      <p><span className="font-medium">Confidence:</span> {(item.confidence * 100).toFixed(1)}%</p>
                      {item.user_input && (
                        <p><span className="font-medium">Search:</span> {item.user_input}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};