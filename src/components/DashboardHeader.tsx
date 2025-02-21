import React from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Search, Moon, Sun } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

import type { Timeframe, WaveStatus } from "@/lib/types";

interface DashboardHeaderProps {
  children?: React.ReactNode;
  onSearch?: (query: string) => void;
  onTimeframeChange?: (timeframe: Timeframe) => void;
  onWaveStatusChange?: (status: WaveStatus | "all") => void;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  selectedTimeframe?: Timeframe;
  selectedWaveStatus?: WaveStatus | "all";
}

const DashboardHeader = ({
  onSearch = () => {},
  onTimeframeChange = () => {},
  onWaveStatusChange = () => {},
  onThemeToggle = () => {},
  isDarkMode = true,
  selectedTimeframe = "1h",
  selectedWaveStatus = "Wave 5 Bullish",
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
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <Tabs
          defaultValue="1h"
          value={selectedTimeframe}
          onValueChange={(value: Timeframe) => {
            console.log("Timeframe selected:", value);
            onTimeframeChange(value);
          }}
          className="w-[300px]"
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="1h">1h</TabsTrigger>
            <TabsTrigger value="4h">4h</TabsTrigger>
            <TabsTrigger value="1d">1d</TabsTrigger>
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
      </div>

      <div className="flex items-center space-x-4">{children}</div>
    </div>
  );
};

export default DashboardHeader;
