import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import { useAssistant } from "../context/AssistantContext";
import { useDirection } from "../context/ThemeContext";

const Sidebar = ({ links }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { open, openDrawer, closeDrawer } = useAssistant();
  const { isRTL } = useDirection();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const baseLinks = Array.isArray(links) ? links : [];

  const navItems = useMemo(() => {
    const items = [];
    const seen = new Set();

    const addItem = (item) => {
      if (!item || !item.path || seen.has(item.path)) return;
      seen.add(item.path);
      items.push(item);
    };

    baseLinks.forEach(addItem);

    if (user?.role === "admin") {
      addItem({
        path: "/admin/create-task",
        label: t("nav.createTask"),
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ),
      });

      addItem({
        path: "/admin/users",
        label: t("nav.teamMembers"),
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
      });

      addItem({
        path: "/admin/chat",
        label: t("nav.chat"),
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
        badge: unreadCount,
      });
    } else if (user?.role === "trainee") {
      addItem({
        path: "/trainee/chat",
        label: t("nav.chat"),
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
        badge: unreadCount,
      });
    }

    addItem({
      path: "/settings",
      label: t("nav.settings"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    });

    addItem({
      path: "/assistant",
      label: t("nav.assistant"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a5 5 0 015 5v2a5 5 0 01-5 5 5 5 0 01-5-5V7a5 5 0 015-5zm0 14a7 7 0 007-7V7a7 7 0 10-14 0v2a7 7 0 007 7zm-2 4a2 2 0 104 0 2 2 0 00-4 0z" />
        </svg>
      ),
      onClick: openDrawer,
      active: open,
    });

    return items;
  }, [baseLinks, user?.role, unreadCount, open, openDrawer, t]);

  const isPathActive = useCallback(
    (path) => location.pathname === path || location.pathname.startsWith(`${path}/`),
    [location.pathname]
  );

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-indigo-800/30 bg-indigo-900/20">
        <h1 className="text-2xl font-bold text-indigo-400 animate-fadeIn">Kira</h1>
        <p className="text-sm text-indigo-300/80 mt-1 font-medium">Task Manager</p>
      </div>

      <div className="px-4 py-4 mx-2 my-4 border border-indigo-800/30 cursor-pointer bg-indigo-900/30 hover:bg-indigo-800/40 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20" onClick={() => navigate("/profile")} title="View profile">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-semibold text-lg shadow-lg ring-2 ring-indigo-400/30">
            {user?.profileImage || user?.avatar ? (
              <img
                src={user.profileImage || user.avatar}
                alt={user.name || user.fullName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              (user?.name || user?.fullName || "U").charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate flex-text-container" title={user?.name || user?.fullName || "User"}>
              {user?.name || user?.fullName || "User"}
            </p>
            <p className="text-xs text-gray-400 truncate flex-text-container" title={user?.email || user?.username || "user@example.com"}>
              {user?.email || user?.username || "user@example.com"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((link, index) => {
          const isActive = link.active || isPathActive(link.path);
          const badgeValue = typeof link.badge === "number" ? link.badge : 0;
          return (
            <div key={link.path} className="animate-fadeIn" style={{ animationDelay: `${index * 50}ms` }}>
              {link.onClick ? (
                <button
                  className={`group relative w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 text-left ${isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50 scale-[1.02]" : "text-indigo-200/80 hover:bg-indigo-900/40 hover:text-white hover:translate-x-1 hover:scale-[1.01]"}`}
                  onClick={() => { link.onClick(); setIsMobileOpen(false); }}
                  aria-label={link.label}
                >
                  {isActive && <div className={`absolute top-0 bottom-0 w-1 bg-indigo-400 animate-slideUp ${isRTL ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'}`}></div>}
                  <span className={`transition-all duration-300 ${isActive ? "scale-110" : "group-hover:scale-110 group-hover:rotate-3"} ${isRTL ? 'ml-3' : 'mr-3'}`}>{link.icon}</span>
                  <span className="font-medium flex-1">{link.labelKey ? t(link.labelKey) : link.label}</span>
                  {badgeValue > 0 && <span className={`bg-linear-to-r from-pink-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-md animate-pulse ${isRTL ? 'mr-auto' : 'ml-auto'}`}>{badgeValue > 9 ? "9+" : badgeValue}</span>}
                </button>
              ) : (
                <Link to={link.path} onClick={() => setIsMobileOpen(false)} className={`group relative flex items-center px-4 py-3 rounded-xl transition-all duration-300 text-left ${isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50 scale-[1.02]" : "text-indigo-200/80 hover:bg-indigo-900/40 hover:text-white hover:translate-x-1 hover:scale-[1.01]"}`}>
                  {isActive && <div className={`absolute top-0 bottom-0 w-1 bg-indigo-400 animate-slideUp ${isRTL ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'}`}></div>}
                  <span className={`transition-all duration-300 ${isActive ? "scale-110" : "group-hover:scale-110 group-hover:rotate-3"} ${isRTL ? 'ml-3' : 'mr-3'}`}>{link.icon}</span>
                  <span className="font-medium flex-1">{link.labelKey ? t(link.labelKey) : link.label}</span>
                  {badgeValue > 0 && <span className={`bg-linear-to-r from-pink-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-md animate-pulse ${isRTL ? 'mr-auto' : 'ml-auto'}`}>{badgeValue > 9 ? "9+" : badgeValue}</span>}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-indigo-800/30 bg-linear-to-r from-slate-900/50 to-indigo-950/50">
        <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-indigo-200/80 hover:bg-linear-to-r hover:from-red-600 hover:to-pink-600 hover:text-white rounded-xl transition-all duration-300 group hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/30">
          <svg className={`w-5 h-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-5deg] ${isRTL ? 'ml-3' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-medium">{t("common.logout")}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className={`lg:hidden fixed top-4 z-50 p-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all duration-300 ${isRTL ? "right-4" : "left-4"
          }`}
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isMobileOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300" onClick={() => setIsMobileOpen(false)} />}

      <div className={`hidden lg:flex fixed inset-y-0 w-64 bg-linear-to-br from-slate-900 via-indigo-950 to-purple-950 text-white flex-col shadow-2xl z-40 overflow-y-auto backdrop-blur-sm ${isRTL ? 'right-0 border-l border-indigo-900/30' : 'left-0 border-r border-indigo-900/30'}`}>
        <SidebarContent />
      </div>

      <div className={`lg:hidden fixed inset-y-0 w-64 bg-linear-to-br from-slate-900 via-indigo-950 to-purple-950 text-white flex-col shadow-2xl z-50 overflow-y-auto border-r border-indigo-900/30 backdrop-blur-sm transform transition-transform duration-300 ease-in-out ${isRTL ? (isMobileOpen ? "right-0 translate-x-0" : "right-0 translate-x-full") : (isMobileOpen ? "left-0 translate-x-0" : "left-0 -translate-x-full")}`}>
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;
