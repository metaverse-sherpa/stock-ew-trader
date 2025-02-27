import React, { useEffect } from "react";
import { Card } from "./ui/card";
import StockCard from "./StockCard";
import { useStocks } from "@/lib/hooks/useStocks";
import type { Timeframe, WaveStatus } from "@/lib/types";
import Spinner from './Spinner';
import { useStockData } from '../hooks/useStockData';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface StockGridProps {
  searchQuery?: string;
  timeframe?: string;
  waveStatus?: string;
}

const StockGrid = ({
  searchQuery = "",
  timeframe = "1d",
  waveStatus = "Wave 5 Bullish",
}: StockGridProps) => {
  const { data, loading, error, fetchData } = useStockData();

  useEffect(() => {
    fetchData(timeframe, waveStatus);
  }, [timeframe, waveStatus]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((stock) => (
        <div key={stock.symbol} className="p-4 border rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold">{stock.name} ({stock.symbol})</h3>
          <p>{stock.exchange} | {stock.sector} | {stock.industry}</p>
          <p>Timeframe: {stock.timeframe} | Status: {stock.status}</p>
          <div className="h-32">
            <Line
              data={{
                labels: stock.historicalData.map((d) => d.date),
                datasets: [
                  {
                    label: 'Price',
                    data: stock.historicalData.map((d) => d.price),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default StockGrid;
