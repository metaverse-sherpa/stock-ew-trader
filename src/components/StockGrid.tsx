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
  onStockSelect?: (symbol: string, allSymbols?: string[]) => void;
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
      {filteredStocks.map((stock) => (
        <StockCard
          key={stock.symbol}
          symbol={stock.symbol}
          price={stock.wavePattern?.current_price || 0}
          change={
            (((stock.wavePattern?.current_price || 0) -
              (stock.wavePattern?.wave1_start || 0)) /
              (stock.wavePattern?.wave1_start || 1)) *
            100
          }
          confidence={stock.wavePattern?.confidence || 0}
          waveStatus={stock.wavePattern?.status || ""}
          onClick={() =>
            onStockSelect?.(
              stock.symbol,
              filteredStocks.map((s) => s.symbol),
            )
          }
          prices={stock.prices || []}
          timeframe={timeframe}
        />
      ))}
    </div>
  );
};

export default StockGrid;
