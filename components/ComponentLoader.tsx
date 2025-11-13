import React from 'react';

// Loading fallback component
export const ComponentLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <React.Suspense fallback={
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  }>
    {children}
  </React.Suspense>
);