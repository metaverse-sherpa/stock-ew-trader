import React from 'react';
import { Button } from './ui/button';
import { 
  BookMarked, 
  Bell, 
  FileText,
  LucideIcon
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface QuickAction {
  icon: 'watchlist' | 'alerts' | 'notes';
  label: string;
}

interface QuickActionsPanelProps {
  position: 'left' | 'right';
  actions: QuickAction[];
}

const iconMap: Record<string, LucideIcon> = {
  'watchlist': BookMarked,
  'alerts': Bell,
  'notes': FileText,
};

const QuickActionsPanel = ({ position, actions }: QuickActionsPanelProps) => {
  const positionClass = position === 'left' ? 'left-4' : 'right-4';

  return (
    <div className={`fixed ${positionClass} top-1/2 -translate-y-1/2 flex flex-col gap-2`}>
      <TooltipProvider>
        {actions.map((action) => {
          const Icon = iconMap[action.icon];
          return (
            <Tooltip key={action.icon}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-card hover:bg-accent"
                  onClick={() => console.log(`${action.label} clicked`)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={position === 'left' ? 'right' : 'left'}>
                <p>{action.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
};

export default QuickActionsPanel; 