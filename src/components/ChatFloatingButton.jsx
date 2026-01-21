import { MessageCircle } from "lucide-react";
import { useChatPanel } from "../context/ChatPanelContext";
import { useAuth } from "../context/AuthContext";

const ChatFloatingButton = () => {
  const { openChatPanel } = useChatPanel();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <button
      onClick={openChatPanel}
      className="fixed z-40 bottom-8 right-8 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center focus:outline-none transition-all duration-200 transform hover:scale-110"
      title="Open Chat"
      style={{ boxShadow: "0 4px 24px 0 rgba(79,140,255,0.15)" }}
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
};

export default ChatFloatingButton;
