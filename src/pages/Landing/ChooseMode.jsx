import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMode } from '../../context/ModeContext';
import { useTheme } from '../../context/ThemeContext';

const ModeCard = ({ mode, title, description, titleAr, descriptionAr, icon, onSelect, language }) => {
  const isArabic = language === 'ar';

  return (
    <button
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className="group relative w-full p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 text-left"
      aria-label={isArabic ? titleAr : title}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-indigo-500/0 group-hover:bg-indigo-500/10 transition-all duration-300 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {isArabic ? titleAr : title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {isArabic ? descriptionAr : description}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
};

const ChooseMode = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setMode } = useMode();
  const { language, setLanguage, toggleTheme, isDark } = useTheme();

  const isArabic = language === 'ar';

  // No auto-redirect - page only shows when user navigates to it manually

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    navigate(`/login?mode=${selectedMode}`);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  // Translations
  const translations = {
    en: {
      title: 'Choose your workspace',
      subtitle: 'Kira works for teams and for personal productivity. Select how you want to use it.',
      company: {
        title: 'Company',
        description: 'HR inbox, team task distribution, roles, reports & dashboards.',
      },
      personal: {
        title: 'Personal',
        description: 'My tasks, calendar, daily planning, progress charts & weekly report.',
      },
    },
    ar: {
      title: 'اختار مساحة العمل',
      subtitle: 'Kira مناسب للشركات والاستخدام الشخصي. اختر كيف بدك تستخدمه.',
      company: {
        title: 'شركة',
        description: 'صندوق HR، توزيع مهام للفريق، صلاحيات، تقارير ولوحات تحكم.',
      },
      personal: {
        title: 'شخصي',
        description: 'مهامي، التقويم، تنظيم اليوم، مخططات إنجاز وتقرير أسبوعي.',
      },
    },
  };

  const t = translations[language] || translations.en;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Top Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-10">
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="px-4 py-2 bg-slate-800/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-700 dark:border-slate-700 rounded-lg text-white hover:bg-slate-700/50 transition-all duration-200 text-sm font-medium"
          aria-label="Toggle language"
        >
          {isArabic ? 'EN' : 'AR'}
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="px-4 py-2 bg-slate-800/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-700 dark:border-slate-700 rounded-lg text-white hover:bg-slate-700/50 transition-all duration-200"
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      {/* Left Panel - Branding */}
      <div className="flex-1 lg:basis-1/2 flex items-center justify-center px-6 sm:px-10 lg:px-16 py-10 lg:py-14">
        <div className="w-full max-w-[480px] space-y-8 animate-fadeIn">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              {t.title}
            </h1>
            <p className="text-lg text-slate-300 dark:text-slate-400 leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          {/* Preview Mock Card */}
          <div className="mt-12 hidden lg:block space-y-6">
            {/* Live Preview Card */}
            <div className="mt-12 hidden lg:block relative group">
              <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-3xl -z-10 group-hover:bg-indigo-500/30 transition-all duration-500" />

              <div className="relative p-6 bg-white/10 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-2xl overflow-hidden">
                {/* Decoration blob */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />

                <div className="space-y-5">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-indigo-300 mb-1 tracking-wider uppercase">
                        {isArabic ? 'مشروع نشط' : 'Active Project'}
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        {isArabic ? 'إطلاق حملة الربع الأول' : 'Q1 Marketing Launch'}
                      </h3>
                    </div>
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs font-semibold rounded-full border border-green-500/30">
                      {isArabic ? 'في المسار' : 'On Track'}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">{isArabic ? 'التقدم' : 'Progress'}</span>
                      <span className="text-white font-medium">75%</span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[75%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    </div>
                  </div>

                  {/* Footer Stats */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className={`w-8 h-8 rounded-full border-2 border-slate-800 flex items-center justify-center text-xs font-bold text-white ${i === 1 ? 'bg-blue-500' : i === 2 ? 'bg-purple-500' : 'bg-pink-500'
                          }`}>
                          {i === 1 ? 'JD' : i === 2 ? 'AS' : 'MK'}
                        </div>
                      ))}
                      <div className="w-8 h-8 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center text-xs text-white">
                        +4
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400">{isArabic ? 'تاريخ الاستحقاق' : 'Due Date'}</div>
                      <div className="text-sm font-medium text-white">Mar 15, 2026</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-white/10 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/20 dark:border-slate-700/50">
                <div className="text-2xl font-bold text-white mb-1">50K+</div>
                <div className="text-xs text-slate-300 dark:text-slate-400">{isArabic ? 'مستخدم' : 'Users'}</div>
              </div>
              <div className="p-4 bg-white/10 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/20 dark:border-slate-700/50">
                <div className="text-2xl font-bold text-white mb-1">99%</div>
                <div className="text-xs text-slate-300 dark:text-slate-400">{isArabic ? 'رضا' : 'Uptime'}</div>
              </div>
              <div className="p-4 bg-white/10 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/20 dark:border-slate-700/50">
                <div className="text-2xl font-bold text-white mb-1">24/7</div>
                <div className="text-xs text-slate-300 dark:text-slate-400">{isArabic ? 'دعم' : 'Support'}</div>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-300 dark:text-slate-400">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm">{isArabic ? 'تنظيم المهام بذكاء' : 'Smart task organization'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300 dark:text-slate-400">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm">{isArabic ? 'تقارير تفصيلية' : 'Detailed analytics'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300 dark:text-slate-400">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm">{isArabic ? 'تعاون فريق سلس' : 'Seamless team collaboration'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Mode Selection */}
      <div className="flex-1 lg:basis-1/2 flex items-center justify-center px-6 sm:px-10 lg:px-16 py-10 lg:py-14 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-700 dark:via-indigo-700 dark:to-purple-700">
        <div className="w-full max-w-[480px] space-y-6 animate-slideUp">
          <ModeCard
            mode="company"
            title={t.company.title}
            description={t.company.description}
            titleAr={translations.ar.company.title}
            descriptionAr={translations.ar.company.description}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            onSelect={() => handleModeSelect('company')}
            language={language}
          />

          <ModeCard
            mode="personal"
            title={t.personal.title}
            description={t.personal.description}
            titleAr={translations.ar.personal.title}
            descriptionAr={translations.ar.personal.description}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            onSelect={() => handleModeSelect('personal')}
            language={language}
          />
        </div>
      </div>
    </div>
  );
};

export default ChooseMode;

