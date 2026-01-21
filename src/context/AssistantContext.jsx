import { createContext, useContext, useState, useCallback } from "react";

const AssistantContext = createContext();

export const useAssistant = () => useContext(AssistantContext);

export const AssistantProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [enableHistory, setEnableHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("kira_assistant_history_enabled")) !== false;
    } catch {
      return false; // Default: history disabled (clears on refresh)
    }
  });

  const openDrawer = useCallback(() => setOpen(true), []);
  const closeDrawer = useCallback(() => setOpen(false), []);
  
  const toggleHistory = useCallback(() => {
    setEnableHistory(prev => {
      const newValue = !prev;
      localStorage.setItem("kira_assistant_history_enabled", JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  return (
    <AssistantContext.Provider value={{ open, openDrawer, closeDrawer, enableHistory, toggleHistory }}>
      {children}
    </AssistantContext.Provider>
  );
};
