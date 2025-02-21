import React from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowUp, ArrowDown, Percent } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface PriceTarget {
  price: number;
  confidence: number;
  type: "resistance" | "support";
}

interface AIPredictionsProps {
  targets?: PriceTarget[];
  currentPrice?: number;
  wavePattern?: {
    status: string;
  } | null;
}

const defaultTargets: PriceTarget[] = [
  { price: 150.25, confidence: 85, type: "resistance" },
  { price: 142.75, confidence: 92, type: "support" },
  { price: 155.5, confidence: 78, type: "resistance" },
];

const AIPredictions = ({
  targets = defaultTargets,
  currentPrice = 145.3,
  wavePattern = null,
}: AIPredictionsProps) => {
  return (
    <Card className="w-full p-6 bg-background border-border">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">
            Wave {wavePattern?.status?.split(" ")[1] || "5"} Predictions
          </h3>
          <Badge variant="outline" className="px-2 py-1">
            Wave 5 Analysis
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {targets.map((target, index) => (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="p-4 cursor-help">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {target.type === "resistance" ? (
                          <ArrowUp className="text-green-500" />
                        ) : (
                          <ArrowDown className="text-red-500" />
                        )}
                        <span className="font-medium">
                          ${target.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Percent className="w-4 h-4" />
                        <span className="text-sm">{target.confidence}</span>
                      </div>
                    </div>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Confidence Score: {target.confidence}%</p>
                  <p>
                    {target.type === "resistance" ? "Resistance" : "Support"}{" "}
                    Level
                  </p>
                  <p>
                    Distance:{" "}
                    {(
                      (Math.abs(target.price - currentPrice) / currentPrice) *
                      100
                    ).toFixed(2)}
                    % from current price
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        <div className="text-sm text-muted-foreground mt-4">
          Current Price: ${currentPrice.toFixed(2)}
        </div>
      </div>
    </Card>
  );
};

export default AIPredictions;
