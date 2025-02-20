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
  onToggleElliottWave?: (enabled: boolean) => void;
  onTimeframeChange?: (timeframe: Timeframe) => void;
}

const TradingViewChart = ({
  symbol = "AAPL",
  timeframe,
  prices = [],
  wavePattern,
  showElliottWave = true,
  onToggleElliottWave = () => {},
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

    // Use all prices for the chart
    const filteredPrices = prices;

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

      const data = filteredPrices
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

      // Add Elliott Wave markers if enabled, pattern exists, and we have wave data
      if (wavePattern && data.length > 0 && wavePattern.wave1_start) {
        if (showElliottWave) {
          console.log("Drawing Elliott Wave patterns:", {
            timeframe,
            wavePattern,
          });

          // Define wave points
          const wavePoints = [
            // Wave 1 (impulse up)
            {
              start: { price: wavePattern.wave1_start, label: "1" },
              end: { price: wavePattern.wave1_end, label: "1" },
              isImpulse: true,
            },
            // Wave 2 (corrective down)
            {
              start: { price: wavePattern.wave1_end, label: "2" },
              end: { price: wavePattern.wave2_end, label: "2" },
              isImpulse: false,
            },
            // Wave 3 (impulse up)
            {
              start: { price: wavePattern.wave2_end, label: "3" },
              end: { price: wavePattern.wave3_end, label: "3" },
              isImpulse: true,
            },
            // Wave 4 (corrective down)
            {
              start: { price: wavePattern.wave3_end, label: "4" },
              end: { price: wavePattern.wave4_end, label: "4" },
              isImpulse: false,
            },
            // Wave 5 (impulse up)
            {
              start: { price: wavePattern.wave4_end, label: "5" },
              end: {
                price: wavePattern.wave5_end || wavePattern.target_price1,
                label: "5",
              },
              isImpulse: true,
            },
          ];

          // Add ABC waves if they exist
          if (wavePattern.wave_a_start) {
            wavePoints.push({
              start: {
                price: wavePattern.wave5_end || wavePattern.target_price1,
                label: "A",
              },
              end: { price: wavePattern.wave_a_end, label: "A" },
              isImpulse: false,
            });
          }
          if (wavePattern.wave_b_start) {
            wavePoints.push({
              start: { price: wavePattern.wave_a_end, label: "B" },
              end: { price: wavePattern.wave_b_end, label: "B" },
              isImpulse: true,
            });
          }
          if (wavePattern.wave_c_start) {
            wavePoints.push({
              start: { price: wavePattern.wave_b_end, label: "C" },
              end: { price: wavePattern.wave_c_end, label: "C" },
              isImpulse: false,
            });
          }

          // Use actual wave timestamps for time points
          const timePoints = [
            Math.floor(new Date(wavePattern.wave1_start_time).getTime() / 1000),
            Math.floor(new Date(wavePattern.wave1_end_time).getTime() / 1000),
            Math.floor(new Date(wavePattern.wave2_end_time).getTime() / 1000),
            Math.floor(new Date(wavePattern.wave3_end_time).getTime() / 1000),
            Math.floor(new Date(wavePattern.wave4_end_time).getTime() / 1000),
            wavePattern.wave5_end_time
              ? Math.floor(
                  new Date(wavePattern.wave5_end_time).getTime() / 1000,
                )
              : data[data.length - 1].time,
            // Add ABC wave timestamps if they exist
            ...(wavePattern.wave_a_end_time
              ? [
                  Math.floor(
                    new Date(wavePattern.wave_a_end_time).getTime() / 1000,
                  ),
                ]
              : []),
            ...(wavePattern.wave_b_end_time
              ? [
                  Math.floor(
                    new Date(wavePattern.wave_b_end_time).getTime() / 1000,
                  ),
                ]
              : []),
            ...(wavePattern.wave_c_end_time
              ? [
                  Math.floor(
                    new Date(wavePattern.wave_c_end_time).getTime() / 1000,
                  ),
                ]
              : []),
          ];

          // Add target price projections based on wave status
          if (
            (wavePattern.status === "Wave 5 Bullish" ||
              wavePattern.status === "Wave B") &&
            data.length > 0
          ) {
            // For Wave B, we'll use different targets and starting point
            const isWaveB = wavePattern.status === "Wave B";
            const startPrice = isWaveB
              ? wavePattern.wave_b_start
              : wavePattern.wave4_end;
            const startTime = isWaveB
              ? wavePattern.wave_a_end_time
              : wavePattern.wave4_end_time;

            // Only show predictions if we have a valid start point
            if (startPrice && startTime) {
              const lastTime = data[data.length - 1].time;
              const currentPrice = wavePattern.current_price;
              const projectionStartTime = Math.floor(
                new Date().getTime() / 1000,
              );

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

                // Draw line from wave start to target
                const waveStartTime = Math.floor(
                  new Date(startTime).getTime() / 1000,
                );
                projectionLine.setData([
                  { time: waveStartTime, value: startPrice },
                  { time: waveStartTime + 86400 * 90, value: price }, // Project 90 days ahead
                ]);

                // Add price label
                projectionLine.setMarkers([
                  {
                    time: waveStartTime + 86400 * 90,
                    position: "right",
                    color: color,
                    shape: "circle",
                    text: `${price.toFixed(2)}`,
                    size: 1,
                  },
                ]);

                waveSeriesRef.current.push(projectionLine);
              });
            }
          }

          // Add wave lines connecting start and end points
          wavePoints.forEach(({ start, end, isImpulse }, index) => {
            console.log(`Drawing wave ${start.label}:`, {
              start,
              end,
              isImpulse,
            });

            const waveLine = chart.addLineSeries({
              color: isImpulse ? "#22c55e" : "#ef4444", // Green for impulse, Red for corrective
              lineWidth: 2,
              lineStyle: 0,
              title: "", // Remove the wave label from the right side
              lastValueVisible: false,
            });

            // Ensure we have valid time points
            if (timePoints[index] && timePoints[index + 1]) {
              waveLine.setData([
                { time: timePoints[index], value: start.price },
                { time: timePoints[index + 1], value: end.price },
              ]);

              // Add wave number marker at the end of each wave
              waveLine.setMarkers([
                {
                  time: timePoints[index + 1],
                  position: isImpulse ? "aboveBar" : "belowBar",
                  color: isImpulse ? "#22c55e" : "#ef4444",
                  shape: "circle",
                  text: end.label,
                  size: 1,
                  textColor: "white",
                },
              ]);
            }
            waveSeriesRef.current.push(waveLine);
          });
        }
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
          // Clean up wave lines
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
