import { useState, useRef, useEffect } from "react";
import { globalCache } from "@/lib/cache";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Settings, RefreshCw } from "lucide-react";
import { WavePatternService } from "@/lib/services/wavePatternService";
import { supabase } from "@/lib/supabase";
import type { Timeframe } from "@/lib/types";
import EmailSettings from "./EmailSettings";

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
    // Load default timeframe setting
    const loadSettings = async () => {
      const { data } = await supabase.from("user_settings").select().single();

      if (data?.default_timeframe) {
        setDefaultTimeframe(data.default_timeframe as Timeframe);
      }
    };

    loadSettings();
  }, []);

  const handleTimeframeChange = async (value: Timeframe) => {
    setDefaultTimeframe(value);

    // Save to database
    const { error } = await supabase
      .from("user_settings")
      .upsert({ default_timeframe: value });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save default timeframe",
        variant: "destructive",
      });
      return;
    }

    onTimeframeChange?.(value);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure wave analysis and other settings
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 pt-4">
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
                  <SelectItem value="1d">1d</SelectItem>
                  <SelectItem value="1wk">1wk</SelectItem>
                  <SelectItem value="1mo">1mo</SelectItem>
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
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Supabase Configuration</Label>
                <p className="text-sm text-muted-foreground">
                  Connect to a different Supabase database
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = "/supabase-config";
                }}
              >
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Clear Cache</Label>
                <p className="text-sm text-muted-foreground">
                  Clear cached data to fetch fresh data from the server
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  globalCache.clear();
                  toast({
                    title: "Cache Cleared",
                    description: "All cached data has been cleared.",
                  });
                }}
              >
                Clear Cache
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="pt-4">
            <EmailSettings />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
