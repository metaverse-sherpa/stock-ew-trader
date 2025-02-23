import React from 'react';

interface NewsPanelProps {
  symbol: string;
}

const NewsPanel = ({ symbol }: NewsPanelProps) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">News for {symbol}</h2>
      {/* Add your news feed content here */}
      <p>Latest news and updates</p>
    </div>
  );
};

export default NewsPanel; 