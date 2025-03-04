import React, { useState, useEffect } from "react";
import { useTheme } from "@/lib/hooks/useTheme";
import DashboardHeader from "./DashboardHeader";
import DetailedStockView from "./DetailedStockView";
import StockGrid from "./StockGrid";
import { LoadingDialog } from "./LoadingDialog";
import SettingsDialog from "./SettingsDialog";
import { Button } from "./ui/button";
import { Settings, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./auth/AuthProvider";
import type { Timeframe, WaveStatus } from "@/lib/types";

const Home = () => {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const { signOut, user } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("1d");
  const [selectedWaveStatus, setSelectedWaveStatus] = useState<
    WaveStatus | "all"
  >("Wave 5 Bullish");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [selectedStockWaveStatus, setSelectedStockWaveStatus] =
    useState<WaveStatus | null>(null);
  const [stocks, setStocks] = useState<string[]>([]);

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
        onWaveStatusChange={setSelectedWaveStatus}
        onThemeToggle={() => setIsDarkMode(!isDarkMode)}
        isDarkMode={isDarkMode}
        selectedTimeframe={selectedTimeframe}
        selectedWaveStatus={selectedWaveStatus}
      >
        <div className="flex items-center space-x-2">
          <SettingsDialog
            onTimeframeChange={handleTimeframeChange}
            trigger={
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            }
          />
          <Button
            variant="outline"
            size="icon"
            onClick={signOut}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
          {user?.email && (
            <span className="text-sm text-muted-foreground hidden md:inline-block">
              {user.email}
            </span>
          )}
        </div>
      </DashboardHeader>

      <LoadingDialog isOpen={isLoading} />

      <main className="p-6">
        <StockGrid
          searchQuery={searchQuery}
          timeframe={selectedTimeframe}
          waveStatus={selectedWaveStatus}
          onStockSelect={(symbol, allSymbols, waveStatus) => {
            if (symbol === "") {
              setIsLoading(false);
            } else {
              setSelectedStock(symbol);
              setSelectedStockWaveStatus(waveStatus as WaveStatus);
              if (allSymbols) setStocks(allSymbols);
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
          onNavigate={setSelectedStock}
          prevStock={
            selectedStock
              ? stocks[stocks.indexOf(selectedStock) - 1]
              : undefined
          }
          nextStock={
            selectedStock
              ? stocks[stocks.indexOf(selectedStock) + 1]
              : undefined
          }
          selectedWaveStatus={selectedStockWaveStatus || selectedWaveStatus}
        />
      )}
    </div>
  );
};

export default Home;
