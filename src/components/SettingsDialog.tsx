import { useState, useRef, useEffect } from "react";
import { useToast } from "./ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Settings, RefreshCw, Plus } from "lucide-react";
import { WavePatternService } from "@/lib/services/wavePatternService";
import { supabase } from "@/lib/supabase";
import type { Timeframe } from "@/lib/types";
import { Progress } from "./ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "./ui/input";
import { AddStockSymbol } from "./AddStockSymbol";

interface SettingsDialogProps {
  onTimeframeChange?: (timeframe: Timeframe) => void;
  trigger?: React.ReactNode;
}

export function SettingsDialog({
  onTimeframeChange,
  trigger,
}: SettingsDialogProps = {}) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [analysisState, setAnalysisState] = useState<{
    isAnalyzing: boolean;
    progress: {
      message: string;
      symbol: string;
      timeframe: string;
      completed: number;
      total: number;
    } | null;
  }>({
    isAnalyzing: false,
    progress: null,
  });
  const [autoAnalysis, setAutoAnalysis] = useState(false);
  const [defaultTimeframe, setDefaultTimeframe] = useState<Timeframe>("1d");
  const [newSymbol, setNewSymbol] = useState("");
  const [isAddingSymbol, setIsAddingSymbol] = useState(false);

  // Define showToast helper function
  const showToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    toast({
      title,
      description,
      variant,
    });
  };

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.from("user_settings").select().single();
      if (data?.default_timeframe) {
        setDefaultTimeframe(data.default_timeframe as Timeframe);
      }
      setAutoAnalysis(data?.auto_analysis ?? false);
    };

    loadSettings();
  }, []);

  const handleTimeframeChange = async (value: string) => {
    setDefaultTimeframe(value as Timeframe);
    onTimeframeChange?.(value as Timeframe);
    await supabase
      .from("user_settings")
      .upsert({ default_timeframe: value, auto_analysis: autoAnalysis });
  };

  const handleAnalyzeWaves = async () => {
    const startTime = Date.now();

    try {
      setAnalysisState({ isAnalyzing: true, progress: null });

      await WavePatternService.generateAllPatterns((message, progress, patternsFound = 0) => {
        if (progress) {
          setAnalysisState(prev => ({
            ...prev,
            progress: {
              message,
              ...progress,
            },
          }));
        } else {
          setAnalysisState(prev => ({
            ...prev,
            progress: {
              ...prev.progress,
              message,
            },
          }));
        }
      });

      const endTime = Date.now();
      const timeElapsed = ((endTime - startTime) / 1000).toFixed(1);

      showToast("Analysis Complete", `Wave pattern analysis finished successfully. Time elapsed: ${timeElapsed} seconds`);

    } catch (error) {
      console.error("Error analyzing waves:", error);
      showToast("Analysis Error", "Failed to complete wave analysis", "destructive");
    } finally {
      setAnalysisState({ isAnalyzing: false, progress: null });
    }
  };

  const handleAutoAnalysisChange = async (enabled: boolean) => {
    setAutoAnalysis(enabled);
    await supabase
      .from("user_settings")
      .upsert({ auto_analysis: enabled, default_timeframe: defaultTimeframe });
  };

  const handleAddSymbol = async (symbol: string) => {
    try {
      const uppercaseSymbol = symbol.toUpperCase();
      const { error } = await supabase
        .from('stocks')
        .insert([{ symbol: uppercaseSymbol, needs_update: true }]);
  
      if (error) {
        showToast("Error", error.code === '23505' ? `Symbol "${uppercaseSymbol}" already exists.` : `Failed to add symbol: ${error.message}`, "destructive");
        return;
      }
  
      showToast("Success", `Symbol "${uppercaseSymbol}" added successfully!`);
    } catch (err) {
      showToast("Error", `Failed to add symbol: ${err.message}`, "destructive");
    }
  };

  return (
    <div className="relative">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Configure wave analysis and other settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Default Timeframe</Label>
                <p className="text-sm text-muted-foreground">
                  Select your preferred default timeframe
                </p>
              </div>
              <Select
                value={defaultTimeframe}
                onValueChange={handleTimeframeChange}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1h</SelectItem>
                  <SelectItem value="4h">4h</SelectItem>
                  <SelectItem value="1d">1d</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Automatic Wave Analysis</Label>
                <p className="text-sm text-muted-foreground">
                  Run wave analysis daily at midnight
                </p>
              </div>
              <Switch
                checked={autoAnalysis}
                onCheckedChange={handleAutoAnalysisChange}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Add Stock Symbol</Label>
                <AddStockSymbol onAddSymbol={handleAddSymbol} />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Manual Wave Analysis</Label>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Analyze current price data for wave patterns
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAnalyzeWaves}
                    disabled={analysisState.isAnalyzing}
                  >
                    {analysisState.isAnalyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      "Analyze Now"
                    )}
                  </Button>
                </div>

                {analysisState.progress && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{analysisState.progress.symbol} ({analysisState.progress.timeframe})</span>
                      <span>{Math.round((analysisState.progress.completed / analysisState.progress.total) * 100)}%</span>
                    </div>
                    <Progress
                      value={(analysisState.progress.completed / analysisState.progress.total) * 100}
                    />
                    <p className="text-xs text-muted-foreground">
                      {analysisState.progress.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Processed {analysisState.progress.completed} of {analysisState.progress.total} items
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
