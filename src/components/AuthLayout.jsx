import { useTheme } from "../context/ThemeContext";
import AuthHero from "./AuthHero";

const AuthLayout = ({ children }) => {
  const { language } = useTheme();
  const isArabic = language === 'ar';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Left Panel - Form Area */}
      <div className={`flex-1 lg:basis-1/2 flex items-start justify-center lg:justify-start px-6 sm:px-10 lg:px-16 py-10 lg:py-14 relative z-10`}>
        <div className={`w-full max-w-[480px] ${isArabic ? 'lg:mr-4 xl:mr-8' : 'lg:ml-4 xl:ml-8'}`}>
          {children}
        </div>
      </div>

      {/* Right Panel - Hero */}
      <div className="hidden lg:block lg:basis-1/2 h-screen sticky top-0 relative z-0">
        <AuthHero />
      </div>
    </div>
  );
};

export default AuthLayout;
