import { useState } from "react";
import { Link } from "react-router-dom";
import { SearchInterface } from "@/components/search-interface";
import { ResultsDisplay } from "@/components/results-display";
import { HistorySidebar } from "@/components/history-sidebar";
import { Button } from "@/components/ui/button";

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

const Index = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handleResults = (newResults: SearchResult[]) => {
    setResults(newResults);
    // Trigger history refresh
    setRefreshHistory(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-white text-xl font-bold">
                National Classification of Occupation
              </h1>
            </div>
            <Link to="/admin">
              <Button
                variant="secondary"
                className="bg-white/20 text-white hover:bg-white/30 border-white/30"
              >
                Admin Panel
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Main Search and Results Area */}
          <div className="flex-1">
            <SearchInterface 
              onResults={handleResults}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
            
            <div className="mt-8">
              <ResultsDisplay 
                results={results} 
                isLoading={isLoading}
                onFeedback={() => setRefreshHistory(prev => prev + 1)}
              />
            </div>
          </div>

          {/* History Sidebar */}
          <div className="w-80">
            <HistorySidebar refreshTrigger={refreshHistory} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;