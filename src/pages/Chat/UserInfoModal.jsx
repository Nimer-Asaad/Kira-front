import { memo, useState, useEffect } from "react";
import { X, AtSign, Shield, Clock, Phone, Trash2, Flag } from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

// Skeleton loader for modal content
const UserInfoSkeleton = () => (
  <div className="animate-pulse space-y-6">
    {/* Avatar */}
    <div className="w-24 h-24 mx-auto rounded-3xl bg-slate-200" />
    
    {/* Name and role */}
    <div className="space-y-2 text-center">
      <div className="h-6 bg-slate-200 rounded w-2/3 mx-auto" />
      <div className="h-4 bg-slate-100 rounded w-1/3 mx-auto" />
    </div>

    {/* Contact info */}
    <div className="space-y-3">
      <div className="h-16 bg-slate-100 rounded-2xl" />
      <div className="h-16 bg-slate-100 rounded-2xl" />
    </div>

    {/* Buttons */}
    <div className="space-y-2">
      <div className="h-12 bg-slate-200 rounded-2xl" />
      <div className="h-12 bg-slate-100 rounded-2xl" />
      <div className="h-12 bg-slate-100 rounded-2xl" />
    </div>
  </div>
);

// Memoized UserInfoModal to prevent unnecessary re-renders
const UserInfoModal = memo(({ user, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate data load on modal mount
  useEffect(() => {
    setIsLoading(false);
  }, [user._id]);

  const handleClearChat = async () => {
    if (!window.confirm("Clear chat history with this user?")) {
      return;
    }
    
    try {
      // Call API to clear conversation
      await axiosInstance.delete(`${API_PATHS.CHAT}/clear/${user._id}`);
      
      // Show success message
      alert("Chat history cleared successfully");
      
      // Close modal and refresh
      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Error clearing chat:", error);
      alert("Failed to clear chat history");
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-entrance p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto chat-panel modal-enter">
        {/* Header with Close */}
        <div className="sticky top-0 px-6 py-4 border-b border-white/60 bg-linear-to-r from-sky-500 to-indigo-600 rounded-t-3xl flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">User Details</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-6">
            <UserInfoSkeleton />
          </div>
        ) : (
          <>
            {/* Profile Section */}
            <div className="p-6 border-b border-white/60 text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-linear-to-br from-sky-400 to-indigo-600 overflow-hidden shadow-lg flex items-center justify-center text-white text-4xl font-bold">
                {user.profileImage || user.avatar ? (
                  <img
                    src={user.profileImage || user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {user.name || user.fullName}
              </h2>

              <div className="flex items-center justify-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                  {(user.role || "User").charAt(0).toUpperCase() + (user.role || "User").slice(1)}
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-4">
                <Clock className="w-4 h-4" />
                <span>Active now</span>
              </div>
            </div>

            {/* Contact Info */}
            <div className="p-6 border-b border-white/60 space-y-4">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">
                Contact Info
              </h4>

              {user.email && (
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/60 hover:bg-white/80 transition-colors">
                  <AtSign className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 font-semibold mb-0.5">Email</p>
                    <p className="text-sm text-slate-900 break-all font-medium">{user.email}</p>
                  </div>
                </div>
              )}

              {user.phone && (
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/60 hover:bg-white/80 transition-colors">
                  <Phone className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 font-semibold mb-0.5">Phone</p>
                    <p className="text-sm text-slate-900 font-medium">{user.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-6 space-y-3">
              <button className="w-full px-4 py-3 bg-linear-to-r from-sky-500 to-indigo-600 text-white rounded-2xl font-semibold hover:from-sky-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />
                Call User
              </button>

              <button className="w-full px-4 py-3 bg-white/80 text-slate-900 rounded-2xl font-semibold hover:bg-white transition-all border border-white/60 flex items-center justify-center gap-2 active:scale-95"
                onClick={handleClearChat}
              >
                <Trash2 className="w-5 h-5 text-red-500" />
                <span>Clear Chat</span>
              </button>

              <button className="w-full px-4 py-3 bg-white/60 text-slate-900 rounded-2xl font-semibold hover:bg-white/80 transition-all border border-white/60 flex items-center justify-center gap-2">
                <Flag className="w-5 h-5 text-orange-500" />
                <span>Report User</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if user ID changes
  return prevProps.user?._id === nextProps.user?._id;
});

UserInfoModal.displayName = "UserInfoModal";

export default UserInfoModal;
