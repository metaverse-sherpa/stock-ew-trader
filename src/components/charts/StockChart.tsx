import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { StockPrice } from '../lib/types';

Chart.register(...registerables);

interface StockChartProps {
  prices: StockPrice[];
}

const StockChart: React.FC<StockChartProps> = ({ prices }) => {
  const data = {
    labels: prices.map((p) => p.timestamp),
    datasets: [
      {
        label: 'Price',
        data: prices.map((p) => p.close),
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
      },
    ],
  };

  return <Line data={data} />;
};

export default StockChart; 