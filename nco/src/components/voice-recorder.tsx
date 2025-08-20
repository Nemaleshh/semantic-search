import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Square, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordingComplete: (audioBlob: Blob) => void;
}

export const VoiceRecorder = ({ isOpen, onClose, onRecordingComplete }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorder.current = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.current.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "Recording Started",
        description: "Speak clearly in English or Hindi",
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }

      toast({
        title: "Recording Stopped",
        description: "You can now play back or submit your recording",
      });
    }
  };

  const playRecording = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const submitRecording = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
      handleClose();
    }
  };

  const handleClose = () => {
    setIsRecording(false);
    setAudioBlob(null);
    setRecordingTime(0);
    setIsPlaying(false);
    
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
    
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
    }
    
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Voice Search</DialogTitle>
        </DialogHeader>
        
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Supported Languages: <span className="font-medium">English, Hindi</span>
              </p>
              <div className="text-lg font-mono">
                {formatTime(recordingTime)}
              </div>
            </div>

            <div className="flex justify-center">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="rounded-full w-16 h-16"
                  disabled={isPlaying}
                >
                  <Mic className="w-6 h-6" />
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                  className="rounded-full w-16 h-16 animate-pulse"
                >
                  <Square className="w-6 h-6" />
                </Button>
              )}
            </div>

            {audioBlob && (
              <div className="space-y-3">
                <div className="flex justify-center gap-3">
                  <Button
                    onClick={playRecording}
                    variant="outline"
                    disabled={isPlaying}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isPlaying ? 'Playing...' : 'Play'}
                  </Button>
                  
                  <Button
                    onClick={submitRecording}
                    className="px-6"
                  >
                    Submit Recording
                  </Button>
                </div>
              </div>
            )}

            {isRecording && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Recording in progress... Click stop when finished
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};