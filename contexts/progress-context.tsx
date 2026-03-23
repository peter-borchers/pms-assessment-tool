'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ProgressContextType {
  triggerProgressRefresh: () => void;
  refreshKey: number;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerProgressRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <ProgressContext.Provider value={{ triggerProgressRefresh, refreshKey }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
