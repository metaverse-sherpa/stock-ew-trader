import React from 'react';

const Description: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  return <p id={id} className="text-muted-foreground">{children}</p>;
};

export default Description;