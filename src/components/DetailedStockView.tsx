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
import type { Timeframe } from "@/lib/types";

interface DetailedStockViewProps {
  isOpen?: boolean;
  onClose?: () => void;
  symbol: string;
  timeframe: Timeframe;
  onTimeframeChange?: (timeframe: Timeframe) => void;
  onNavigate?: (symbol: string) => void;
  prevStock?: string;
  nextStock?: string;
}

const DetailedStockView = ({
  isOpen = true,
  onClose = () => {},
  symbol,
  timeframe,
  onTimeframeChange = () => {},
  onNavigate = () => {},
  prevStock,
  nextStock,
}: DetailedStockViewProps) => {
  const [showElliottWave, setShowElliottWave] = useState(true);
  const [showFibonacci, setShowFibonacci] = useState(false);

  const { wavePattern, prices, loading, error } = useStockDetail(
    symbol,
    timeframe,
  );

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[90vw] w-[1512px] h-[982px] bg-background p-6">
        <DialogTitle className="sr-only">
          Stock Details for {symbol}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Detailed view of {symbol} stock with Elliott Wave analysis and price
          predictions
        </DialogDescription>
        <DialogClose className="hidden" />

        <div className="flex items-center gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{symbol}</h2>
              {wavePattern && (
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {wavePattern.status}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {wavePattern?.name || "Loading..."}
            </p>
          </div>
          <div className="flex-1 flex justify-center gap-2">
            {prevStock && (
              <Button variant="outline" onClick={() => onNavigate(prevStock)}>
                {prevStock}
              </Button>
            )}
            {nextStock && (
              <Button variant="outline" onClick={() => onNavigate(nextStock)}>
                {nextStock}
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-muted"
          >
            <X className="h-6 w-6" />
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
              prices={prices}
              wavePattern={wavePattern}
              showElliottWave={showElliottWave}
              showFibonacci={showFibonacci}
              onToggleElliottWave={setShowElliottWave}
              onToggleFibonacci={setShowFibonacci}
            />
            {wavePattern && (
              <AIPredictions
                currentPrice={wavePattern.current_price}
                wavePattern={wavePattern}
                targets={[
                  {
                    price: wavePattern.target_price1,
                    confidence: wavePattern.confidence,
                    type: "resistance",
                  },
                  {
                    price: wavePattern.target_price2,
                    confidence: Math.max(wavePattern.confidence - 10, 0),
                    type: "resistance",
                  },
                  {
                    price: wavePattern.target_price3,
                    confidence: Math.max(wavePattern.confidence - 20, 0),
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
