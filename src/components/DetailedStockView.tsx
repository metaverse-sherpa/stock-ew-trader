import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./ui/dialog";
import TradingViewChart from "./TradingViewChart";
import AIPredictions from "./AIPredictions";
import StockSentiment from "./StockSentiment";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { X, Star, Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "./ui/use-toast";
import { useStockDetail } from "@/lib/hooks/useStockDetail";
import type { Timeframe, WaveStatus } from "@/lib/types";

interface DetailedStockViewProps {
  isOpen?: boolean;
  onClose?: () => void;
  symbol: string;
  timeframe: Timeframe;
  onTimeframeChange?: (timeframe: Timeframe) => void;
  onNavigate?: (symbol: string) => void;
  prevStock?: string;
  nextStock?: string;
  selectedWaveStatus?: WaveStatus | "all";
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
  selectedWaveStatus = "Wave 5 Bullish",
}: DetailedStockViewProps) => {
  const [showElliottWave, setShowElliottWave] = useState(true);
  const [showFibonacci, setShowFibonacci] = useState(false);
  const [stockName, setStockName] = useState<string>("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const { toast } = useToast();

  const { wavePattern, prices, loading, error } = useStockDetail(
    symbol,
    timeframe,
    selectedWaveStatus,
  );

  // Update stock name when wave pattern changes
  React.useEffect(() => {
    if (wavePattern?.name) {
      setStockName(wavePattern.name);
    }
  }, [wavePattern?.name]);

  // Check if stock is in favorites
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      const { data, error } = await supabase
        .from("user_favorites")
        .select("*")
        .eq("symbol", symbol)
        .single();

      if (data) {
        setIsFavorite(true);
        setIsNotificationsEnabled(data.notifications_enabled || false);
      } else {
        setIsFavorite(false);
        setIsNotificationsEnabled(false);
      }
    };

    if (symbol) {
      checkFavoriteStatus();
    }
  }, [symbol]);

  const toggleFavorite = async () => {
    if (isFavorite) {
      // Remove from favorites
      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("symbol", symbol);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove from favorites",
          variant: "destructive",
        });
        return;
      }

      setIsFavorite(false);
      setIsNotificationsEnabled(false);
      toast({
        title: "Success",
        description: `${symbol} removed from favorites`,
      });
    } else {
      // Add to favorites
      const { error } = await supabase.from("user_favorites").insert({
        symbol,
        name: stockName,
        notifications_enabled: false,
        created_at: new Date().toISOString(),
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add to favorites",
          variant: "destructive",
        });
        return;
      }

      setIsFavorite(true);
      toast({
        title: "Success",
        description: `${symbol} added to favorites`,
      });
    }
  };

  const toggleNotifications = async () => {
    if (!isFavorite) {
      toast({
        title: "Info",
        description: "Please add to favorites first",
      });
      return;
    }

    const newNotificationState = !isNotificationsEnabled;

    const { error } = await supabase
      .from("user_favorites")
      .update({ notifications_enabled: newNotificationState })
      .eq("symbol", symbol);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      });
      return;
    }

    setIsNotificationsEnabled(newNotificationState);
    toast({
      title: "Success",
      description: `Notifications ${newNotificationState ? "enabled" : "disabled"} for ${symbol}`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[90vw] w-[1512px] max-h-[90vh] bg-background p-6 overflow-y-auto">
        <DialogTitle className="sr-only">
          Stock Details for {symbol}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Detailed view of {symbol} stock with Elliott Wave analysis and price
          predictions
        </DialogDescription>

        <div className="flex items-center justify-between mb-6 relative pr-10">
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
            {wavePattern && (
              <Badge variant="secondary">{wavePattern.status}</Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFavorite}
              className={
                isFavorite ? "text-yellow-500" : "text-muted-foreground"
              }
            >
              <Star
                className="h-5 w-5"
                fill={isFavorite ? "currentColor" : "none"}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleNotifications}
              className={
                isNotificationsEnabled
                  ? "text-blue-500"
                  : "text-muted-foreground"
              }
              disabled={!isFavorite}
            >
              <Bell className="h-5 w-5" />
            </Button>
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
              prices={prices}
              wavePattern={wavePattern}
              showElliottWave={showElliottWave}
              showFibonacci={showFibonacci}
              onToggleElliottWave={setShowElliottWave}
              onToggleFibonacci={setShowFibonacci}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
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
              <StockSentiment symbol={symbol} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DetailedStockView;
