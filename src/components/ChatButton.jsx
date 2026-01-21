import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import ChatBox from "./ChatBox";

const ChatButton = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const { i18n } = useTranslation();

  // Check if on chat page
  const isChatPage = location.pathname.includes("/chat") || location.pathname === "/hr/chat" || location.pathname === "/admin/chat" || location.pathname === "/trainee/chat";
  
  // RTL check (prefer document dir, fallback to i18n)
  const isRTL =
    (typeof document !== "undefined" && document.documentElement?.dir === "rtl") ||
    i18n.dir?.() === "rtl" ||
    i18n.language === "ar";

  // Fetch unread count periodically
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.CHAT_UNREAD_COUNT);
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.CHAT_AVAILABLE_USERS);
      setAvailableUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching available users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.CHAT_CONVERSATIONS);
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = () => {
    setShowUserList(true);
    fetchConversations();
    fetchAvailableUsers();
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setIsOpen(true);
    setShowUserList(false);
    fetchUnreadCount(); // Refresh unread count after opening chat
  };

  const handleCloseChat = () => {
    setIsOpen(false);
    setSelectedUser(null);
    fetchUnreadCount(); // Refresh unread count after closing chat
  };

  return (
    <>
      {/* Floating Chat Button - Only show if not on chat page */}
      {!isChatPage && (
        <button
          onClick={handleOpenChat}
          className="fixed w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
          style={{
            position: "fixed",
            bottom: "env(safe-area-inset-bottom, 24px)",
            left: "auto",
            right: "24px",
            zIndex: 9999,
          }}
          title="Open Chat"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* User List Modal */}
      {showUserList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
              <button
                onClick={() => setShowUserList(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-500">Loading...</div>
                </div>
              ) : (
                <>
                  {/* Recent Conversations */}
                  {conversations.length > 0 && (
                    <div className="border-b">
                      <div className="px-6 py-3 bg-gray-50">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Recent Conversations
                        </h4>
                      </div>
                      {conversations.map((conv) => (
                        <button
                          key={conv.user._id}
                          onClick={() => handleSelectUser({ ...conv.user, userModel: conv.userModel })}
                          className="w-full px-6 py-4 hover:bg-gray-50 transition-colors flex items-start gap-3 border-b last:border-b-0"
                        >
                          <div className="w-10 h-10 rounded-full shadow-sm overflow-hidden flex-shrink-0">
                            {conv.user.avatar || conv.user.profileImage ? (
                              <img
                                src={conv.user.avatar || conv.user.profileImage}
                                alt={conv.user.fullName || conv.user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {(conv.user.fullName || conv.user.name || "?").charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-900">
                                {conv.user.fullName || conv.user.name}
                              </p>
                              {conv.unreadCount > 0 && (
                                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {conv.lastMessage.content}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Available Users */}
                  {availableUsers.length > 0 && (
                    <div>
                      <div className="px-6 py-3 bg-gray-50">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Start New Chat
                        </h4>
                      </div>
                      {availableUsers
                        .filter(
                          (user) =>
                            !conversations.some(
                              (conv) => conv.user._id === user._id
                            )
                        )
                        .map((user) => (
                          <button
                            key={user._id}
                            onClick={() => handleSelectUser({ ...user, userModel: user.userModel || (user.role === "admin" ? "Admin" : "User") })}
                            className="w-full px-6 py-4 hover:bg-gray-50 transition-colors flex items-center gap-3 border-b last:border-b-0"
                          >
                            <div className="w-10 h-10 rounded-full shadow-sm overflow-hidden flex-shrink-0">
                              {user.avatar || user.profileImage ? (
                                <img
                                  src={user.avatar || user.profileImage}
                                  alt={user.fullName || user.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">
                                    {(user.fullName || user.name || "?").charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-gray-900">
                                {user.fullName || user.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {user.role ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)}` : "User"}
                              </p>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}

                  {conversations.length === 0 && availableUsers.length === 0 && (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-gray-500">No users available</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Box */}
      <ChatBox
        isOpen={isOpen}
        onClose={handleCloseChat}
        selectedUser={selectedUser}
        currentUser={currentUser}
      />
    </>
  );
};

export default ChatButton;
