import React, { useState, useEffect } from "react";
import DashboardHeader from "./DashboardHeader";
import DetailedStockView from "./DetailedStockView";
import StockGrid from "./StockGrid";
import { LoadingDialog } from "./LoadingDialog";
import { SettingsDialog } from "./SettingsDialog";
import { Button } from "./ui/button";
import { Settings } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Timeframe } from "@/lib/types";

const Home = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("1h");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  // Load default timeframe on initial render
  useEffect(() => {
    const loadDefaultTimeframe = async () => {
      const { data } = await supabase.from("user_settings").select().single();

      if (data?.default_timeframe) {
        setSelectedTimeframe(data.default_timeframe as Timeframe);
      }
    };

    loadDefaultTimeframe();
  }, []);

  const handleTimeframeChange = (tf: Timeframe) => {
    setSelectedTimeframe(tf);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        onSearch={setSearchQuery}
        onTimeframeChange={handleTimeframeChange}
        onThemeToggle={() => setIsDarkMode(!isDarkMode)}
        isDarkMode={isDarkMode}
        selectedTimeframe={selectedTimeframe}
      >
        <SettingsDialog
          onTimeframeChange={handleTimeframeChange}
          trigger={
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
      </DashboardHeader>

      <LoadingDialog isOpen={isLoading} />

      <main className="p-6">
        <StockGrid
          searchQuery={searchQuery}
          timeframe={selectedTimeframe}
          onStockSelect={(symbol) => {
            if (symbol === "") {
              setIsLoading(false);
            } else {
              setSelectedStock(symbol);
            }
          }}
        />
      </main>

      {selectedStock && (
        <DetailedStockView
          isOpen={!!selectedStock}
          onClose={() => setSelectedStock(null)}
          symbol={selectedStock}
          timeframe={selectedTimeframe}
          onTimeframeChange={handleTimeframeChange}
        />
      )}
    </div>
  );
};

export default Home;
