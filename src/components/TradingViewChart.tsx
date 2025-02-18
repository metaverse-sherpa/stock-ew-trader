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
}

const TradingViewChart = ({
  symbol = "AAPL",
  timeframe = "1d",
  prices = [],
  wavePattern,
  showElliottWave = true,
  showFibonacci = false,
  onToggleElliottWave = () => {},
  onToggleFibonacci = () => {},
}: TradingViewChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !prices?.length) {
      console.log("No chart container or prices:", {
        containerExists: !!chartContainerRef.current,
        pricesLength: prices?.length,
      });
      return;
    }

    console.log("Rendering chart with prices:", prices);

    const chart = createChart(chartContainerRef.current, {
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

    console.log("Processed chart data:", data);
    candlestickSeries.setData(data);

    // Fit the content
    chart.timeScale().fitContent();

    // Add Elliott Wave markers if enabled and pattern exists
    if (showElliottWave && wavePattern) {
      const markers = [
        { price: wavePattern.wave1_start, label: "1" },
        { price: wavePattern.wave2_start, label: "2" },
        { price: wavePattern.wave3_start, label: "3" },
        { price: wavePattern.wave4_start, label: "4" },
        { price: wavePattern.wave5_start, label: "5" },
      ];

      // Add wave markers
      markers.forEach(({ price, label }) => {
        const series = chart.addLineSeries({
          color: "#8b5cf6",
          lineWidth: 2,
          title: `Wave ${label}`,
        });

        series.setData([
          { time: data[0].time, value: price },
          { time: data[data.length - 1].time, value: price },
        ]);
      });
    }

    // Cleanup
    return () => {
      chart.remove();
    };
  }, [prices, showElliottWave, wavePattern]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <Card className="w-full h-[600px] bg-background p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">{symbol}</h3>
          <Tabs defaultValue="1d" className="w-[300px]">
            <TabsList>
              <TabsTrigger value="1h">1h</TabsTrigger>
              <TabsTrigger value="4h">4h</TabsTrigger>
              <TabsTrigger value="1d">1d</TabsTrigger>
              <TabsTrigger value="1w">1w</TabsTrigger>
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
