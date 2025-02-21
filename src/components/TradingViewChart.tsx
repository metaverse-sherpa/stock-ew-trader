import React, { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";
import { Button } from "./ui/button";
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
  const chartRef = useRef<any>(null);
  const waveSeriesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current || !prices?.length) return;

    // Clear existing chart and series
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {
        console.warn("Chart already disposed");
      }
      chartRef.current = null;
      waveSeriesRef.current = [];
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "#2c2c2c" },
        horzLines: { color: "#2c2c2c" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 600,
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    // Filter prices for current timeframe and convert timestamps
    const priceData = [...prices]
      .filter((price) => price.timeframe === timeframe)
      .map((price) => ({
        time: Math.floor(new Date(price.timestamp).getTime() / 1000),
        open: price.open,
        high: price.high,
        low: price.low,
        close: price.close,
        volume: price.volume,
      }))
      .sort((a, b) => a.time - b.time);

    // If we have a wave pattern, ensure we show enough data before wave 1
    if (wavePattern) {
      const wave1StartTime = Math.floor(
        new Date(wavePattern.wave1_start_time).getTime() / 1000,
      );
      // For 1h and 4h show more pre-wave data
      const preWaveDays = timeframe === "1d" ? 30 : 90;
      const minDataTime = wave1StartTime - 86400 * preWaveDays;
      const filteredPriceData = priceData.filter((p) => p.time >= minDataTime);
      candlestickSeries.setData(filteredPriceData);
    } else {
      candlestickSeries.setData(priceData);
    }

    // Add Elliott Wave patterns if available and enabled
    if (wavePattern && showElliottWave && wavePattern.timeframe === timeframe) {
      // Add wave lines
      const waveSeries = chart.addLineSeries({
        color: "#8b5cf6",
        lineWidth: 2,
        title: "Elliott Waves",
      });

      // Create wave points
      const wavePoints = [
        {
          time: Math.floor(
            new Date(wavePattern.wave1_start_time).getTime() / 1000,
          ),
          value: wavePattern.wave1_start,
        },
        {
          time: Math.floor(
            new Date(wavePattern.wave1_end_time).getTime() / 1000,
          ),
          value: wavePattern.wave1_end,
        },
        {
          time: Math.floor(
            new Date(wavePattern.wave2_end_time).getTime() / 1000,
          ),
          value: wavePattern.wave2_end,
        },
        {
          time: Math.floor(
            new Date(wavePattern.wave3_end_time).getTime() / 1000,
          ),
          value: wavePattern.wave3_end,
        },
        {
          time: Math.floor(
            new Date(wavePattern.wave4_end_time).getTime() / 1000,
          ),
          value: wavePattern.wave4_end,
        },
      ]
        .filter(
          (point) =>
            !isNaN(point.time) &&
            point.value !== null &&
            point.value !== undefined &&
            !isNaN(point.value),
        )
        .sort((a, b) => a.time - b.time);

      // Add Wave 5 point if available
      if (wavePattern.wave5_end && wavePattern.wave5_end_time) {
        const time = Math.floor(
          new Date(wavePattern.wave5_end_time).getTime() / 1000,
        );
        if (!isNaN(time) && !isNaN(wavePattern.wave5_end)) {
          wavePoints.push({
            time,
            value: wavePattern.wave5_end,
          });
          wavePoints.sort((a, b) => a.time - b.time);
        }
      }

      // Set wave points without filtering
      waveSeries.setData(wavePoints);
      waveSeriesRef.current.push(waveSeries);

      // Add wave labels
      const waveLabels = [
        {
          time: wavePattern.wave1_end_time,
          text: "1",
          price: wavePattern.wave1_end,
        },
        {
          time: wavePattern.wave2_end_time,
          text: "2",
          price: wavePattern.wave2_end,
        },
        {
          time: wavePattern.wave3_end_time,
          text: "3",
          price: wavePattern.wave3_end,
        },
        {
          time: wavePattern.wave4_end_time,
          text: "4",
          price: wavePattern.wave4_end,
        },
      ];

      if (wavePattern.wave5_end && wavePattern.wave5_end_time) {
        waveLabels.push({
          time: wavePattern.wave5_end_time,
          text: "5",
          price: wavePattern.wave5_end,
        });
      }

      // Add wave labels
      const labelSeries = chart.addLineSeries({
        color: "transparent",
        lastValueVisible: false,
        priceLineVisible: false,
      });

      const markers = waveLabels.map(({ time, text }) => ({
        time: Math.floor(new Date(time).getTime() / 1000),
        position: "aboveBar",
        color: "#8b5cf6",
        shape: "circle",
        text,
        size: 4,
        textColor: "white",
        borderColor: "#8b5cf6",
        borderWidth: 2,
        fontSize: 14,
      }));

      labelSeries.setMarkers(markers);
      waveSeriesRef.current.push(labelSeries);

      // Add target price projections based on wave status
      if (
        (wavePattern.status === "Wave 5 Bullish" ||
          wavePattern.status === "Wave A" ||
          wavePattern.status === "Wave B") &&
        priceData.length > 0
      ) {
        // Different starting points based on wave status
        let startPrice, startTime;
        if (wavePattern.status === "Wave A") {
          startPrice = wavePattern.wave5_end;
          startTime = wavePattern.wave5_end_time;
        } else if (wavePattern.status === "Wave B") {
          startPrice = wavePattern.wave_a_end;
          startTime = wavePattern.wave_a_end_time;
        } else {
          startPrice = wavePattern.wave4_end;
          startTime = wavePattern.wave4_end_time;
        }

        // Add projection lines for each target
        const targetLines = [
          {
            price: wavePattern.target_price1,
            color: "#22c55e",
            label: "Target 1",
          },
          {
            price: wavePattern.target_price2,
            color: "#8b5cf6",
            label: "Target 2",
          },
          {
            price: wavePattern.target_price3,
            color: "#ec4899",
            label: "Target 3",
          },
        ];

        targetLines.forEach(({ price, color, label }) => {
          const projectionLine = chart.addLineSeries({
            color: color,
            lineWidth: 1,
            lineStyle: 2, // Dashed
            title: label,
          });

          const startTimeSeconds = Math.floor(
            new Date(startTime).getTime() / 1000,
          );
          const projectionDays = 30;
          const endTimeSeconds = startTimeSeconds + 86400 * projectionDays;

          projectionLine.setData([
            { time: startTimeSeconds, value: startPrice },
            { time: endTimeSeconds, value: price },
          ]);

          waveSeriesRef.current.push(projectionLine);
        });
      }
    }

    // Add Fibonacci retracements if enabled
    if (showFibonacci && wavePattern) {
      const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
      const highPrice = wavePattern.wave3_end;
      const lowPrice = wavePattern.wave2_end;
      const priceRange = highPrice - lowPrice;

      fibLevels.forEach((level) => {
        const price = highPrice - priceRange * level;
        const fibLine = chart.addLineSeries({
          color: "#6b7280",
          lineWidth: 1,
          lineStyle: 2,
          title: `Fib ${(level * 100).toFixed(1)}%`,
        });

        const startTime = Math.floor(
          new Date(wavePattern.wave2_end_time).getTime() / 1000,
        );
        const endTime =
          Math.floor(new Date(wavePattern.wave4_end_time).getTime() / 1000) +
          86400 * 30;

        fibLine.setData([
          { time: startTime, value: price },
          { time: endTime, value: price },
        ]);

        waveSeriesRef.current.push(fibLine);
      });
    }

    // Fit content after all data is set
    chart.timeScale().fitContent();

    // Cleanup
    return () => {
      if (chartRef.current) {
        try {
          chartRef.current.remove();
          chartRef.current = null;
          waveSeriesRef.current = [];
        } catch (e) {
          console.warn("Error disposing chart:", e);
        }
      }
    };
  }, [prices, wavePattern, showElliottWave, showFibonacci]);

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

        <div className="flex items-center gap-2">
          <Button
            variant={showElliottWave ? "default" : "outline"}
            onClick={() => onToggleElliottWave(!showElliottWave)}
            className="text-sm"
          >
            Elliott Wave
          </Button>
        </div>
      </div>

      <div
        ref={chartContainerRef}
        className="w-full h-[600px] bg-muted rounded-lg overflow-hidden"
      />
    </div>
  );
};

export default TradingViewChart;
