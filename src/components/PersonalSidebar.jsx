import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAssistant } from "../context/AssistantContext";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDirection } from "../context/ThemeContext";

const PersonalSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { open, openDrawer } = useAssistant();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { t } = useTranslation();
  const { isRTL } = useDirection();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navigationLinks = [
    {
      path: "/personal/dashboard",
      label: t('personal.sidebar.dashboard'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      path: "/personal/tasks",
      label: t('personal.sidebar.myTasks'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      path: "/personal/planner",
      label: t('personal.sidebar.dailyPlanner'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      path: "/personal/calendar",
      label: t('personal.sidebar.calendar'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      path: "/personal/inbox",
      label: t('personal.sidebar.inbox'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      path: "/personal/reports",
      label: t('personal.sidebar.reports'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      path: "/personal/settings",
      label: t('personal.sidebar.settings'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      path: "/personal/assistant",
      label: t('personal.sidebar.kiraAssistant'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a5 5 0 015 5v2a5 5 0 01-5 5 5 5 0 01-5-5V7a5 5 0 015-5zm0 14a7 7 0 007-7V7a7 7 0 10-14 0v2a7 7 0 007 7zm-2 4a2 2 0 104 0 2 2 0 00-4 0z" />
        </svg>
      ),
      onClick: openDrawer,
      active: open,
    },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo Section */}
      <div className="p-6 border-b border-indigo-800/30 bg-indigo-900/20">
        <h1 className="text-2xl font-bold text-indigo-400 animate-fadeIn">
          Kira
        </h1>
        <p className="text-sm text-indigo-300/80 mt-1 font-medium">Task Manager</p>
      </div>

      {/* Profile Block */}
      <div
        className="px-4 py-4 mx-2 my-4 border border-indigo-800/30 cursor-pointer bg-indigo-900/30 hover:bg-indigo-800/40 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20"
        onClick={() => {
          navigate("/personal/profile");
          setIsMobileOpen(false);
        }}
        title="View profile"
      >
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
            <p className="text-sm font-semibold text-white truncate" title={user?.name || user?.fullName || "User"}>
              {user?.name || user?.fullName || "User"}
            </p>
            <p className="text-xs text-gray-400 truncate" title={user?.email || "user@example.com"}>
              {user?.email || "user@example.com"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigationLinks.map((link, index) => {
          const isActive = link.active || location.pathname === link.path;
          return (
            <div
              key={link.path || link.label}
              className="animate-fadeIn"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {link.onClick ? (
                <button
                  className={`group relative w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 text-left ${isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50 scale-[1.02]"
                      : "text-indigo-200/80 hover:bg-indigo-900/40 hover:text-white hover:translate-x-1 hover:scale-[1.01]"
                    }`}
                  onClick={() => {
                    link.onClick();
                    setIsMobileOpen(false);
                  }}
                  aria-label={link.label}
                >
                  {isActive && (
                    <div className={`absolute top-0 bottom-0 w-1 bg-indigo-400 animate-slideUp ${isRTL ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'
                      }`}></div>
                  )}
                  <span className={`transition-all duration-300 ${isActive ? "scale-110" : "group-hover:scale-110 group-hover:rotate-3"} ${isRTL ? 'ml-3' : 'mr-3'
                    }`}>
                    {link.icon}
                  </span>
                  <span className="font-medium flex-1">{link.label}</span>
                </button>
              ) : (
                <Link
                  to={link.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`group relative flex items-center px-4 py-3 rounded-xl transition-all duration-300 text-left ${isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50 scale-[1.02]"
                      : "text-indigo-200/80 hover:bg-indigo-900/40 hover:text-white hover:translate-x-1 hover:scale-[1.01]"
                    }`}
                >
                  {isActive && (
                    <div className={`absolute top-0 bottom-0 w-1 bg-indigo-400 animate-slideUp ${isRTL ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'
                      }`}></div>
                  )}
                  <span className={`transition-all duration-300 ${isActive ? "scale-110" : "group-hover:scale-110 group-hover:rotate-3"} ${isRTL ? 'ml-3' : 'mr-3'
                    }`}>
                    {link.icon}
                  </span>
                  <span className="font-medium flex-1">{link.label}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-indigo-800/30 bg-linear-to-r from-slate-900/50 to-indigo-950/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 text-indigo-200/80 hover:bg-linear-to-r hover:from-red-600 hover:to-pink-600 hover:text-white rounded-xl transition-all duration-300 group hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/30"
        >
          <svg
            className={`w-5 h-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-5deg] ${isRTL ? 'ml-3' : 'mr-3'
              }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="font-medium">{t("sidebar.logout")}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
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

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <div className={`hidden lg:flex fixed inset-y-0 w-64 bg-linear-to-br from-slate-900 via-indigo-950 to-purple-950 text-white flex-col shadow-2xl z-40 overflow-y-auto backdrop-blur-sm ${isRTL ? 'right-0 border-l border-indigo-900/30' : 'left-0 border-r border-indigo-900/30'
        }`}>
        <SidebarContent />
      </div>

      {/* Sidebar - Mobile Drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 w-64 bg-linear-to-br from-slate-900 via-indigo-950 to-purple-950 text-white flex-col shadow-2xl z-50 overflow-y-auto border-r border-indigo-900/30 backdrop-blur-sm transform transition-transform duration-300 ease-in-out ${isRTL
            ? (isMobileOpen ? "right-0 translate-x-0" : "right-0 translate-x-full")
            : (isMobileOpen ? "left-0 translate-x-0" : "left-0 -translate-x-full")
          }`}
      >
        <SidebarContent />
      </div>
    </>
  );
};

export default PersonalSidebar;


