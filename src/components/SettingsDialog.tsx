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
import yahooFinance from 'yahoo-finance2';
import { Dialog as CustomDialog } from './Dialog'; // Import your custom dialog component
import { BubbleNotification } from './BubbleNotification';

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsDisabled, setIsSettingsDisabled] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [notification, setNotification] = useState<{ message: string; onConfirm?: () => void; onCancel?: () => void } | null>(null);

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

  // Log the notification state after it changes
  useEffect(() => {
    if (notification) {
      console.log('Notification set:', notification);
    }
  }, [notification]);

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

  const showCustomDialog = ({ title, message, onConfirm }) => {
    setDialogConfig({ title, message, onConfirm });
    setIsDialogOpen(true);
    setIsSettingsDisabled(true);
  };

  const handleAddSymbol = async (symbol: string) => {
    try {
      // Convert the symbol to uppercase
      const uppercaseSymbol = symbol.toUpperCase();
      console.log('Adding symbol:', uppercaseSymbol);

      // Insert the symbol with needs_update = true
      const { data, error } = await supabase
        .from('stocks')
        .insert([{ symbol: uppercaseSymbol, needs_update: true }]);

      if (error) {
        // Handle duplicate symbol error
        if (error.code === '23505') {
          console.log('Symbol already exists:', uppercaseSymbol);
          setNotification({ message: `Symbol "${uppercaseSymbol}" already exists in the system.` });
          return;
        }

        // Handle other errors
        console.error('Error adding symbol:', error);
        throw error;
      }

      console.log('Symbol added successfully:', data);

      // Show the interactive bubble notification to confirm data update and wave analysis
      await new Promise((resolve) => {
        setNotification({
          message: 'Would you like to update data and analyze waves now?',
          onConfirm: () => {
            resolve(true); // User clicked "Yes"
          },
          onCancel: () => {
            resolve(false); // User clicked "No"
          },
        });
      }).then(async (shouldUpdate) => {
        if (shouldUpdate) {
          // Call the server-side script to update data and analyze waves
          const response = await fetch('/api/updateStockData', { method: 'POST' });
          if (response.ok) {
            // Show a success message using the bubble notification
            setNotification({ message: 'Data update and wave analysis completed!' });
          } else {
            // Show an error message if the update failed
            setNotification({ message: 'Failed to update data. Please try again.' });
          }
        } else {
          // User chose not to update data
          setNotification({ message: 'Data update and wave analysis skipped.' });
        }
      });
    } catch (err) {
      console.error('Error adding symbol:', err);
      // Show an error message using the bubble notification
      setNotification({ message: 'Failed to add symbol. Please try again.' });
    }
  };

  return (
    <div className={`relative ${isSettingsDisabled ? 'pointer-events-none' : ''}`}>
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
                        handleAddSymbol(newSymbol);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddSymbol(newSymbol)}
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

      {/* Render the custom dialog */}
      {isDialogOpen && (
        <CustomDialog
          title={dialogConfig.title}
          message={dialogConfig.message}
          onConfirm={dialogConfig.onConfirm}
        />
      )}

      {/* Render the bubble notification */}
      {notification && (
        <BubbleNotification
          message={notification.message}
          onConfirm={notification.onConfirm}
          onCancel={notification.onCancel}
        />
      )}
    </div>
  );
}
