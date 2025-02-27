import React from 'react';

const SettingsDialog = ({ trigger }: { trigger: React.ReactNode }) => {
  return (
    <div>
      {trigger}
      <div>Settings Dialog Content</div>
    </div>
  );
};

export default SettingsDialog; 