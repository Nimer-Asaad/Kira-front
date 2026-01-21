import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { Search, ArrowLeft, Send, Phone, Video, Info, Trash2, Flag, X, AtSign, Shield, Clock } from "lucide-react";
import UserInfoModal from "./UserInfoModal";

const ChatPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileConversation, setShowMobileConversation] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [userInfoDebounce, setUserInfoDebounce] = useState(null);
  const messagesEndRef = useRef(null);

  // Memoize selectedUser to prevent unnecessary re-renders
  const selectedUser = useMemo(() => selectedUserData, [selectedUserData?._id, selectedUserData?.userModel]);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial load
  useEffect(() => {
    fetchConversations();
    fetchAvailableUsers();
    
    // Poll conversations list to update unread counts and new messages
    const conversationsInterval = setInterval(fetchConversations, 3000); // Every 3 seconds
    return () => clearInterval(conversationsInterval);
  }, []);

  // Poll for new messages when conversation is selected
  useEffect(() => {
    if (selectedUserId) {
      fetchConversation();
      const interval = setInterval(fetchConversation, 2000); // Poll every 2 seconds for instant updates
      return () => clearInterval(interval);
    }
  }, [selectedUserId]);

  // Add debouncing for opening user info modal
  const openUserInfoModal = useCallback(() => {
    // Clear any existing timeout
    if (userInfoDebounce) {
      clearTimeout(userInfoDebounce);
    }
    
    // Set new timeout with 150ms debounce
    const timeout = setTimeout(() => {
      setShowUserInfo(true);
    }, 150);
    
    setUserInfoDebounce(timeout);
  }, [userInfoDebounce]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (userInfoDebounce) {
        clearTimeout(userInfoDebounce);
      }
    };
  }, [userInfoDebounce]);

  const fetchConversations = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.CHAT_CONVERSATIONS);
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.CHAT_AVAILABLE_USERS);
      setAvailableUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching available users:", error);
    }
  };

  const fetchConversation = async () => {
    if (!selectedUser) return;

    try {
      const response = await axiosInstance.get(
        `${API_PATHS.CHAT}/conversation/${selectedUser.userModel}/${selectedUser._id}`
      );
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error("Error fetching conversation:", error);
    }
  };

  const handleSelectUser = useCallback((selectedUserDataParam) => {
    const normalized = {
      ...selectedUserDataParam,
      userModel:
        selectedUserDataParam.userModel ||
        (selectedUserDataParam.role === "admin" ? "Admin" : "User"),
    };
    setSelectedUserId(normalized._id);
    setSelectedUserData(normalized);
    setMessages([]);
    setShowMobileConversation(true);
    setShowUserInfo(false);
    
    // Mark messages as read
    markConversationAsRead(normalized._id);
  }, []);

  const markConversationAsRead = async (userId) => {
    try {
      const unreadMessages = messages
        .filter((msg) => msg.receiver._id === (user._id || user.id) && !msg.isRead)
        .map((msg) => msg._id);

      if (unreadMessages.length > 0) {
        await axiosInstance.post(`${API_PATHS.CHAT}/mark-read`, {
          messageIds: unreadMessages,
        });
        fetchConversations(); // Refresh to update unread counts
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      setSending(true);
      const response = await axiosInstance.post(`${API_PATHS.CHAT}/send`, {
        receiverId: selectedUser._id,
        receiverModel: selectedUser.userModel,
        content: newMessage.trim(),
      });

      setMessages((prev) => [...prev, response.data.data]);
      setNewMessage("");
      fetchConversations(); // Update conversation list
      
      // Immediately fetch new messages to show instant update
      setTimeout(() => {
        fetchConversation();
      }, 500);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleBackToList = useCallback(() => {
    setShowMobileConversation(false);
    setSelectedUserId(null);
    setSelectedUserData(null);
  }, []);

  const formatTime = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const isToday = messageDate.toDateString() === today.toDateString();

    if (isToday) {
      return messageDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return messageDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter users by search query
  const filteredConversations = conversations.filter((conv) =>
    (conv.user.fullName || conv.user.name || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
    (conv.user.email || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const filteredAvailableUsers = availableUsers.filter(
    (candidate) =>
      ((candidate.fullName || candidate.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
        (candidate.email || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) &&
      !conversations.some((conv) => conv.user._id === candidate._id) &&
      candidate._id !== (user._id || user.id)
  );

  return (
    <div className="relative min-h-[calc(100vh-4rem)] chat-shell px-3 md:px-6 py-6">
      <div className="floating-chip absolute top-8 right-16 px-4 py-2 rounded-full text-sm text-slate-700 hidden md:flex">
        محادثات أسرع وأقرب
      </div>
      <div className="floating-chip absolute bottom-10 left-12 px-4 py-2 rounded-full text-sm text-slate-700 hidden md:flex">
        ألوان جريئة وحيوية
      </div>

      <div className="relative z-10 flex h-[calc(100vh-5rem)] max-w-6xl mx-auto gap-4">
        {/* Left Panel - Conversation List */}
        <div
          className={`${
            showMobileConversation ? "hidden md:flex" : "flex"
          } md:w-[340px] lg:w-[360px] w-full flex-col chat-panel`}
        >
          {/* Search */}
          <div className="p-4 border-b border-white/60 bg-white/60 rounded-t-[24px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={t("pages.chat.searchConversations")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/80 bg-white/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-200 transition-all"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-slate-500">Loading...</div>
            ) : (
              <>
                {/* Recent Conversations */}
                {filteredConversations.length > 0 && (
                  <div>
                    <div className="px-4 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 border-b border-white/40 text-white rounded-t-[22px]">
                      <h3 className="text-xs font-bold uppercase tracking-[0.18em] flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                          <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                        </svg>
                        {t("pages.chat.recentChats")}
                      </h3>
                    </div>
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.user._id}
                        onClick={() =>
                          handleSelectUser({ ...conv.user, userModel: conv.userModel })
                        }
                        className={`w-full px-4 py-3 transition-all flex items-start gap-3 border-b border-white/40 hover:bg-white/80 hover:-translate-y-[1px] ${
                          selectedUser?._id === conv.user._id ? "bg-white/90 ring-1 ring-sky-200" : ""
                        }`}
                      >
                        <div className="w-11 h-11 rounded-full shadow-sm overflow-hidden flex-shrink-0 bg-gradient-to-br from-sky-400 to-indigo-500 text-white font-semibold flex items-center justify-center">
                          {conv.user.profileImage || conv.user.avatar ? (
                            <img
                              src={conv.user.profileImage || conv.user.avatar}
                              alt={conv.user.fullName || conv.user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>
                              {(conv.user.fullName || conv.user.name || "?")
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <p className="font-semibold text-slate-900 truncate">
                              {conv.user.fullName || conv.user.name}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="chat-badge text-[11px] px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 truncate">
                            {conv.lastMessage.content}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatTime(conv.lastMessage.createdAt)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Available Users */}
                {filteredAvailableUsers.length > 0 && (
                  <div>
                    <div className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 border-b border-white/40 text-white">
                      <h3 className="text-xs font-bold uppercase tracking-[0.18em] flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                        </svg>
                        {t("pages.chat.startNewChat")}
                      </h3>
                    </div>
                    {filteredAvailableUsers.map((availUser) => (
                      <button
                        key={availUser._id}
                        onClick={() => handleSelectUser(availUser)}
                        className="w-full px-4 py-3 hover:bg-white/80 transition-all flex items-center gap-3 border-b border-white/40"
                      >
                        <div className="w-10 h-10 rounded-full shadow-sm overflow-hidden bg-gradient-to-br from-slate-400 to-slate-500 text-white font-semibold flex items-center justify-center">
                          {availUser.profileImage || availUser.avatar ? (
                            <img
                              src={availUser.profileImage || availUser.avatar}
                              alt={availUser.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{availUser.name?.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-slate-900">
                            {availUser.name || availUser.fullName}
                          </p>
                          <p className="text-sm text-slate-500">
                            {availUser.role ? `${availUser.role.charAt(0).toUpperCase() + availUser.role.slice(1)}` : availUser.email}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {filteredConversations.length === 0 &&
                  filteredAvailableUsers.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-slate-500">
                      {searchQuery ? "No users found" : "No conversations yet"}
                    </div>
                  )}
              </>
            )}
          </div>
        </div>

        {/* Right Panel - Active Conversation */}
        <div
          className={`${
            showMobileConversation ? "flex" : "hidden md:flex"
          } flex-1 flex-col chat-panel overflow-hidden`}
        >
          {selectedUser ? (
            <>
              {/* Conversation Header */}
              <div className="px-4 py-4 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 flex items-center gap-3 shadow-lg hover:shadow-xl transition-all">
                <button
                  onClick={handleBackToList}
                  className="md:hidden text-white hover:text-blue-100"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={openUserInfoModal}
                  className="group w-12 h-12 rounded-2xl bg-white shadow-lg overflow-hidden flex-shrink-0 hover:shadow-xl transition-all active:scale-95"
                >
                  {selectedUser.profileImage || selectedUser.avatar ? (
                    <img
                      src={selectedUser.profileImage || selectedUser.avatar}
                      alt={selectedUser.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center group-hover:brightness-110 transition-all">
                      <span className="text-white font-bold text-lg">
                        {selectedUser.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </button>
                <div className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={openUserInfoModal}>
                  <h3 className="font-semibold text-white text-lg truncate">
                    {selectedUser.name || selectedUser.fullName}
                  </h3>
                  <p className="text-sm text-blue-100 truncate">
                    {selectedUser.role ? `${selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}` : "User"}
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <span className="px-3 py-1 chat-pill rounded-full text-xs font-semibold">Live</span>
                  <button
                    onClick={openUserInfoModal}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <Info className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-white/90 to-white/70">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sky-100 flex items-center justify-center">
                        <Send className="w-8 h-8 text-sky-600" />
                      </div>
                      <p className="text-slate-700 font-medium">No messages yet</p>
                      <p className="text-slate-400 text-sm mt-1">Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isSentByMe = message.sender._id === (user._id || user.id);
                    return (
                      <div
                        key={message._id}
                        className={`flex ${
                          isSentByMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`message-bubble max-w-[72%] px-4 py-3 rounded-2xl ${
                            isSentByMe
                              ? "me rounded-br-sm"
                              : "them rounded-bl-sm"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          <p
                            className={`message-meta text-xs mt-1 ${
                              isSentByMe ? "text-blue-100" : "text-slate-500"
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-white/70 p-4 bg-white/90 backdrop-blur-md shadow-inner">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t("pages.chat.typeMessage")}
                    disabled={sending}
                    className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent disabled:bg-slate-100 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="px-5 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl hover:from-sky-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-xl flex items-center gap-2 font-semibold"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("pages.chat.send")}</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            // Empty State - No conversation selected
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white/90 to-white/70">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto text-slate-300 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  Select a conversation
                </h3>
                <p className="text-slate-500">
                  Choose a conversation from the list to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Info Modal */}
      {showUserInfo && selectedUser && (
        <UserInfoModal
          user={selectedUser}
          onClose={() => setShowUserInfo(false)}
        />
      )}
    </div>
  );
};

export default ChatPage;
