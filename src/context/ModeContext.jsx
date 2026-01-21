import { createContext, useContext, useState, useEffect } from 'react';

const ModeContext = createContext();

export const useMode = () => {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within ModeProvider');
  }
  return context;
};

export const ModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('kira_mode');
    return saved || null;
  });

  useEffect(() => {
    if (mode) {
      localStorage.setItem('kira_mode', mode);
    } else {
      localStorage.removeItem('kira_mode');
    }
  }, [mode]);

  const value = {
    mode,
    setMode,
    isCompany: mode === 'company',
    isPersonal: mode === 'personal',
  };

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
};

