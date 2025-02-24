import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./ui/dialog";
import TradingViewChart from "./TradingViewChart";
import AIPredictions from "./AIPredictions";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { useStockDetail } from "@/lib/hooks/useStockDetail";
import type { Timeframe, WaveStatus } from "@/lib/types";

interface DetailedStockViewProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  timeframe: Timeframe;
  waveStatus: WaveStatus | "all";
  onTimeframeChange: (timeframe: Timeframe) => void;
  onWaveStatusChange: (status: WaveStatus | "all") => void;
  onNavigate: (symbol: string) => void;
  prevStock?: string;
  nextStock?: string;
}

const DetailedStockView: React.FC<DetailedStockViewProps> = ({
  isOpen,
  onClose,
  symbol,
  timeframe,
  waveStatus,
  onTimeframeChange,
  onWaveStatusChange,
  onNavigate,
  prevStock,
  nextStock,
}) => {
  const { stockDetail, loading, error } = useStockDetail(symbol, timeframe, waveStatus);

  console.log('DetailedStockView rendered:', {
    symbol,
    timeframe,
    waveStatus,
    stockDetail
  });

  const [showElliottWave, setShowElliottWave] = useState(true);
  const [showFibonacci, setShowFibonacci] = useState(false);
  const [stockName, setStockName] = useState<string>("");

  // Update stock name when wave pattern changes
  React.useEffect(() => {
    if (stockDetail?.wavePattern?.name) {
      setStockName(stockDetail.wavePattern.name);
    }
  }, [stockDetail?.wavePattern?.name]);

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[90vw] w-[1512px] max-h-[90vh] bg-background p-6">
        <DialogTitle className="sr-only">
          Stock Details for {symbol}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Detailed view of {symbol} stock with Elliott Wave analysis and price
          predictions
        </DialogDescription>
        {/* DialogClose is handled by the Dialog component */}

        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => prevStock && onNavigate(prevStock)}
            disabled={!prevStock}
            className="w-24"
          >
            ← {prevStock}
          </Button>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">
              {stockName} ({symbol})
            </h2>
            {stockDetail?.wavePattern && (
              <Badge variant="secondary">{stockDetail.wavePattern.status}</Badge>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => nextStock && onNavigate(nextStock)}
            disabled={!nextStock}
            className="w-24"
          >
            {nextStock} →
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-destructive">Error: {error.message}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <TradingViewChart
              symbol={symbol}
              timeframe={timeframe}
              onTimeframeChange={onTimeframeChange}
              prices={stockDetail.prices}
              wavePattern={stockDetail.wavePattern}
              showElliottWave={showElliottWave}
              showFibonacci={showFibonacci}
              onToggleElliottWave={setShowElliottWave}
              onToggleFibonacci={setShowFibonacci}
            />
            {stockDetail.wavePattern && (
              <AIPredictions
                currentPrice={stockDetail.wavePattern.current_price}
                wavePattern={stockDetail.wavePattern}
                targets={[
                  {
                    price: stockDetail.wavePattern.target_price1,
                    confidence: stockDetail.wavePattern.confidence,
                    type: "resistance",
                  },
                  {
                    price: stockDetail.wavePattern.target_price2,
                    confidence: Math.max(stockDetail.wavePattern.confidence - 10, 0),
                    type: "resistance",
                  },
                  {
                    price: stockDetail.wavePattern.target_price3,
                    confidence: Math.max(stockDetail.wavePattern.confidence - 20, 0),
                    type: "resistance",
                  },
                ]}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DetailedStockView;
