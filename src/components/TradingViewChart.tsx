import React, { useEffect, useRef } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { ChevronDown, ChevronUp, ZoomIn, ZoomOut } from "lucide-react";
import { createChart, ColorType } from "lightweight-charts";

import type { StockPrice, WavePattern, Timeframe } from "@/lib/types";

interface TradingViewChartProps {
  symbol: string;
  timeframe: Timeframe;
  prices?: StockPrice[];
  wavePattern?: WavePattern | null;
  showElliottWave?: boolean;
  showFibonacci?: boolean;
  onToggleElliottWave?: (enabled: boolean) => void;
  onToggleFibonacci?: (enabled: boolean) => void;
  onTimeframeChange?: (timeframe: Timeframe) => void;
}

const TradingViewChart = ({
  symbol = "AAPL",
  timeframe,
  prices = [],
  wavePattern,
  showElliottWave = true,
  showFibonacci = false,
  onToggleElliottWave = () => {},
  onToggleFibonacci = () => {},
  onTimeframeChange = () => {},
}: TradingViewChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const waveSeriesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current || !prices?.length) {
      console.log("No chart container or prices:", {
        containerExists: !!chartContainerRef.current,
        pricesLength: prices?.length,
      });
      return;
    }

    // Clean up existing chart before creating a new one
    if (chartRef.current) {
      try {
        waveSeriesRef.current.forEach((series) => {
          chartRef.current.removeSeries(series);
        });
        chartRef.current.remove();
      } catch (error) {
        console.error("Error cleaning up old chart:", error);
      }
      waveSeriesRef.current = [];
      chartRef.current = null;
    }

    console.log("Rendering chart with prices:", {
      symbol,
      timeframe,
      pricesCount: prices.length,
    });

    try {
      // Clear existing chart
      if (chartRef.current) {
        // Remove existing wave lines
        waveSeriesRef.current.forEach((series) => {
          chartRef.current.removeSeries(series);
        });
        waveSeriesRef.current = [];
        chartRef.current.remove();
      }

      // Create new chart
      const chart = createChart(chartContainerRef.current!, {
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#d1d5db",
        },
        grid: {
          vertLines: { color: "rgba(42, 46, 57, 0.5)" },
          horzLines: { color: "rgba(42, 46, 57, 0.5)" },
        },
        width: chartContainerRef.current.clientWidth,
        height: 500,
      });
      chartRef.current = chart;

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
      });

      const data = prices
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        )
        .map((price) => ({
          time: Math.floor(new Date(price.timestamp).getTime() / 1000),
          open: price.open,
          high: price.high,
          low: price.low,
          close: price.close,
        }));

      candlestickSeries.setData(data);

      // Add Elliott Wave markers if enabled and pattern exists
      if (showElliottWave && wavePattern && data.length > 0) {
        console.log("Drawing Elliott Wave patterns:", {
          timeframe,
          wavePattern,
        });

        // Define wave points with both start and end
        const wavePoints = [
          {
            start: { price: wavePattern.wave1_start, label: "1" },
            end: { price: wavePattern.wave1_end, label: "1" },
          },
          {
            start: { price: wavePattern.wave2_start, label: "2" },
            end: { price: wavePattern.wave2_end, label: "2" },
          },
          {
            start: { price: wavePattern.wave3_start, label: "3" },
            end: { price: wavePattern.wave3_end, label: "3" },
          },
          {
            start: { price: wavePattern.wave4_start, label: "4" },
            end: { price: wavePattern.wave4_end, label: "4" },
          },
          {
            start: { price: wavePattern.wave5_start, label: "5" },
            end: { price: wavePattern.target_price1, label: "5" },
          },
        ];

        // Calculate time points for wave distribution
        const timePoints = [];
        const numPoints = wavePoints.length + 1; // We need one more point than waves

        for (let i = 0; i < numPoints; i++) {
          const index = Math.min(
            Math.floor((i / (numPoints - 1)) * (data.length - 1)),
            data.length - 1,
          );
          timePoints.push(data[index].time);
        }

        // Add wave lines connecting start and end points
        wavePoints.forEach(({ start, end }, index) => {
          const waveLine = chart.addLineSeries({
            color: "#8b5cf6",
            lineWidth: 2,
            title: `Wave ${start.label}`,
          });

          // Ensure we have valid time points
          if (timePoints[index] && timePoints[index + 1]) {
            waveLine.setData([
              { time: timePoints[index], value: start.price },
              { time: timePoints[index + 1], value: end.price },
            ]);
          }
          waveSeriesRef.current.push(waveLine);
        });
      }

      // Fit the content
      chart.timeScale().fitContent();
    } catch (error) {
      console.error("Error creating chart:", error);
    }
    // Cleanup function
    return () => {
      if (chartRef.current) {
        try {
          waveSeriesRef.current.forEach((series) => {
            chartRef.current.removeSeries(series);
          });
          chartRef.current.remove();
        } catch (error) {
          console.error("Error cleaning up chart:", error);
        }
        waveSeriesRef.current = [];
        chartRef.current = null;
      }
    };
  }, [prices, showElliottWave, wavePattern, timeframe]);

  return (
    <Card className="w-full h-[600px] bg-background p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">{symbol}</h3>
          <Tabs
            value={timeframe}
            className="w-[300px]"
            onValueChange={(value) => {
              console.log("Chart timeframe changed:", value);
              onTimeframeChange(value as Timeframe);
            }}
          >
            <TabsList>
              <TabsTrigger value="1h">1h</TabsTrigger>
              <TabsTrigger value="4h">4h</TabsTrigger>
              <TabsTrigger value="1d">1d</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="elliott-wave"
              checked={showElliottWave}
              onCheckedChange={onToggleElliottWave}
            />
            <Label htmlFor="elliott-wave">Elliott Wave</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="fibonacci"
              checked={showFibonacci}
              onCheckedChange={onToggleFibonacci}
            />
            <Label htmlFor="fibonacci">Fibonacci</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div
        ref={chartContainerRef}
        className="relative h-[calc(100%-60px)] bg-muted rounded-lg overflow-hidden"
      >
        {/* Price controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col space-y-2">
          <Button variant="outline" size="icon">
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TradingViewChart;
