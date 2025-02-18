import React from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface StockCardProps {
  symbol?: string;
  price?: number;
  change?: number;
  confidence?: number;
  waveStatus?: string;
  onClick?: () => void;
}

const StockCard = ({
  symbol = "AAPL",
  price = 150.25,
  change = 2.5,
  confidence = 85,
  waveStatus = "Wave 5 Bullish",
  onClick = () => {},
}: StockCardProps) => {
  const isPositive = change >= 0;

  return (
    <Card
      className="w-[360px] h-[280px] bg-background hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold">{symbol}</h3>
            <Badge
              variant={confidence >= 80 ? "default" : "secondary"}
              className="h-6"
            >
              {confidence}% Confidence
            </Badge>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="h-6">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {waveStatus}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Current Elliott Wave Pattern Status</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">${price.toFixed(2)}</span>
            <div
              className={`flex items-center ${isPositive ? "text-green-500" : "text-red-500"}`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-5 h-5" />
              ) : (
                <ArrowDownRight className="w-5 h-5" />
              )}
              <span className="font-semibold">{Math.abs(change)}%</span>
            </div>
          </div>
        </div>

        {/* Placeholder for mini chart */}
        <div className="mt-4 h-[120px] bg-muted rounded-lg flex items-center justify-center">
          <span className="text-muted-foreground">Chart Preview</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockCard;
