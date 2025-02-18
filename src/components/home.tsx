import React, { useState } from "react";
import DashboardHeader from "./DashboardHeader";
import DetailedStockView from "./DetailedStockView";
import StockGrid from "./StockGrid";
import type { Timeframe } from "@/lib/types";

const Home = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("1d");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

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
        <StockGrid searchQuery={searchQuery} timeframe={selectedTimeframe} />
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
