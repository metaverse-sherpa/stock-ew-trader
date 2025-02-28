import React, { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import TradingViewChart from "./TradingViewChart";

interface StockCardProps {
  symbol: string;
  price: number;
  change: number;
  confidence: number;
  waveStatus: string;
  onClick?: () => void;
  prices?: Array<{
    timestamp: string;
    price: number;
    timeframe: string;
  }>;
  timeframe?: string;
  wavePattern?: {
    timeframe: string;
    status: string;
    // ... other wave pattern properties
  };
}

function StockCard({
  symbol,
  price,
  change,
  confidence,
  waveStatus,
  onClick,
  prices = [],
  timeframe = "1h",
  wavePattern,
}: StockCardProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  console.log('StockCard rendering:', {
    symbol,
    price,
    confidence,
    waveStatus,
    pricesLength: prices.length,
    timeframe,
  });

  useEffect(() => {
    if (!chartContainerRef.current || !prices?.length) {
      console.log("Missing requirements:", {
        hasContainer: !!chartContainerRef.current,
        pricesLength: prices?.length,
        timeframe: timeframe,
        prices: prices,
      });
      return;
    }

    // Filter prices for current timeframe
    const timeframePrices = prices.filter((p) => p.timeframe === timeframe);

    // Sort prices by timestamp
    const sortedPrices = timeframePrices.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    // Take the last 50 prices for the mini chart
    const filteredPrices = sortedPrices.slice(-50);

    // Add a small delay to ensure the library is loaded
    const timer = setTimeout(() => {
      try {
        const chart = createChart(chartContainerRef.current!, {
          layout: {
            background: { type: ColorType.Solid, color: "transparent" },
            textColor: "#d1d5db",
          },
          grid: {
            vertLines: { visible: false },
            horzLines: { visible: false },
          },
          width: chartContainerRef.current.clientWidth,
          height: 120,
          rightPriceScale: {
            visible: false,
          },
          timeScale: {
            visible: false,
          },
          handleScroll: false,
          handleScale: false,
        });

        // Add the price area series
        const areaSeries = chart.addAreaSeries({
          lineColor: change >= 0 ? "#22c55e" : "#ef4444",
          topColor:
            change >= 0 ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
          bottomColor:
            change >= 0 ? "rgba(34, 197, 94, 0.0)" : "rgba(239, 68, 68, 0.0)",
          lineWidth: 2,
        });

        const data = filteredPrices
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          )
          .map((price) => ({
            time: Math.floor(new Date(price.timestamp).getTime() / 1000),
            value: price.price,
          }));

        areaSeries.setData(data);

        // Add Elliott Wave lines if we have wave data
        if (waveStatus?.includes("Wave 5 Bullish") && data.length > 0) {
          // Define wave points (simplified for the mini chart)
          const wavePoints = [
            { price: price * 0.95 }, // Approximate wave points based on current price
            { price: price * 0.98 },
            { price: price * 1.02 },
            { price: price * 1.0 },
            { price: price * 1.05 },
          ];

          // Calculate time points
          const timePoints = [];
          const numPoints = wavePoints.length;

          for (let i = 0; i < numPoints; i++) {
            const index = Math.min(
              Math.floor((i / (numPoints - 1)) * (data.length - 1)),
              data.length - 1,
            );
            timePoints.push(data[index].time);
          }

          // Add a single line series for all waves
          const waveSeries = chart.addLineSeries({
            color: "#8b5cf6",
            lineWidth: 1,
          });

          // Create connected line data
          const waveData = wavePoints.map((point, index) => ({
            time: timePoints[index],
            value: point.price,
          }));

          waveSeries.setData(waveData);
        }

        // Fit the chart content
        chart.timeScale().fitContent();

        // Cleanup
        return () => {
          chart.remove();
        };
      } catch (error) {
        console.error("Error creating chart:", error);
      }
    }, 100); // 100ms delay

    return () => {
      clearTimeout(timer);
    };
  }, [prices, change, timeframe]);

  const handleClick = () => {
    console.log('StockCard clicked:', {
      symbol,
      cardTimeframe: wavePattern?.timeframe,
      cardWaveStatus: wavePattern?.status
    });
    onClick?.();
  };

  const isPositive = change >= 0;

  const hasValidPrices = prices && prices.length > 0;

  return (
    <Card
      className="w-[360px] h-[280px] bg-background hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <h3 className="text-2xl font-bold">{symbol}</h3>
              <span className="text-sm text-muted-foreground">
                ({wavePattern?.timeframe || timeframe})
              </span>
            </div>
            <Badge
              variant={confidence >= 80 ? "default" : "secondary"}
              className="h-5 text-xs whitespace-nowrap"
            >
              {confidence}% Confidence
            </Badge>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="h-6">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {waveStatus}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Current Elliott Wave Pattern Status</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">${price.toFixed(2)}</span>
            <div
              className={`flex items-center ${isPositive ? "text-green-500" : "text-red-500"}`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-5 h-4" />
              ) : (
                <ArrowDownRight className="w-5 h-4" />
              )}
              <span className="font-semibold">{Math.abs(change).toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <TradingViewChart
          symbol={symbol}
          timeframe={timeframe}
          prices={prices}
          wavePattern={wavePattern}
        />
      </CardContent>
    </Card>
  );
}

export default React.memo(
  StockCard,
  (prevProps: StockCardProps, nextProps: StockCardProps) => {
    return (
      prevProps.symbol === nextProps.symbol &&
      prevProps.price === nextProps.price &&
      prevProps.change === nextProps.change &&
      prevProps.confidence === nextProps.confidence &&
      prevProps.waveStatus === nextProps.waveStatus &&
      prevProps.timeframe === nextProps.timeframe &&
      prevProps.wavePattern?.timeframe === nextProps.wavePattern?.timeframe &&
      JSON.stringify(prevProps.prices) === JSON.stringify(nextProps.prices)
    );
  },
);
