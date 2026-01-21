import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, Send, MessageCircle } from "lucide-react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const ChatRightPanel = ({ isOpen, onClose, currentUser }) => {
  const { t, i18n } = useTranslation();
  const [conversations, setConversations] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isRTL = i18n.language === "ar";

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.CONVERSATIONS);
      setConversations(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setLoading(false);
    }
  };

  // Fetch messages for selected user
  const fetchMessages = async (userId) => {
    try {
      const response = await axiosInstance.get(`${API_PATHS.CHAT}/messages/${userId}`);
      setMessages(response.data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

  // Fetch messages when user is selected
  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId);
      
      // Poll for new messages
      const interval = setInterval(() => fetchMessages(selectedUserId), 2000);
      return () => clearInterval(interval);
    }
  }, [selectedUserId]);

  // Get selected user data from conversations
  useEffect(() => {
    if (selectedUserId && conversations.length > 0) {
      const conversation = conversations.find((c) => c.userId === selectedUserId || c.user?._id === selectedUserId);
      setSelectedUserData(conversation?.user || { _id: selectedUserId, name: "User" });
    }
  }, [selectedUserId, conversations]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId) return;

    try {
      setSending(true);
      await axiosInstance.post(`${API_PATHS.CHAT}/send`, {
        recipientId: selectedUserId,
        message: newMessage,
      });
      setNewMessage("");
      await fetchMessages(selectedUserId);
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className="fixed inset-0 bg-black/50 md:hidden z-40"
        onClick={onClose}
      />

      {/* Right Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full md:w-96 bg-white shadow-2xl flex flex-col z-50 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } ${isRTL ? "md:left-0 md:right-auto" : ""}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white">{t("pages.chat.title")}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conversations List or Chat Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Conversations list - hidden on mobile when chat is open */}
          {!selectedUserId && (
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">{t("common.loading")}</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                  <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                  <p>{t("pages.chat.emptyState")}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {conversations.map((conv) => {
                    const otherUser = conv.user;
                    return (
                      <button
                        key={conv._id || otherUser._id}
                        onClick={() => setSelectedUserId(otherUser._id)}
                        className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-white flex items-center justify-center font-bold">
                            {(otherUser.name || otherUser.fullName)?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {otherUser.name || otherUser.fullName}
                            </p>
                            <p className="text-sm text-gray-500 truncate line-clamp-1">
                              {conv.lastMessage || t("pages.chat.startNewChat")}
                            </p>
                          </div>
                          {conv.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Chat Area */}
          {selectedUserId && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Chat Header */}
              <div className="p-3 border-b border-gray-200 flex items-center gap-3 bg-gray-50">
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="md:hidden p-2 hover:bg-gray-200 rounded-lg"
                  aria-label="Back to conversations"
                >
                  <X className="w-5 h-5" />
                </button>
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedUserData?.name || selectedUserData?.fullName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedUserData?.email}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>{t("pages.chat.noMessages")}</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isOwn = msg.senderId === currentUser?._id || msg.from === "user";
                    return (
                      <div
                        key={idx}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            isOwn
                              ? "bg-blue-600 text-white rounded-br-none"
                              : "bg-gray-100 text-gray-900 rounded-bl-none"
                          }`}
                        >
                          <p className="break-words">{msg.message || msg.text}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-2">
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t("pages.chat.typeMessage")}
                    disabled={sending}
                    rows={1}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    aria-label="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatRightPanel;
