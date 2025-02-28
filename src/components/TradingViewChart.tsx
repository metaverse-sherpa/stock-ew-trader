import React, { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";
import { StockPrice, Timeframe } from "../lib/types";

interface TradingViewChartProps {
  symbol: string;
  timeframe: Timeframe;
  historicalData: StockPrice[]; // Accept historical data as a prop
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol,
  timeframe,
  historicalData = [], // Default to an empty array
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current || historicalData.length === 0) {
      console.error("Missing requirements for TradingView chart:", {
        hasContainer: !!chartContainerRef.current,
        pricesLength: historicalData.length,
      });
      return; // Prevent rendering if requirements are not met
    }

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
      height: 450,
      rightPriceScale: {
        visible: true,
      },
      timeScale: {
        visible: true,
      },
      handleScroll: true,
      handleScale: true,
    });

    // Create a candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    // Prepare data for the candlestick chart
    const candlestickData = historicalData.map((price) => ({
      time: Math.floor(new Date(price.timestamp).getTime() / 1000), // Convert to Unix timestamp
      open: price.open,
      high: price.high,
      low: price.low,
      close: price.close,
    }));

    candlestickSeries.setData(candlestickData);
    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [historicalData]);

  if (historicalData.length === 0) {
    return <div>No historical data available for {symbol}.</div>; // Placeholder for no data
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{symbol} - {timeframe}</h2>
      <div ref={chartContainerRef} className="w-full h-[450px] bg-muted rounded-lg overflow-hidden" />
    </div>
  );
};

export default TradingViewChart; 