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

interface SettingsDialogProps {
  onTimeframeChange?: (timeframe: Timeframe) => void;
  trigger?: React.ReactNode;
}

export function SettingsDialog({
  onTimeframeChange,
  trigger,
}: SettingsDialogProps = {}) {
  const { toast } = useToast();
  const toastRef = useRef<string>();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoAnalysis, setAutoAnalysis] = useState(false);
  const [defaultTimeframe, setDefaultTimeframe] = useState<Timeframe>("1d");
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showExistingSymbolDialog, setShowExistingSymbolDialog] = useState(false);
  const [showAnalyzePromptDialog, setShowAnalyzePromptDialog] = useState(false);
  const [analysisStats, setAnalysisStats] = useState<{
    totalPatterns: number;
    timeElapsed: string;
  } | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<{
    message: string;
    symbol: string;
    timeframe: string;
    completed: number;
    total: number;
  } | null>(null);
  const [newSymbol, setNewSymbol] = useState("");
  const [isAddingSymbol, setIsAddingSymbol] = useState(false);
  const [existingSymbol, setExistingSymbol] = useState("");
  const [lastAddedSymbol, setLastAddedSymbol] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.from("user_settings").select().single();
      if (data?.default_timeframe) {
        setDefaultTimeframe(data.default_timeframe as Timeframe);
      } else {
        // If no setting exists, create one with 1d default
        await supabase.from("user_settings").upsert({
          default_timeframe: "1d",
          auto_analysis: false
        });
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
    let totalPatternsFound = 0;

    try {
      setIsAnalyzing(true);
      setAnalysisProgress(null);
      
      await WavePatternService.generateAllPatterns((message, progress, patternsFound = 0) => {
        if (progress) {
          setAnalysisProgress({
            message,
            ...progress,
          });
          totalPatternsFound += patternsFound;
        } else {
          setAnalysisProgress(prev => prev ? { ...prev, message } : null);
        }
      });

      const endTime = Date.now();
      const timeElapsed = ((endTime - startTime) / 1000).toFixed(1);

      setAnalysisStats({
        totalPatterns: totalPatternsFound,
        timeElapsed: timeElapsed
      });
      setShowCompletionDialog(true);

    } catch (error) {
      console.error("Error analyzing waves:", error);
      toast({
        title: "Analysis Error",
        description: "Failed to complete wave analysis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(null);
    }
  };

  const handleAutoAnalysisChange = (enabled: boolean) => {
    setAutoAnalysis(enabled);
    // Here you would typically update a setting in your backend
    // For now we'll just log it
    console.log("Auto analysis:", enabled);
  };

  const handleAddSymbol = async () => {
    const symbol = newSymbol.trim().toUpperCase();
    
    if (!symbol) {
      toast({
        title: "Invalid Symbol",
        description: "Please enter a valid stock symbol",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAddingSymbol(true);

      // Check if symbol already exists
      const { data: existingStock } = await supabase
        .from("stocks")
        .select("symbol")
        .eq("symbol", symbol)
        .single();

      if (existingStock) {
        setExistingSymbol(symbol);
        setShowExistingSymbolDialog(true);
        return;
      }

      // Add new stock
      const { error: insertError } = await supabase
        .from("stocks")
        .insert([
          {
            symbol: symbol,
            exchange: "NYSE",
            name: symbol,
          },
        ]);

      if (insertError) throw insertError;

      setLastAddedSymbol(symbol);
      setNewSymbol(""); // Clear input
      setShowAnalyzePromptDialog(true);

    } catch (error) {
      console.error("Error adding symbol:", error);
      toast({
        title: "Error",
        description: "Failed to add symbol to database",
        variant: "destructive",
      });
    } finally {
      setIsAddingSymbol(false);
    }
  };

  return (
    <>
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
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter stock symbol..."
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    maxLength={5}
                    className="uppercase"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSymbol();
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddSymbol}
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
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      "Analyze Now"
                    )}
                  </Button>
                </div>

                {isAnalyzing && analysisProgress && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{analysisProgress.symbol} ({analysisProgress.timeframe})</span>
                      <span>{Math.round((analysisProgress.completed / analysisProgress.total) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(analysisProgress.completed / analysisProgress.total) * 100} 
                    />
                    <p className="text-xs text-muted-foreground">
                      {analysisProgress.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Processed {analysisProgress.completed} of {analysisProgress.total} items
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Analysis Complete</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Wave pattern analysis has finished successfully.</p>
              {analysisStats && (
                <>
                  <p>Total patterns found: {analysisStats.totalPatterns}</p>
                  <p>Time elapsed: {analysisStats.timeElapsed} seconds</p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showExistingSymbolDialog} onOpenChange={setShowExistingSymbolDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Symbol Already Exists</AlertDialogTitle>
            <AlertDialogDescription>
              The symbol {existingSymbol} is already in the database. Please enter a different symbol.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setShowExistingSymbolDialog(false);
              setNewSymbol(""); // Clear the input
            }}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog 
        open={showAnalyzePromptDialog} 
        onOpenChange={setShowAnalyzePromptDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Symbol Added Successfully</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{lastAddedSymbol} has been added to the database.</p>
              <p>Would you like to analyze wave patterns for this symbol now?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogAction
              onClick={() => {
                setShowAnalyzePromptDialog(false);
                handleAnalyzeWaves();
              }}
              className="bg-primary"
            >
              Yes, analyze now
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => setShowAnalyzePromptDialog(false)}
              variant="outline"
            >
              Later
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
