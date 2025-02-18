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

interface StockCardProps {
  symbol?: string;
  price?: number;
  change?: number;
  confidence?: number;
  waveStatus?: string;
  onClick?: () => void;
  prices?: Array<{
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    timeframe?: string;
  }>;
  timeframe?: string;
}

const StockCard = ({
  symbol = "AAPL",
  price = 150.25,
  change = 2.5,
  confidence = 85,
  waveStatus = "Wave 5 Bullish",
  onClick = () => {},
  prices = [],
  timeframe = "1d",
}: StockCardProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

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

        const series = chart.addAreaSeries({
          lineColor: change >= 0 ? "#22c55e" : "#ef4444",
          topColor:
            change >= 0 ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
          bottomColor:
            change >= 0 ? "rgba(34, 197, 94, 0.0)" : "rgba(239, 68, 68, 0.0)",
          lineWidth: 2,
        });

        const data = prices
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          )
          .map((price) => ({
            time: Math.floor(new Date(price.timestamp).getTime() / 1000),
            value: price.close,
          }));

        console.log("Chart data prepared:", {
          dataPoints: data.length,
          firstPoint: data[0],
          lastPoint: data[data.length - 1],
        });

        series.setData(data);

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
    onClick();
  };

  const isPositive = change >= 0;

  return (
    <Card
      className="w-[360px] h-[280px] bg-background hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold">{symbol}</h3>
            <Badge
              variant={confidence >= 80 ? "default" : "secondary"}
              className="h-6"
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
              <span className="font-semibold">{Math.abs(change)}%</span>
            </div>
          </div>
        </div>

        <div
          className="mt-4 h-[120px] bg-muted rounded-lg overflow-hidden"
          ref={chartContainerRef}
        />
      </CardContent>
    </Card>
  );
};

export default StockCard;
