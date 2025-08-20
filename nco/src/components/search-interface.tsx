import { useState } from "react";
import { Search, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { VoiceRecorder } from "@/components/voice-recorder";
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

interface SearchInterfaceProps {
  onResults: (results: SearchResult[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const SearchInterface = ({ onResults, isLoading, setIsLoading }: SearchInterfaceProps) => {
  const [searchText, setSearchText] = useState("");
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const { toast } = useToast();

  const handleTextSearch = async () => {
    if (!searchText.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/submit_text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: searchText }),
      });
      
      const data = await response.json();
      console.log('[NCO] API response:', data);
      
      // Extract results array from the response
      const results = data.results || [];
      console.log('[NCO] Extracted results array:', results);
      
      onResults(results);
      
      if (results.length === 0) {
        toast({
          title: "No Results",
          description: "No matching occupations found for your search.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[NCO] Error fetching data:', error);
      toast({
        title: "Search Error",
        description: "Failed to connect to the server. Please try again.",
        variant: "destructive",
      });
      onResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceSearch = async (audioBlob: Blob) => {
    setIsLoading(true);
    setShowVoiceRecorder(false);
    
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');

      const response = await fetch('http://127.0.0.1:5000/submit_voice', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('[NCO] Voice API response:', data);
      
      // Extract results array from the nested response structure
      const results = data.results?.results || [];
      console.log('[NCO] Voice results:', results);
      
      onResults(results);
      
      if (data.transcription) {
        setSearchText(data.transcription);
        toast({
          title: "Voice Recognized",
          description: `Transcription: "${data.transcription}"`,
        });
      }
      
      if (results.length === 0) {
        toast({
          title: "No Results",
          description: "No matching occupations found for your voice search.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[NCO] Voice search error:', error);
      toast({
        title: "Voice Search Error",
        description: "Failed to process voice input. Please try again.",
        variant: "destructive",
      });
      onResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTextSearch();
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-center text-primary">
            Search National Classification of Occupation
          </h2>
          
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Enter occupation name or description..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              disabled={isLoading}
            />
            
            <Button
              onClick={handleTextSearch}
              disabled={isLoading}
              className="px-6"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            
            <Button
              onClick={() => setShowVoiceRecorder(true)}
              variant="outline"
              className="px-4"
              disabled={isLoading}
            >
              <Mic className="w-4 h-4" />
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Searching...</span>
            </div>
          )}
        </div>
      </CardContent>

      <VoiceRecorder
        isOpen={showVoiceRecorder}
        onClose={() => setShowVoiceRecorder(false)}
        onRecordingComplete={handleVoiceSearch}
      />
    </Card>
  );
};