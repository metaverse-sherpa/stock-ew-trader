import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./ui/dialog";
import TradingViewChart from "./TradingViewChart";
import AIPredictions from "./AIPredictions";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { useStockDetail } from "@/lib/hooks/useStockDetail";
import type { Timeframe, WaveStatus, Stock } from "@/lib/types";

interface DetailedStockViewProps {
  stock: Stock;
  onClose: () => void;
}

const DetailedStockView: React.FC<DetailedStockViewProps> = ({ stock, onClose }) => {
  const { stockDetail, loading, error } = useStockDetail(
    stock.symbol,
    stock.timeframe,
    stock.waveStatus
  );

  console.log('DetailedStockView rendered:', {
    symbol: stock.symbol,
    timeframe: stock.timeframe,
    waveStatus: stock.waveStatus,
    stockDetail
  });

  const [showElliottWave, setShowElliottWave] = useState(true);
  const [showFibonacci, setShowFibonacci] = useState(false);
  const [stockName, setStockName] = useState<string>("");

  // Update stock name when wave pattern changes
  React.useEffect(() => {
    if (stockDetail?.wavePattern?.name) {
      setStockName(stockDetail.wavePattern.name);
    }
  }, [stockDetail?.wavePattern?.name]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-11/12 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">{stock.symbol} - {stock.name}</h2>
        <p>Wave Status: {stock.waveStatus}</p>
        <button onClick={onClose} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
          Close
        </button>
      </div>
    </div>
  );
};

export default DetailedStockView;
