import React, { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { WavePattern, StockPrice, Timeframe } from "@/lib/types";

interface TradingViewChartProps {
  symbol: string;
  timeframe: Timeframe;
  onTimeframeChange?: (timeframe: Timeframe) => void;
  prices: StockPrice[];
  wavePattern: WavePattern | null;
  showElliottWave?: boolean;
  showFibonacci?: boolean;
  onToggleElliottWave?: (show: boolean) => void;
  onToggleFibonacci?: (show: boolean) => void;
}

const TradingViewChart = ({
  symbol,
  timeframe,
  onTimeframeChange = () => {},
  prices = [],
  wavePattern = null,
  showElliottWave = true,
  showFibonacci = false,
  onToggleElliottWave = () => {},
  onToggleFibonacci = () => {},
}: TradingViewChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('TradingViewChart useEffect triggered:', {
      pricesLength: prices?.length,
      change,
      chartContainerRef: chartContainerRef.current,
      containerWidth: chartContainerRef.current?.clientWidth,
      containerHeight: chartContainerRef.current?.clientHeight,
    });

    if (!chartContainerRef.current || !prices?.length) {
      console.error("Missing requirements for TradingView chart:", {
        hasContainer: !!chartContainerRef.current,
        pricesLength: prices?.length,
      });
      return;
    }

    try {
      console.log('Initializing TradingView chart...');

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

      console.log('TradingView chart initialized successfully:', chart);

      const areaSeries = chart.addAreaSeries({
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
          value: price.price,
        }));

      console.log('Passing data to TradingView chart:', data);

      areaSeries.setData(data);
      chart.timeScale().fitContent();

      console.log('Data successfully loaded into TradingView chart');

      return () => {
        console.log('Cleaning up TradingView chart');
        chart.remove();
      };
    } catch (error) {
      console.error('Error initializing or loading data into TradingView chart:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
      });
    }
  }, [prices, change]);

  console.log('TradingViewChart rendering:', {
    symbol,
    timeframe,
    pricesLength: prices?.length,
    change,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Tabs
          defaultValue={timeframe}
          value={timeframe}
          onValueChange={onTimeframeChange}
          className="w-[300px]"
        >
          <TabsList>
            <TabsTrigger value="1h">1h</TabsTrigger>
            <TabsTrigger value="4h">4h</TabsTrigger>
            <TabsTrigger value="1d">1d</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Elliott Wave toggle removed */}
      </div>

      <div
        ref={chartContainerRef}
        className="w-full h-[450px] bg-muted rounded-lg overflow-hidden"
      />
    </div>
  );
};

export default TradingViewChart;
