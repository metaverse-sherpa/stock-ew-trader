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
import { Settings, RefreshCw } from "lucide-react";
import { WavePatternService } from "@/lib/services/wavePatternService";
import { supabase } from "@/lib/supabase";
import type { Timeframe } from "@/lib/types";

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
    try {
      setIsAnalyzing(true);
      await WavePatternService.generateAllPatterns((message) => {
        if (toastRef.current) {
          toast({
            id: toastRef.current,
            title: "Wave Analysis Progress",
            description: message,
          });
        } else {
          toastRef.current = toast({
            title: "Wave Analysis Progress",
            description: message,
          }).id;
        }
      });
    } catch (error) {
      console.error("Error analyzing waves:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAutoAnalysisChange = (enabled: boolean) => {
    setAutoAnalysis(enabled);
    // Here you would typically update a setting in your backend
    // For now we'll just log it
    console.log("Auto analysis:", enabled);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
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

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Manual Wave Analysis</Label>
              <p className="text-sm text-muted-foreground">
                Analyze current price data for wave patterns
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyzeWaves}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isAnalyzing ? "Analyzing..." : "Analyze Now"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
