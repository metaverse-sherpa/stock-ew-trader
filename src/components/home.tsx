import React, { useState, useEffect } from "react";
import { useTheme } from "../lib/hooks/useTheme";
import DashboardHeader from './DashboardHeader';
import DetailedStockView from "./DetailedStockView";
import StockGrid from "./StockGrid";
import { LoadingDialog } from "./LoadingDialog";
import { Button } from "./ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabase.client";
import type { Timeframe, WaveStatus, Stock } from "../lib/types";
import ErrorBoundary from './ErrorBoundary';
import { useQuery } from '@tanstack/react-query';

// Update WaveStatus type
type ExtendedWaveStatus = WaveStatus | "Wave 5 Bullish" | "all";

// Add interface for Stock
interface NavigationItem {
  symbol: string;
  timeframe: Timeframe;
  waveStatus: ExtendedWaveStatus;
}

const Home = () => {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("1d");
  const [selectedWaveStatus, setSelectedWaveStatus] = useState<ExtendedWaveStatus>("Wave 5 Bullish");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  const [selectedDetailTimeframe, setSelectedDetailTimeframe] = useState<Timeframe>("1d");
  const [selectedDetailWaveStatus, setSelectedDetailWaveStatus] = useState<ExtendedWaveStatus>("Wave 5 Bullish");
  const [navigationList, setNavigationList] = useState<NavigationItem[]>([]);
  const [error] = useState(null);
  const [currentPage] = useState(1);
  const itemsPerPage = 20;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
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

  // Update fetchStocks function
  const fetchStocks = async (): Promise<Stock[]> => {
    try {
      // Step 1: Fetch distinct symbols from wave_patterns
      const { data: waveSymbols, error: waveError } = await supabase
        .from('wave_patterns')
        .select('symbol')
        .eq('wave_status', selectedWaveStatus)
        .eq('timeframe', selectedTimeframe)
        .limit(1); // Use limit to ensure we get distinct symbols

      if (waveError) throw waveError;

      const symbols = [...new Set(waveSymbols.map(wave => wave.symbol))]; // Get unique symbols

      // Step 2: Fetch stocks using the distinct symbols
      const { data: stocks, error } = await supabase
        .from('stocks')
        .select('symbol, name')
        .in('symbol', symbols)
        .order('symbol', { ascending: true });

      if (error) throw error;

      if (!stocks || stocks.length === 0) {
        console.log('No stocks found');
        return [];
      }

      const stocksWithPrices = await Promise.all(
        stocks.map(async (stock) => {
          try {
            // Fetch price details
            const priceResponse = await fetch(
              `http://localhost:5174/api/stocks/${stock.symbol}/price-details`
            );
            
            if (!priceResponse.ok) {
              throw new Error(`Failed to fetch price details for ${stock.symbol}`);
            }

            const priceDetails = await priceResponse.json();

            // Fetch historical data based on selected timeframe
            const { data: historicalData } = await supabase
              .from('stock_prices')
              .select('timestamp, open, high, low, close')
              .eq('symbol', stock.symbol)
              .eq('timeframe', selectedTimeframe)
              .order('timestamp', { ascending: true });

            return {
              symbol: stock.symbol,
              name: stock.name || stock.symbol,
              currentPrice: priceDetails.currentPrice,
              openPrice: priceDetails.openPrice,
              priceChange: priceDetails.priceChange,
              percentChange: priceDetails.percentChange,
              historicalData: historicalData || [],
              timeframe: selectedTimeframe,
              waveStatus: selectedWaveStatus
            };
          } catch (error) {
            console.error(`Error fetching data for ${stock.symbol}:`, error);
            return {
              symbol: stock.symbol,
              name: stock.name || stock.symbol,
              currentPrice: 0,
              openPrice: 0,
              priceChange: 0,
              percentChange: 0,
              historicalData: [],
              timeframe: selectedTimeframe,
              waveStatus: selectedWaveStatus
            };
          }
        })
      );

      return stocksWithPrices;  
    } catch (err) {
      console.error('Error fetching stocks:', err);
      throw err;
    }
  };

  const handleTimeframeChange = async (timeframe: Timeframe) => {
    setIsLoading(true);
    setSelectedTimeframe(timeframe);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleWaveStatusChange = async (status: ExtendedWaveStatus) => {
    setIsLoading(true);
    setSelectedWaveStatus(status);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleStockSelect = async (
    symbol: string,
    navList: NavigationItem[],
    clickedTimeframe?: Timeframe,
    clickedWaveStatus?: ExtendedWaveStatus
  ) => {
    console.log('Stock selected:', {
      symbol,
      clickedTimeframe,
      clickedWaveStatus,
      navList
    });

    // Fetch historical data for the selected stock
    const { data, error } = await supabase
      .from("stock_prices")
      .select("timestamp, open, high, low, close")
      .eq("symbol", symbol)
      .order("timestamp", { ascending: true });

    if (error) {
      console.error("Error fetching historical data:", error);
      return;
    }

    setHistoricalData(data || []);
    setSelectedStock(symbol);
    setNavigationList(navList as NavigationItem[]);
    
    if (clickedTimeframe) {
      setSelectedDetailTimeframe(clickedTimeframe);
    }
    if (clickedWaveStatus) {
      setSelectedDetailWaveStatus(clickedWaveStatus);
    }
  };

  // Replace useEffect with useQuery
  const { data: stocksData, isLoading: stocksLoading, error: stocksError, refetch } = useQuery({
    queryKey: ['stocks'],
    queryFn: fetchStocks,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  const handleRefresh = async () => {
    // Clear the cache
    localStorage.removeItem('cachedStocks');
    localStorage.removeItem('cachedStocksTimestamp');

    // Refetch the data
    await refetch();
  };

  const filteredStocks = React.useMemo(() => {
    if (!stocksData) return [];
    return stocksData.filter(stock => 
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stocksData, searchQuery]);

  const paginatedStocks = filteredStocks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    refetch();
  }, [selectedTimeframe, selectedWaveStatus]);

  if (stocksLoading) {
    return <LoadingDialog isOpen={true} />;
  }
  if (stocksError) return <div className="p-6 text-red-500">Error: {stocksError.message}</div>;

  if (isLoading) return <LoadingDialog isOpen={true} />;
  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load stocks';
    return (
      <div className="p-6 text-red-500">
        Error: {errorMessage}
        <Button onClick={handleRefresh} className="ml-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Prices
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        onSearch={setSearchQuery}
        onTimeframeChange={handleTimeframeChange}
        onWaveStatusChange={handleWaveStatusChange}
        onThemeToggle={() => setIsDarkMode(!isDarkMode)}
        onSettingsClick={() => setIsSettingsOpen(true)}
        isDarkMode={isDarkMode}
        selectedTimeframe={selectedTimeframe}
        selectedWaveStatus={selectedWaveStatus as WaveStatus | "all"}
        isLoading={isLoading}
      />

      <LoadingDialog isOpen={isLoading} />

      <main className="p-6">
        <ErrorBoundary>
          <StockGrid
            stocks={paginatedStocks}
            onStockSelect={(symbol) => handleStockSelect(symbol, navigationList)}
          />
        </ErrorBoundary>
      </main>

      {selectedStock && (
        <DetailedStockView
          stock={{
            symbol: selectedStock,
            name: stocksData?.find(s => s.symbol === selectedStock)?.name || selectedStock,
            currentPrice: stocksData?.find(s => s.symbol === selectedStock)?.currentPrice || 0,
            waveStatus: selectedDetailWaveStatus,
            timeframe: selectedDetailTimeframe
          }}
          historicalData={historicalData}
          onClose={() => setSelectedStock(null)}
        />
      )}

      <Button onClick={handleRefresh} className="fixed bottom-4 right-4">
        <RefreshCw className="mr-2 h-4 w-4" />
        Refresh Data
      </Button>
    </div>
  );
};

export default Home;
