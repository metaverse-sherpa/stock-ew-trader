import React from 'react';
import { LayoutGrid, List, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';

interface ViewOptionsProps {
  options: ('grid' | 'list' | 'detailed')[];
  onViewChange: (view: 'grid' | 'list' | 'detailed') => void;
}

const ViewOptions = ({ options, onViewChange }: ViewOptionsProps) => {
  return (
    <div className="flex gap-2">
      {options.includes('grid') && (
        <Button variant="outline" size="sm" onClick={() => onViewChange('grid')}>
          <LayoutGrid className="h-4 w-4" />
        </Button>
      )}
      {options.includes('list') && (
        <Button variant="outline" size="sm" onClick={() => onViewChange('list')}>
          <List className="h-4 w-4" />
        </Button>
      )}
      {options.includes('detailed') && (
        <Button variant="outline" size="sm" onClick={() => onViewChange('detailed')}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default ViewOptions; 