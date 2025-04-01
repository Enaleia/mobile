import React, { createContext, useContext, useState } from 'react';

interface DevModeContextType {
  isDevMode: boolean;
  showTimers: boolean;
  toggleDevMode: () => void;
}

const DevModeContext = createContext<DevModeContextType | null>(null);

export const DevModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDevMode, setIsDevMode] = useState(false);
  const [showTimers, setShowTimers] = useState(false);

  const toggleDevMode = () => {
    setIsDevMode(prev => !prev);
    setShowTimers(prev => !prev);
  };

  return (
    <DevModeContext.Provider value={{ isDevMode, showTimers, toggleDevMode }}>
      {children}
    </DevModeContext.Provider>
  );
};

export const useDevMode = () => {
  const context = useContext(DevModeContext);
  if (!context) {
    throw new Error('useDevMode must be used within a DevModeProvider');
  }
  return context;
}; 