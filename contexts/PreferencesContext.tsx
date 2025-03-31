import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PreferencesContextType {
  showAdvancedMode: boolean;
  toggleAdvancedMode: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showAdvancedMode, setShowAdvancedMode] = useState(false);

  useEffect(() => {
    // Load saved preferences
    const loadPreferences = async () => {
      try {
        const savedValue = await AsyncStorage.getItem('showAdvancedMode');
        setShowAdvancedMode(savedValue === 'true');
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  const toggleAdvancedMode = async () => {
    try {
      const newValue = !showAdvancedMode;
      await AsyncStorage.setItem('showAdvancedMode', String(newValue));
      setShowAdvancedMode(newValue);
    } catch (error) {
      console.error('Error saving preference:', error);
    }
  };

  return (
    <PreferencesContext.Provider value={{ showAdvancedMode, toggleAdvancedMode }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}; 