import React from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from './ui/dropdown-menu';
import type { FilterOptions, SectorFilter, MarketCapFilter, VolumeFilter } from '@/lib/types';

interface FilterBarProps {
  onFilterChange: <K extends keyof FilterOptions>(
    type: K,
    value: FilterOptions[K] | undefined
  ) => void;
  onResetFilters: () => void;
  activeFilters: FilterOptions;
}

const SECTORS: SectorFilter[] = [
  'Technology',
  'Healthcare',
  'Finance',
  'Consumer',
  'Energy',
  'Industrial'
];

const MARKET_CAPS: Array<{ value: MarketCapFilter; label: string }> = [
  { value: 'large', label: 'Large Cap (>$10B)' },
  { value: 'mid', label: 'Mid Cap ($2B-$10B)' },
  { value: 'small', label: 'Small Cap (<$2B)' }
];

const VOLUMES: Array<{ value: VolumeFilter; label: string }> = [
  { value: 'high', label: 'High (>5M)' },
  { value: 'medium', label: 'Medium (500K-5M)' },
  { value: 'low', label: 'Low (<500K)' }
];

const CONFIDENCE_LEVELS = [90, 80, 70];

const FilterBar = ({ onFilterChange, onResetFilters, activeFilters }: FilterBarProps) => {
  // Check if any filters are active
  const hasActiveFilters = Object.values(activeFilters).some(value => value !== undefined);

  return (
    <div className="flex gap-2 items-center">
      {/* Sector Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {activeFilters.sector || 'Sector'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onFilterChange('sector', undefined)}>
            All Sectors
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {SECTORS.map((sector) => (
            <DropdownMenuItem 
              key={sector}
              onClick={() => onFilterChange('sector', sector)}
              className={activeFilters.sector === sector ? 'bg-accent' : ''}
            >
              {sector}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Market Cap Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {activeFilters.marketCap ? `Market Cap: ${activeFilters.marketCap}` : 'Market Cap'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onFilterChange('marketCap', undefined)}>
            All Caps
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {MARKET_CAPS.map(({ value, label }) => (
            <DropdownMenuItem 
              key={value}
              onClick={() => onFilterChange('marketCap', value)}
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Volume Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {activeFilters.volume ? `Volume: ${activeFilters.volume}` : 'Volume'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onFilterChange('volume', undefined)}>
            All Volume
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {VOLUMES.map(({ value, label }) => (
            <DropdownMenuItem 
              key={value}
              onClick={() => onFilterChange('volume', value)}
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confidence Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {activeFilters.confidence ? `${activeFilters.confidence}%+ Confidence` : 'Confidence'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onFilterChange('confidence', undefined)}>
            All Confidence
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {CONFIDENCE_LEVELS.map((level) => (
            <DropdownMenuItem 
              key={level}
              onClick={() => onFilterChange('confidence', level)}
            >
              {level}%+
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reset button - only show when filters are active */}
      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onResetFilters}
          className="ml-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Reset Filters
        </Button>
      )}
    </div>
  );
};

export default FilterBar; 