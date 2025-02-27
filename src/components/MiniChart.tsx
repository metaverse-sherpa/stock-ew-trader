import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, Time } from 'lightweight-charts';

interface MiniChartProps {
  data: Array<{ time: string; open: number; high: number; low: number; close: number }>;
  height?: number;
  width?: number;
  timeframe?: string;
}

const MiniChart: React.FC<MiniChartProps> = ({ data, height = 100, width = 200, timeframe = '1d' }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94A3B8',
      },
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          visible: false,
        },
      },
      rightPriceScale: {
        visible: false,
      },
      timeScale: {
        visible: false,
      },
      handleScroll: false,
      handleScale: false,
      watermark: undefined,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: 'rgba(99, 102, 241, 1)',
      downColor: 'rgba(239, 68, 68, 1)',
      borderVisible: false,
      wickUpColor: 'rgba(99, 102, 241, 1)',
      wickDownColor: 'rgba(239, 68, 68, 1)',
    });

    // Convert timestamps to Unix time and sort the data
    const formattedData = data
      .map((d) => ({
        time: (Math.floor(new Date(d.time).getTime() / 1000) as unknown) as Time, // Cast to Time type
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))
      .sort((a, b) => (a.time as number) - (b.time as number)); // Ensure data is sorted by time

    candlestickSeries.setData(formattedData);

    // Adjust time scale based on timeframe
    if (timeframe === '1d') {
      chart.timeScale().fitContent();
    } else if (timeframe === '1wk') {
      chart.timeScale().fitContent();
    } else if (timeframe === '1mo') {
      chart.timeScale().fitContent();
    }

    return () => {
      chart.remove();
    };
  }, [data, height, width, timeframe]);

  return <div ref={chartContainerRef} />;
};

export default MiniChart; 