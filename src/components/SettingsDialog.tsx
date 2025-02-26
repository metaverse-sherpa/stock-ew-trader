import React from 'react';
import { useState, useEffect } from "react";
import { useToast } from "./ui/use-toast.tsx"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "./ui/dialog.tsx";
import { Button } from "./ui/button.tsx";
import { Switch } from "./ui/switch.tsx";
import { Label } from "./ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select.tsx";
import { RefreshCw } from "lucide-react";
import { WavePatternService } from "../lib/services/wavePatternService.ts";
import { supabase } from "../lib/supabase.ts";
import type { Timeframe } from "../lib/types.ts";
import { Progress } from "./ui/progress.tsx";

import { AddStockSymbol } from "./AddStockSymbol.tsx";

interface SettingsDialogProps {
  onTimeframeChange?: (timeframe: Timeframe) => void;
  trigger?: React.ReactNode;
}

export const SettingsDialog = ({
  onTimeframeChange,
  trigger,
}: SettingsDialogProps = {}) => {
  const { toast } = useToast();
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

      await WavePatternService.generateAllPatterns((message, progress) => {
        setAnalysisState(prev => ({
          ...prev,
          progress: {
            message,
            symbol: progress?.symbol || '',
            timeframe: progress?.timeframe || '',
            completed: progress?.completed || 0,
            total: progress?.total || 0,
          },
        }));
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
      const response = await fetch('/api/validateStock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol })
      });

      if (!response.ok) throw new Error('API Error');
      
      const stockData = await response.json();
      const { error } = await supabase
        .from('stocks')
        .insert([{ ...stockData, needs_update: true }]);

      if (error) throw error;
      showToast("Success", `Symbol "${symbol}" added!`);
    } catch (err) {
      console.error('Error:', err);
      showToast("Error", "Failed to add symbol", "destructive");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your application settings
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Default Timeframe</Label>
            <Select value={defaultTimeframe} onValueChange={handleTimeframeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 Hour</SelectItem>
                <SelectItem value="4h">4 Hours</SelectItem>
                <SelectItem value="1d">1 Day</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="auto-analysis" 
              checked={autoAnalysis} 
              onCheckedChange={handleAutoAnalysisChange}
            />
            <Label htmlFor="auto-analysis">Automatic Analysis</Label>
          </div>

          <AddStockSymbol onAddSymbol={handleAddSymbol} />

          <Button 
            onClick={handleAnalyzeWaves} 
            disabled={analysisState.isAnalyzing}
          >
            {analysisState.isAnalyzing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Analyze Wave Patterns
          </Button>

          {analysisState.progress && (
            <div className="space-y-2">
              <p>{analysisState.progress.message}</p>
              <Progress 
                value={(analysisState.progress.completed / analysisState.progress.total) * 100}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};