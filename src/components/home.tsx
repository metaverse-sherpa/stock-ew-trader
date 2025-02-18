import React, { useState, useMemo } from "react";
import DashboardHeader from "./DashboardHeader";
import DetailedStockView from "./DetailedStockView";
import { Card } from "./ui/card";
import StockCard from "./StockCard";
import { useStocks } from "@/lib/hooks/useStocks";
import type { Timeframe } from "@/lib/types";

const Home = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("1d");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  const { stocks, loading, error } = useStocks(selectedTimeframe);

  const filteredStocks = useMemo(() => {
    if (!searchQuery) return stocks;
    return stocks.filter((stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [stocks, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        onSearch={setSearchQuery}
        onTimeframeChange={(tf) => setSelectedTimeframe(tf as Timeframe)}
        onThemeToggle={() => setIsDarkMode(!isDarkMode)}
        isDarkMode={isDarkMode}
        selectedTimeframe={selectedTimeframe}
      />

      <main className="p-6">
        {loading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Loading stocks...</p>
          </Card>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-destructive">
              Error loading stocks: {error.message}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStocks.map((stock) => (
              <StockCard
                key={stock.symbol}
                symbol={stock.symbol}
                price={stock.wavePattern?.current_price || 0}
                confidence={stock.wavePattern?.confidence || 0}
                waveStatus={stock.wavePattern?.status || ""}
                onClick={() => setSelectedStock(stock.symbol)}
              />
            ))}
          </div>
        )}

        {!loading && !error && filteredStocks.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No stocks found matching your search criteria
            </p>
          </Card>
        )}
      </main>

      {selectedStock && (
        <DetailedStockView
          isOpen={!!selectedStock}
          onClose={() => setSelectedStock(null)}
          symbol={selectedStock}
          timeframe={selectedTimeframe}
        />
      )}
    </div>
  );
};

export default Home;
