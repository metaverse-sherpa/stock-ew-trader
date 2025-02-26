import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Check, X, RefreshCw, Plus } from "lucide-react";
import { Label } from "./ui/label";
import { cn } from "@/lib/utils";

interface AddStockSymbolProps {
  onAddSymbol: (symbol: string) => Promise<void>;
}

export function AddStockSymbol({ onAddSymbol }: AddStockSymbolProps) {
  const [newSymbol, setNewSymbol] = useState("");
  const [isAddingSymbol, setIsAddingSymbol] = useState(false);
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const [shouldShake, setShouldShake] = useState(false);

  const handleAdd = async () => {
    setIsAddingSymbol(true);
    setStatus(null);
    try {
      await onAddSymbol(newSymbol);
      setStatus("success");
    } catch (error) {
      console.error('Add symbol error:', error);
      setStatus("error");
      setShouldShake(true);
      // Remove shake class after animation completes
      setTimeout(() => setShouldShake(false), 500);
    } finally {
      setIsAddingSymbol(false);
      // Clear the status after 2 seconds
      setTimeout(() => setStatus(null), 2000);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Add Stock Symbol</Label>
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Input
            placeholder="Enter stock symbol..."
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            maxLength={5}
            className={cn(
              "uppercase",
              shouldShake && "animate-shake"
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAdd();
              }
            }}
          />
          {status && (
            <div className="absolute inset-y-0 right-2 flex items-center">
              {status === "success" ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={isAddingSymbol || !newSymbol.trim()}
        >
          {isAddingSymbol ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Add a new stock symbol to track wave patterns
      </p>
    </div>
  );
} 