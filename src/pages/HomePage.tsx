import React, { useState } from 'react';
import Home from '../components/Home';
import { SettingsDialog } from '../components/SettingsDialog';
import { Settings } from 'lucide-react';

const HomePage = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div>
      <Home />
      <button
        className="fixed top-3 right-3 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsSettingsOpen(true)}
      >
        <Settings className="h-5 w-5" />
      </button>
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default HomePage; 