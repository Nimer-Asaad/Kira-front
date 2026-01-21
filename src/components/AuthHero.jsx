import { useRef } from "react";
import { useTheme } from "../context/ThemeContext";

const AuthHero = () => {
  const timersRef = useRef(new WeakMap());
  const { language } = useTheme();
  const isArabic = language === 'ar';

  const handleDown = (e) => {
    const el = e.currentTarget;
    const prev = timersRef.current.get(el);
    if (prev) clearTimeout(prev);
    el.classList.add("is-pressed");
  };

  const scheduleRelease = (e) => {
    const el = e.currentTarget;
    const prev = timersRef.current.get(el);
    if (prev) clearTimeout(prev);
    const t = setTimeout(() => {
      el.classList.remove("is-pressed");
      timersRef.current.delete(el);
    }, 250);
    timersRef.current.set(el, t);
  };

  return (
    <div className="hero relative w-full h-full min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
      {/* Soft dotted texture */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1.4px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Diagonal sheen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/15 mix-blend-overlay" />

      {/* Animated gradient orbs */}
      <div className={`absolute top-1/4 ${isArabic ? '-right-20' : '-left-20'} w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse`}></div>
      <div className={`absolute bottom-1/4 ${isArabic ? '-left-20' : '-right-20'} w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '1s' }}></div>

      {/* Dotted connector lines */}
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none ${isArabic ? 'scale-x-[-1]' : ''}`}
        viewBox="0 0 1200 900"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M160 220 C 320 250, 520 320, 660 360"
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="3"
          strokeDasharray="6 10"
        />
        <rect
          x="620"
          y="320"
          width="360"
          height="200"
          rx="40"
          ry="40"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="3"
          strokeDasharray="10 12"
        />
        <path
          d="M240 640 C 420 620, 640 560, 880 520"
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="3"
          strokeDasharray="6 10"
        />
        <path
          d="M440 280 C 520 300, 560 340, 600 420"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="2.5"
          strokeDasharray="5 9"
        />
        <path
          d="M560 560 C 640 600, 720 640, 820 630"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="2.5"
          strokeDasharray="5 9"
        />
      </svg>

      {/* Top card */}
      <div
        className={`hero-card cursor-pointer absolute top-[7%] ${isArabic ? 'right-[7%]' : 'left-[7%]'} w-[70%] max-w-[560px] bg-white rounded-3xl shadow-2xl px-6 py-5`}
        onMouseDown={handleDown}
        onMouseUp={scheduleRelease}
        onMouseLeave={scheduleRelease}
      >
        <div className="flex items-center justify-between mb-3" dir={isArabic ? 'rtl' : 'ltr'}>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold shadow-sm">Pending</span>
            <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold shadow-sm">Medium Priority</span>
          </div>
          <div className="h-4" />
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-2" dir={isArabic ? 'rtl' : 'ltr'}>{isArabic ? 'حملة التواصل الاجتماعي' : 'Social Media Campaign'}</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4" dir={isArabic ? 'rtl' : 'ltr'}>
          {isArabic ? 'تطوير خطة محتوى لإطلاق المنتج القادم. إنشاء تصميمات جذابة بصرياً مع تعليقات تفاعلية.' : 'Develop a content plan for the upcoming product launch. Create visually appealing designs with engaging captions. Schedule posts strategically to maximize audience engagement.'}
        </p>

        <div className="mb-4" dir={isArabic ? 'rtl' : 'ltr'}>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>{isArabic ? 'تم إنجاز 4/8' : 'Task Done 4/8'}</span>
          </div>
          <div className="progress-track progress--blue" style={{ "--progress": "55%" }}>
            <div className="progress-fill" />
            <div className="progress-dot" />
          </div>
        </div>

        <div className="border-t border-gray-100 my-4" />

        <div className="flex items-center justify-between text-xs text-gray-600" dir={isArabic ? 'rtl' : 'ltr'}>
          <div>
            <div className="text-gray-500">{isArabic ? 'تاريخ البدء' : 'Start Date'}</div>
            <div className="font-semibold text-gray-800">10th Mar 2025</div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 border-2 border-white text-white text-xs font-bold flex items-center justify-center">A</div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-pink-700 border-2 border-white text-white text-xs font-bold flex items-center justify-center">B</div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 border-2 border-white text-white text-xs font-bold flex items-center justify-center">+2</div>
          </div>
          <div className="text-right">
            <div className="text-gray-500">{isArabic ? 'تاريخ الاستحقاق' : 'Due Date'}</div>
            <div className="font-semibold text-gray-800">25th Mar 2025</div>
          </div>
        </div>
      </div>

      {/* Bottom card */}
      <div
        className={`hero-card cursor-pointer absolute bottom-[8%] ${isArabic ? 'right-[9%]' : 'left-[9%]'} w-[68%] max-w-[560px] bg-white rounded-3xl shadow-2xl px-6 py-5`}
        onMouseDown={handleDown}
        onMouseUp={scheduleRelease}
        onMouseLeave={scheduleRelease}
      >
        <div className="flex items-center justify-between mb-3" dir={isArabic ? 'rtl' : 'ltr'}>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold shadow-sm">In Progress</span>
            <span className="px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-semibold shadow-sm">High Priority</span>
          </div>
          <div className="h-4" />
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-2" dir={isArabic ? 'rtl' : 'ltr'}>{isArabic ? 'إعادة تصميم الموقع' : 'Website Redesign'}</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4" dir={isArabic ? 'rtl' : 'ltr'}>
          {isArabic ? 'تحديث الصفحة الرئيسية بمبادئ UI/UX الحديثة وتحسين استجابة الهاتف المحمول.' : 'Update the landing page with modern UI/UX principles and optimize for mobile responsiveness.'}
        </p>

        <div className="mb-4" dir={isArabic ? 'rtl' : 'ltr'}>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>{isArabic ? 'التقدم 7/10' : 'Progress 7/10'}</span>
          </div>
          <div className="progress-track progress--green" style={{ "--progress": "70%" }}>
            <div className="progress-fill" />
            <div className="progress-dot" />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-600" dir={isArabic ? 'rtl' : 'ltr'}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-green-700 border-2 border-white" />
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-white" />
          </div>
          <div className="text-right">
            <div className="font-semibold text-gray-800">{isArabic ? 'الاستحقاق: 15 مارس' : 'Due: 15th Mar 2025'}</div>
          </div>
        </div>
      </div>

      {/* Profile card - Adam */}
      <div
        className={`hero-profile cursor-pointer absolute top-[45%] ${isArabic ? 'left-[26%]' : 'right-[26%]'} bg-white rounded-xl shadow-xl px-4 py-3 flex items-center gap-3 w-[220px] border border-gray-100`}
        onMouseDown={handleDown}
        onMouseUp={scheduleRelease}
        onMouseLeave={scheduleRelease}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold flex items-center justify-center">A</div>
        <div dir={isArabic ? 'rtl' : 'ltr'}>
          <div className="text-sm font-semibold text-gray-900">Adam Cole</div>
          <div className="text-xs text-gray-500">adam@timetoprogram.com</div>
        </div>
      </div>

      {/* Profile card - Luke */}
      <div
        className={`hero-profile cursor-pointer absolute top-[55%] ${isArabic ? 'left-[10%]' : 'right-[10%]'} bg-white rounded-xl shadow-xl px-4 py-3 flex items-center gap-3 w-[220px] border border-gray-100`}
        onMouseDown={handleDown}
        onMouseUp={scheduleRelease}
        onMouseLeave={scheduleRelease}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-semibold flex items-center justify-center">L</div>
        <div dir={isArabic ? 'rtl' : 'ltr'}>
          <div className="text-sm font-semibold text-gray-900">Luke Ryan</div>
          <div className="text-xs text-gray-500">luke@timetoprogram.com</div>
        </div>
      </div>
    </div>
  );
};

export default AuthHero;
