import React from "react";
import { Card } from "./ui/card";
import StockCard from "./StockCard";
import { useStocks } from "@/lib/hooks/useStocks";
import type { Timeframe, WaveStatus } from "@/lib/types";
import Spinner from './Spinner';

interface StockGridProps {
  searchQuery?: string;
  timeframe?: Timeframe;
  waveStatus?: WaveStatus | "all";
  onStockSelect?: (
    symbol: string, 
    navigationList?: Array<{
      symbol: string;
      timeframe: string;
      waveStatus: string;
    }>,
    selectedTimeframe?: string,
    selectedWaveStatus?: string
  ) => void;
}

const StockGrid = ({
  onStockSelect,
  searchQuery = "",
  timeframe = "1h",
  waveStatus = "Wave 5 Bullish",
}: StockGridProps) => {
  const { stocks, loading, error } = useStocks(timeframe, waveStatus);

  const filteredStocks = React.useMemo(() => {
    if (!searchQuery) return stocks;
    return stocks.filter((stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stocks, searchQuery]);

  // Show loading spinner when loading is true
  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-destructive">Error loading stocks: {error.message}</p>
      </Card>
    );
  }

  if (!loading && filteredStocks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No stocks found matching your search criteria</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredStocks
        .filter((stock, index, self) => {
          if (timeframe === 'all' || waveStatus === 'all') return true;
          return index === self.findIndex((s) => 
            s.symbol === stock.symbol && 
            s.wavePattern?.timeframe === stock.wavePattern?.timeframe &&
            s.wavePattern?.status === stock.wavePattern?.status
          );
        })
        .map((stock) => {
          const thisStockWavePattern = stock.wavePattern;
          
          // Create navigation list with timeframe and wave status
          const navigationList = filteredStocks
            .filter(Boolean)
            .map(s => ({
              symbol: s.symbol,
              timeframe: s.wavePattern?.timeframe || "1h",
              waveStatus: s.wavePattern?.status || ""
            }));

          console.log('Rendering card:', {
            symbol: stock.symbol,
            timeframe: thisStockWavePattern?.timeframe,
            waveStatus: thisStockWavePattern?.status
          });

          return (
            <StockCard
              key={`${stock.symbol}-${thisStockWavePattern?.timeframe}-${thisStockWavePattern?.status}`}
              symbol={stock.symbol}
              price={thisStockWavePattern?.current_price || 0}
              change={
                (((thisStockWavePattern?.current_price || 0) -
                  (thisStockWavePattern?.wave1_start || 0)) /
                  (thisStockWavePattern?.wave1_start || 1)) *
                100
              }
              confidence={thisStockWavePattern?.confidence || 0}
              waveStatus={thisStockWavePattern?.status || ""}
              onClick={() => {
                console.log('StockGrid onClick:', {
                  symbol: stock.symbol,
                  timeframe: thisStockWavePattern?.timeframe,
                  waveStatus: thisStockWavePattern?.status
                });
                onStockSelect?.(
                  stock.symbol,
                  navigationList,
                  thisStockWavePattern?.timeframe,
                  thisStockWavePattern?.status
                );
              }}
              prices={stock.prices || []}
              timeframe={thisStockWavePattern?.timeframe || "1h"}
              wavePattern={thisStockWavePattern}
            />
          );
        })}
    </div>
  );
};

export default StockGrid;
