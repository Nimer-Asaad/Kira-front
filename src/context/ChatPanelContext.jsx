import React, { createContext, useState, useCallback } from "react";

export const ChatPanelContext = createContext();

export const ChatPanelProvider = ({ children }) => {
  const [chatPanelOpen, setChatPanelOpen] = useState(false);

  const openChatPanel = useCallback(() => {
    setChatPanelOpen(true);
  }, []);

  const closeChatPanel = useCallback(() => {
    setChatPanelOpen(false);
  }, []);

  const toggleChatPanel = useCallback(() => {
    setChatPanelOpen((prev) => !prev);
  }, []);

  return (
    <ChatPanelContext.Provider
      value={{
        chatPanelOpen,
        openChatPanel,
        closeChatPanel,
        toggleChatPanel,
      }}
    >
      {children}
    </ChatPanelContext.Provider>
  );
};

export const useChatPanel = () => {
  const context = React.useContext(ChatPanelContext);
  if (!context) {
    throw new Error("useChatPanel must be used within ChatPanelProvider");
  }
  return context;
};
