import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatButton from "../components/ChatButton";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Settings = () => {
  const { theme, toggleTheme, language, setLanguage, isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    tasks: true,
    messages: true,
  });

  const navLinks = [
    {
      path: user?.role === "admin" ? "/admin/dashboard" : user?.role === "hr" ? "/hr/dashboard" : "/user/dashboard",
      label: t('nav.dashboard'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    ...(user?.role === "hr" ? [
      {
        label: t("nav.inbox"),
        path: "/hr/inbox",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        ),
      },
      {
        label: t("nav.applicants"),
        path: "/hr/applicants",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM6 21v-1a6 6 0 0112 0v1"
            />
          </svg>
        ),
      },
      {
        label: t("nav.trainees"),
        path: "/hr/trainees",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        ),
      },
    ] : []),
    {
      path: "/profile",
      label: t('nav.profile'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118 8.999M15 19l2 2 4-4" />
        </svg>
      ),
    },
    ...(user?.role === "hr" ? [
      {
        label: t("nav.chat"),
        path: "/hr/chat",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        ),
      },
    ] : []),
    {
      path: "/settings",
      label: t('nav.settings'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const handleNotificationToggle = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-slate-900 dark:via-indigo-950/50 dark:to-purple-950/30">
      <Sidebar links={navLinks} />
      <main className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64 min-h-screen w-full overflow-x-auto">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8">
          {/* Header */}
          <div className="animate-slideUp">
            <h1 className="text-3xl sm:text-4xl font-bold text-indigo-600 dark:text-indigo-400">
              {t('settings.title')}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">
              {t('settings.description')}
            </p>
          </div>

          {/* Appearance Section */}
          <div className="card-premium p-6 lg:p-8 animate-fadeIn" style={{ animationDelay: '50ms' }}>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              {t('settings.appearance')}
            </h2>

            <div className="space-y-6">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between py-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('settings.theme')}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {t('settings.themeDescription')}
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDark ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              {/* Theme Preview */}
              <div className="mt-6 p-5 rounded-xl bg-linear-to-br from-slate-100 to-slate-50 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-4">{t('settings.themePreview')}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-12 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold shadow-md hover:shadow-lg transition-shadow">
                    {t('settings.primaryButton')}
                  </div>
                  <div className="flex-1 h-12 rounded-lg bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-100 text-sm font-semibold shadow-sm">
                    {t('settings.cardElement')}
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {t('settings.currentTheme')}: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{isDark ? t('settings.dark') : t('settings.light')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Language Section */}
          <div className="card-premium p-6 lg:p-8 animate-fadeIn" style={{ animationDelay: '100ms' }}>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              {t('settings.language')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('settings.interfaceLanguage')}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="en">English</option>
                  <option value="ar">العربية (Arabic)</option>
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {t('settings.moreLanguagesSoon')}
                </p>
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div className="card-premium p-6 lg:p-8 animate-fadeIn" style={{ animationDelay: '150ms' }}>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {t('settings.account')}
            </h2>

            <div className="space-y-4">
              <button
                onClick={() => navigate('/profile')}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                {t('settings.manageProfile')}
              </button>
            </div>
          </div>

          {/* Notifications Section (Optional) */}
          <div className="card-premium p-6 lg:p-8 animate-fadeIn" style={{ animationDelay: '200ms' }}>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {t('settings.notifications')}
            </h2>

            <div className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700 last:border-0">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">
                      {key === 'email' ? t('settings.emailNotifications') : key === 'push' ? t('settings.pushNotifications') : key === 'tasks' ? t('settings.taskUpdates') : t('settings.messages')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {key === 'email' ? t('settings.emailNotificationsDesc') : key === 'push' ? t('settings.pushNotificationsDesc') : key === 'tasks' ? t('settings.taskUpdatesDesc') : t('settings.messagesDesc')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleNotificationToggle(key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      {user && <ChatButton currentUser={user} />}
    </div>
  );
};

export default Settings;

