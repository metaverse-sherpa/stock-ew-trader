import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { RefreshCw, Plus } from "lucide-react";
import { Label } from "./ui/label";

interface AddStockSymbolProps {
  onAddSymbol: (symbol: string) => Promise<void>;
}

export function AddStockSymbol({ onAddSymbol }: AddStockSymbolProps) {
  const [newSymbol, setNewSymbol] = useState("");
  const [isAddingSymbol, setIsAddingSymbol] = useState(false);

  const handleAdd = async () => {
    setIsAddingSymbol(true);
    await onAddSymbol(newSymbol);
    setIsAddingSymbol(false);
    setNewSymbol("");
  };

  return (
    <div className="space-y-2">
      <Label>Add Stock Symbol</Label>
      <div className="flex gap-2">
        <Input
          placeholder="Enter stock symbol..."
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          maxLength={5}
          className="uppercase"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAdd();
            }
          }}
        />
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