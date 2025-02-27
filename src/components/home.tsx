import React, { useState, useEffect } from "react";
import { useTheme } from "../lib/hooks/useTheme";
import DashboardHeader from './DashboardHeader';
import DetailedStockView from "./DetailedStockView";
import StockGrid from "./StockGrid";
import { LoadingDialog } from "./LoadingDialog";
import { SettingsDialog } from "./SettingsDialog";
import { Button } from "./ui/button";
import { Settings } from "lucide-react";
import { supabase } from "../lib/supabase.client";
import type { Timeframe, WaveStatus } from "../lib/types";

const Home = () => {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("1d");
  const [selectedWaveStatus, setSelectedWaveStatus] = useState<
    WaveStatus | "all"
  >("Wave 5 Bullish");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [stocks, setStocks] = useState<string[]>([]);
  const [selectedDetailTimeframe, setSelectedDetailTimeframe] = useState<Timeframe>("1d");
  const [selectedDetailWaveStatus, setSelectedDetailWaveStatus] = useState<WaveStatus | "all">("Wave 5 Bullish");
  const [navigationList, setNavigationList] = useState<Array<{
    symbol: string;
    timeframe: string;
    waveStatus: string;
  }>>([]);

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

  const handleStockSelect = (
    symbol: string,
    navList: Array<{ symbol: string; timeframe: string; waveStatus: string }>,
    clickedTimeframe?: string,
    clickedWaveStatus?: string
  ) => {
    console.log('Stock selected:', {
      symbol,
      clickedTimeframe,
      clickedWaveStatus,
      navList
    });

    setSelectedStock(symbol);
    setNavigationList(navList);
    
    // Always set the timeframe and wave status from the clicked card
    if (clickedTimeframe) {
      setSelectedDetailTimeframe(clickedTimeframe as Timeframe);
    }
    if (clickedWaveStatus) {
      setSelectedDetailWaveStatus(clickedWaveStatus as WaveStatus);
    }
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
      />

      <LoadingDialog isOpen={isLoading} />

      <main className="p-6">
        <StockGrid
          searchQuery={searchQuery}
          timeframe={selectedTimeframe}
          waveStatus={selectedWaveStatus}
          onStockSelect={handleStockSelect}
        />
      </main>

      {selectedStock && (
        <DetailedStockView
          isOpen={!!selectedStock}
          onClose={() => setSelectedStock(null)}
          symbol={selectedStock}
          timeframe={selectedDetailTimeframe}
          waveStatus={selectedDetailWaveStatus}
          onTimeframeChange={setSelectedDetailTimeframe}
          onWaveStatusChange={setSelectedDetailWaveStatus}
          onNavigate={(symbol) => {
            const currentIndex = navigationList.findIndex(
              item => 
                item.symbol === selectedStock && 
                item.timeframe === selectedDetailTimeframe &&
                item.waveStatus === selectedDetailWaveStatus
            );
            
            const nextItem = navigationList[currentIndex + 1];
            const prevItem = navigationList[currentIndex - 1];
            
            if (symbol === prevItem?.symbol) {
              setSelectedDetailTimeframe(prevItem.timeframe as Timeframe);
              setSelectedDetailWaveStatus(prevItem.waveStatus as WaveStatus);
            } else if (symbol === nextItem?.symbol) {
              setSelectedDetailTimeframe(nextItem.timeframe as Timeframe);
              setSelectedDetailWaveStatus(nextItem.waveStatus as WaveStatus);
            }
            
            setSelectedStock(symbol);
          }}
          prevStock={
            navigationList.findIndex(
              item => 
                item.symbol === selectedStock && 
                item.timeframe === selectedDetailTimeframe &&
                item.waveStatus === selectedDetailWaveStatus
            ) > 0
              ? navigationList[navigationList.findIndex(
                  item => 
                    item.symbol === selectedStock && 
                    item.timeframe === selectedDetailTimeframe &&
                    item.waveStatus === selectedDetailWaveStatus
                ) - 1].symbol
              : undefined
          }
          nextStock={
            navigationList.findIndex(
              item => 
                item.symbol === selectedStock && 
                item.timeframe === selectedDetailTimeframe &&
                item.waveStatus === selectedDetailWaveStatus
            ) < navigationList.length - 1
              ? navigationList[navigationList.findIndex(
                  item => 
                    item.symbol === selectedStock && 
                    item.timeframe === selectedDetailTimeframe &&
                    item.waveStatus === selectedDetailWaveStatus
                ) + 1].symbol
              : undefined
          }
        />
      )}
    </div>
  );
};

export default Home;
