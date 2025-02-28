import React from 'react';
import { Input } from "./ui/input.tsx";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs.tsx";
import { Switch } from "./ui/switch.tsx";
import { Label } from "./ui/label.tsx";
import { Search, Moon, Sun, Loader2, Settings } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select.tsx";
import { Button } from "./ui/button.tsx";

import type { Timeframe, WaveStatus } from "../lib/types";  

interface DashboardHeaderProps {
  children?: React.ReactNode;
  onSearch?: (query: string) => void;
  onTimeframeChange?: (timeframe: Timeframe) => void;
  onWaveStatusChange?: (status: WaveStatus | "all") => void;
  onThemeToggle?: () => void;
  onSettingsClick?: () => void;
  isDarkMode?: boolean;
  selectedTimeframe?: Timeframe;
  selectedWaveStatus?: WaveStatus | "all";
  isLoading?: boolean;
}

const DashboardHeader = ({
  onSearch = () => {},
  onTimeframeChange = () => {},
  onWaveStatusChange = () => {},
  onThemeToggle = () => {},
  onSettingsClick = () => {},
  isDarkMode = true,
  selectedTimeframe = "1d",
  selectedWaveStatus = "Wave 5 Bullish",
  isLoading = false,
  children,
}: DashboardHeaderProps) => {
  return (
    <div className="w-full h-[72px] px-6 bg-background border-b border-border flex items-center justify-between">
      <div className="flex items-center space-x-6 flex-1">
        <Select
          value={selectedWaveStatus}
          onValueChange={(value: WaveStatus | "all") =>
            onWaveStatusChange(value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select wave status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Wave 5 Bullish">Wave 5 Bullish</SelectItem>
            <SelectItem value="Wave A">Wave A</SelectItem>
            <SelectItem value="Wave B">Wave B</SelectItem>
            <SelectItem value="Wave C">Wave C</SelectItem>
            <SelectItem value="all">All Waves</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative w-[320px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search stocks..."
            className="pl-10"
            onChange={(e) => onSearch((e.target as HTMLInputElement).value)}
          />
        </div>

        <Tabs
          defaultValue="1d"
          value={selectedTimeframe}
          onValueChange={(value: string) => {
            console.log("Timeframe selected:", value);
            onTimeframeChange(value as Timeframe);
          }}
          className="w-[300px]"
        >
          <TabsList>
            <TabsTrigger value="1d">1d</TabsTrigger>
            <TabsTrigger value="1wk">1wk</TabsTrigger>
            <TabsTrigger value="1mo">1mo</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="theme-toggle"
            checked={isDarkMode}
            onCheckedChange={onThemeToggle}
          />
          <Label htmlFor="theme-toggle" className="flex items-center space-x-2">
            {isDarkMode ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Label>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onSettingsClick}
          className="flex items-center space-x-2"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      )}

      {children && <div className="flex items-center space-x-4">{children}</div>}
    </div>
  );
};

export default DashboardHeader;
