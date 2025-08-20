import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface FeedbackData {
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
  feedback: string;
}

interface VoiceData {
  timestamp: string;
  transcription: string;
  results: Array<{
    title: string;
    NCO2015: string;
    confidence: number;
  }>;
}

export const AdminDashboard = () => {
  const [feedbackData, setFeedbackData] = useState<FeedbackData[]>([]);
  const [voiceData, setVoiceData] = useState<VoiceData[]>([]);
  const [selectedTranscription, setSelectedTranscription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Data entry form state
  const [entryCode, setEntryCode] = useState("");
  const [entryName, setEntryName] = useState("");
  const [entryType, setEntryType] = useState<string>("");
  const [codeError, setCodeError] = useState<string>("");
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch feedback data
      const feedbackResponse = await fetch('http://127.0.0.1:5000/feedback-data');
      if (feedbackResponse.ok) {
        const feedbackJson = await feedbackResponse.json();
        setFeedbackData(Array.isArray(feedbackJson) ? feedbackJson : []);
      }

      // Fetch voice data
      const voiceResponse = await fetch('http://127.0.0.1:5000/voice-data');
      if (voiceResponse.ok) {
        const voiceJson = await voiceResponse.json();
        setVoiceData(Array.isArray(voiceJson) ? voiceJson : []);
        if (voiceJson.length > 0) {
          setSelectedTranscription(voiceJson[0].transcription);
        }
      }
    } catch (error) {
      console.error('[Admin] Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Process feedback data for pie chart
  const processFeedbackPieData = () => {
    const goodCount = feedbackData.filter(item => item.feedback === 'good').length;
    const badCount = feedbackData.filter(item => item.feedback === 'bad').length;
    
    return [
      { name: 'Good', value: goodCount, color: '#22c55e' },
      { name: 'Bad', value: badCount, color: '#ef4444' },
    ];
  };

  // Process feedback data for line chart (good feedback only)
  const processFeedbackLineData = () => {
    return feedbackData
      .filter(item => item.feedback === 'good')
      .map(item => ({
        NCO2015: item.NCO2015,
        confidence: item.confidence,
        title: item.title,
        hierarchy: item.hierarchy,
      }));
  };

  // Process voice data for bar chart
  // Process voice data for line chart
const processVoiceLineData = () => {
  const selectedData = voiceData.find(item => item.transcription === selectedTranscription);
  if (!selectedData) return [];
  
  return selectedData.results.slice(0, 5).map(result => ({
    NCO2015: result.NCO2015,
    confidence: result.confidence,
    title: result.title,
  }));
};


  const handleAddData = async (type: string) => {
    if (!entryCode || !entryName) {
      toast({
        title: "Validation Error",
        description: "Please enter both code and name",
        variant: "destructive",
      });
      return;
    }

    // Validate code length based on type
    const expectedLengths: { [key: string]: number } = {
      division: 1,
      subdivision: 2,
      group: 3,
      family: 4,
      occupation: 4,
    };

    if (expectedLengths[type] && entryCode.length !== expectedLengths[type]) {
      toast({
        title: "Invalid Code Length",
        description: `${type} code must be ${expectedLengths[type]} digit(s)`,
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/add_entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: type,
          code: entryCode,
          name: entryName,
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        toast({
          title: "Success",
          description: data.message,
        });
        setEntryCode("");
        setEntryName("");
        setEntryType("");
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to add entry",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[Admin] Error adding data:', error);
      toast({
        title: "Network Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };

  // Helper functions for code validation
  const getCodePlaceholder = () => {
    if (!entryType) return "Select type first";
    
    const expectedLengths: { [key: string]: number } = {
      division: 1,
      subdivision: 2,
      group: 3,
      family: 4,
      occupation: 4,
    };
    
    const length = expectedLengths[entryType];
    return `Enter ${length} digit${length > 1 ? 's' : ''}`;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow numeric input
    if (value && !/^\d+$/.test(value)) {
      return;
    }
    
    setEntryCode(value);
    
    if (!entryType) {
      setCodeError("");
      return;
    }
    
    const expectedLengths: { [key: string]: number } = {
      division: 1,
      subdivision: 2,
      group: 3,
      family: 4,
      occupation: 4,
    };
    
    const expectedLength = expectedLengths[entryType];
    
    if (value.length > expectedLength) {
      setCodeError(`This follows NCO 2025 data hierarchy. ${entryType} codes must be exactly ${expectedLength} digit${expectedLength > 1 ? 's' : ''}.`);
    } else if (value.length > 0 && value.length < expectedLength) {
      setCodeError(`Code must be ${expectedLength} digit${expectedLength > 1 ? 's' : ''} for ${entryType}.`);
    } else {
      setCodeError("");
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background p-3 border rounded shadow-lg">
          <p className="font-medium">{data.title}</p>
          <p>NCO2015: {label}</p>
          <p>Confidence: {(data.confidence * 100).toFixed(1)}%</p>
          {data.hierarchy && (
            <div className="text-xs mt-2 space-y-1">
              <p>Division: {data.hierarchy.division}</p>
              <p>Family: {data.hierarchy.family}</p>
              <p>Group: {data.hierarchy.group}</p>
              <p>Subdivision: {data.hierarchy.subdivision}</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <Tabs defaultValue="performance" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="performance">Performance</TabsTrigger>
        <TabsTrigger value="data-entry">Data Entry</TabsTrigger>
      </TabsList>

      <TabsContent value="performance" className="space-y-6">
        <h3 className="text-2xl font-bold">Performance Analytics</h3>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Feedback Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Feedback Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={processFeedbackPieData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {processFeedbackPieData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Confidence Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Confidence Scores (Good Feedback Only)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={processFeedbackLineData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="NCO2015" />
                  <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="confidence" stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Voice Recognition Bar Chart */}
        <Card>
  <CardHeader>
    <div className="flex justify-between items-center">
      <CardTitle>Voice Recognition Results</CardTitle>
      <Select value={selectedTranscription} onValueChange={setSelectedTranscription}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select transcription" />
        </SelectTrigger>
        <SelectContent>
          {voiceData.map((item, index) => (
            <SelectItem key={index} value={item.transcription}>
              {item.transcription}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={processVoiceLineData()}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="NCO2015" />
        <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
        <Tooltip 
          formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Confidence']}
          labelFormatter={(label) => `NCO Code: ${label}`}
        />
        <Line type="monotone" dataKey="confidence" stroke="#3b82f6" strokeWidth={2} dot />
      </LineChart>
    </ResponsiveContainer>
    {selectedTranscription && (
      <div className="mt-4">
        <Badge variant="outline">
          Selected: "{selectedTranscription}"
        </Badge>
      </div>
    )}
  </CardContent>
</Card>

      </TabsContent>

      <TabsContent value="data-entry" className="space-y-6">
        <h3 className="text-2xl font-bold">Data Entry</h3>
        
        <Card>
          <CardHeader>
            <CardTitle>Add New Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="entry-type">Entry Type</Label>
              <Select value={entryType} onValueChange={(value) => {
                setEntryType(value);
                setEntryCode("");
                setCodeError("");
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select entry type" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  <SelectItem value="division">Division (1 digit)</SelectItem>
                  <SelectItem value="subdivision">Subdivision (2 digits)</SelectItem>
                  <SelectItem value="group">Group (3 digits)</SelectItem>
                  <SelectItem value="family">Family (4 digits)</SelectItem>
                  <SelectItem value="occupation">Occupation (4 digits)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry-code">Code</Label>
              <Input
                id="entry-code"
                type="text"
                value={entryCode}
                onChange={handleCodeChange}
                placeholder={getCodePlaceholder()}
                disabled={!entryType}
              />
              {codeError && (
                <p className="text-sm text-destructive">{codeError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry-name">Name</Label>
              <Input
                id="entry-name"
                type="text"
                value={entryName}
                onChange={(e) => setEntryName(e.target.value)}
                placeholder="Enter name"
              />
            </div>

            <Button
              onClick={() => handleAddData(entryType)}
              className="w-full"
              disabled={!entryType || !entryCode || !entryName || !!codeError}
            >
              Add Entry
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};