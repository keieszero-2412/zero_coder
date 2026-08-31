import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }) {
  // Load initial settings from localStorage, or use defaults
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('zerocoder_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return {
      theme: 'midnight', // 'midnight' | 'daylight' | 'blush' | 'oceanic' | 'carbon' | 'amber'
      editorFontSize: '14px', // '12px' | '14px' | '16px'
      vimMode: false, // boolean
    };
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('zerocoder_settings', JSON.stringify(settings));
    
    // Apply theme class to body for global CSS overrides
    document.body.className = '';
    document.body.classList.add(`theme-${settings.theme}`);
    
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}
