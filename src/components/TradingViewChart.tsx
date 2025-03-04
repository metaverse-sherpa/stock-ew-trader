import React, { useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { WavePattern, StockPrice, Timeframe } from "@/lib/types";
import type { IChartApi, Time } from "lightweight-charts";

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
  const chartRef = useRef<IChartApi | null>(null);
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

    const initChart = async () => {
      const { createChart, ColorType } = await import("lightweight-charts");
      
      const chart = createChart(chartContainerRef.current!, {
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#d1d5db",
        },
        grid: {
          vertLines: { color: "#2c2c2c" },
          horzLines: { color: "#2c2c2c" },
        },
        width: chartContainerRef.current!.clientWidth,
        height: 350,
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
          time: Math.floor(new Date(price.timestamp).getTime() / 1000) as Time,
          open: price.open,
          high: price.high,
          low: price.low,
          close: price.close,
          volume: price.volume,
        }))
        .sort((a, b) => (a.time as number) - (b.time as number));

      // If we have a wave pattern, ensure we show enough data before wave 1
      if (wavePattern) {
        const wave1StartTime = Math.floor(
          new Date(wavePattern.wave1_start_time).getTime() / 1000,
        );
        // For 1h and 4h show more pre-wave data
        const preWaveDays = timeframe === "1d" ? 30 : 90;
        const minDataTime = wave1StartTime - 86400 * preWaveDays;
        const filteredPriceData = priceData.filter(
          (p) => (p.time as number) >= minDataTime,
        );
        candlestickSeries.setData(filteredPriceData);
      } else {
        candlestickSeries.setData(priceData);
      }

      // Add Elliott Wave patterns if available and enabled
      if (wavePattern && showElliottWave && wavePattern.timeframe === timeframe) {
        // Add wave lines
        const waveSeries = chart.addLineSeries({
          color: "#ffffff",
          lineWidth: 2,
          title: "Elliott Waves",
        });

        // Create wave points
        const wavePoints = [
          {
            time: Math.floor(new Date(wavePattern.wave1_start_time).getTime() / 1000) as Time,
            value: wavePattern.wave1_start,
          },
          {
            time: Math.floor(
              new Date(wavePattern.wave1_end_time).getTime() / 1000,
            ) as Time,
            value: wavePattern.wave1_end,
          },
          {
            time: Math.floor(
              new Date(wavePattern.wave2_end_time).getTime() / 1000,
            ) as Time,
            value: wavePattern.wave2_end,
          },
          {
            time: Math.floor(
              new Date(wavePattern.wave3_end_time).getTime() / 1000,
            ) as Time,
            value: wavePattern.wave3_end,
          },
          {
            time: Math.floor(
              new Date(wavePattern.wave4_end_time).getTime() / 1000,
            ) as Time,
            value: wavePattern.wave4_end,
          },
        ]
          .filter(
            (point) =>
              !isNaN(point.time as number) &&
              point.value !== null &&
              point.value !== undefined &&
              !isNaN(point.value),
          )
          .sort((a, b) => (a.time as number) - (b.time as number));

        // Add Wave 5 point if available
        if (wavePattern.wave5_end && wavePattern.wave5_end_time) {
          const time = Math.floor(
            new Date(wavePattern.wave5_end_time).getTime() / 1000,
          ) as Time;
          if (!isNaN(time as number) && !isNaN(wavePattern.wave5_end)) {
            wavePoints.push({
              time,
              value: wavePattern.wave5_end,
            });
            wavePoints.sort((a, b) => (a.time as number) - (b.time as number));
          }
        }

        // Set wave points without filtering
        waveSeries.setData(wavePoints);
        waveSeriesRef.current.push(waveSeries);

        // Add wave labels with position info
        const waveLabels = [
          {
            time: wavePattern.wave1_end_time,
            text: "1",
            price: wavePattern.wave1_end,
            isBullish: true, // Wave 1 is bullish
          },
          {
            time: wavePattern.wave2_end_time,
            text: "2",
            price: wavePattern.wave2_end,
            isBullish: false, // Wave 2 is bearish
          },
          {
            time: wavePattern.wave3_end_time,
            text: "3",
            price: wavePattern.wave3_end,
            isBullish: true, // Wave 3 is bullish
          },
          {
            time: wavePattern.wave4_end_time,
            text: "4",
            price: wavePattern.wave4_end,
            isBullish: false, // Wave 4 is bearish
          },
        ];

        if (wavePattern.wave5_end && wavePattern.wave5_end_time) {
          waveLabels.push({
            time: wavePattern.wave5_end_time,
            text: "5",
            price: wavePattern.wave5_end,
            isBullish: true, // Wave 5 is bullish
          });
        }

        // Add wave labels
        console.log("Wave labels data:", waveLabels);

        // Filter out any invalid wave labels
        const validWaveLabels = waveLabels.filter((label) => {
          const isValid = label.time && !isNaN(new Date(label.time).getTime());
          if (!isValid) {
            console.warn("Invalid wave label:", label);
          }
          return isValid;
        });

        console.log("Valid wave labels:", validWaveLabels);

        // Create a separate series for each wave label
        validWaveLabels.forEach(({ time, text, price, isBullish }) => {
          const markerTime = Math.floor(new Date(time).getTime() / 1000);
          const labelSeries = chart.addLineSeries({
            color: "transparent",
            lastValueVisible: false,
            priceLineVisible: false,
          });

          // Add a single data point for this label
          labelSeries.setData([{ time: markerTime as Time, value: price }]);

          // Add the marker
          labelSeries.setMarkers([
            {
              time: markerTime as Time,
              position: isBullish ? "aboveBar" : "belowBar",
              color: "#ffffff",
              shape: "circle",
              text,
              size: 1,
            },
          ]);

          waveSeriesRef.current.push(labelSeries);
        });

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
              { time: startTimeSeconds as Time, value: startPrice },
              { time: endTimeSeconds as Time, value: price },
            ]);

            waveSeriesRef.current.push(projectionLine);
          });
        }
      }

      // Fit content after all data is set
      chart.timeScale().fitContent();
    };

    // Initialize the chart
    initChart().catch(console.error);

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
            <TabsTrigger value="1d">1d</TabsTrigger>
            <TabsTrigger value="1wk">1wk</TabsTrigger>
            <TabsTrigger value="1mo">1mo</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Elliott Wave toggle removed */}
      </div>

      <div
        ref={chartContainerRef}
        className="w-full h-[350px] bg-muted rounded-lg overflow-hidden"
      />
    </div>
  );
};

export default TradingViewChart;
