import { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Get from localStorage or default to 'light'
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'en';
  });

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Update i18n language
    i18n.changeLanguage(language);
    
    // Apply RTL for Arabic
    if (language === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
      document.documentElement.classList.remove('rtl');
    }
    
    localStorage.setItem('language', language);
  }, [language]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    language,
    setTheme,
    setLanguage,
    toggleTheme,
    isDark: theme === 'dark',
    isRTL: language === 'ar',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Convenience hook for RTL/direction detection
export const useDirection = () => {
  const { language, isRTL } = useTheme();
  return {
    isRTL,
    direction: isRTL ? 'rtl' : 'ltr',
    language,
  };
};
