import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useMode } from "../../context/ModeContext";
import { useTheme } from "../../context/ThemeContext";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import AuthLayout from "../../components/AuthLayout";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { setMode } = useMode();
  const { language } = useTheme();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Get mode from query params or localStorage
  const modeParam = searchParams.get('mode');
  const savedMode = localStorage.getItem('kira_mode');
  const currentMode = modeParam || savedMode || 'company';

  const isArabic = language === 'ar';

  // Set mode in context if provided
  useEffect(() => {
    if (modeParam) {
      setMode(modeParam);
    }
  }, [modeParam, setMode]);

  // Translations
  const translations = {
    en: {
      company: {
        title: 'Welcome Back — Company Workspace',
        subtitle: 'Please enter your details to log in to your company workspace',
      },
      personal: {
        title: 'Welcome Back — Personal Workspace',
        subtitle: 'Please enter your details to log in to your personal workspace',
      },
      backToMode: 'Back to mode selection',
      dontHaveAccount: "Don't have an account?",
      signUp: 'SignUp',
      errors: {
        personalOnly: 'This account is for Personal workspace only. Please login through the Personal workspace.',
        companyOnly: 'This account is for Company workspace only. Please login through the Company workspace.',
      }
    },
    ar: {
      company: {
        title: 'مرحباً بعودتك — مساحة العمل الشركة',
        subtitle: 'الرجاء إدخال بياناتك لتسجيل الدخول إلى مساحة العمل الخاصة بشركتك',
      },
      personal: {
        title: 'مرحباً بعودتك — مساحة العمل الشخصية',
        subtitle: 'الرجاء إدخال بياناتك لتسجيل الدخول إلى مساحة العمل الشخصية',
      },
      backToMode: 'العودة إلى اختيار الوضع',
      dontHaveAccount: 'ليس لديك حساب؟',
      signUp: 'التسجيل',
      errors: {
        personalOnly: 'هذا الحساب مخصص لمساحة العمل الشخصية فقط. يرجى تسجيل الدخول من خلال مساحة العمل الشخصية.',
        companyOnly: 'هذا الحساب مخصص لمساحة العمل للشركة فقط. يرجى تسجيل الدخول من خلال مساحة العمل للشركة.',
      }
    },
  };

  const t = translations[language] || translations.en;
  const modeText = currentMode === 'company' ? t.company : t.personal;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axiosInstance.post(API_PATHS.LOGIN, formData);
      const userToLogin = response.data?.user || response.data;
      const role = userToLogin?.role;

      // Validate role against current mode
      if (currentMode === 'personal' && role !== 'personal') {
        setError(t.errors.personalOnly);
        setLoading(false);
        return;
      }

      if (currentMode === 'company' && role === 'personal') {
        setError(t.errors.companyOnly);
        setLoading(false);
        return;
      }

      // Persist normalized user
      login(response.data);

      // Navigate based on role from backend payload
      if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "hr") {
        navigate("/hr/dashboard");
      } else if (role === "personal") {
        navigate("/personal/dashboard");
      } else {
        navigate("/user/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-10">
        <div className="pt-2">
          <h1 className="text-xl font-semibold text-white">Kira</h1>
          <p className="text-sm text-gray-400 mt-1">Task Manager</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-[28px] leading-tight font-semibold text-white">{modeText.title}</h2>
            <span className="px-2 py-1 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/30">
              {currentMode === 'company' ? (isArabic ? 'شركة' : 'Company') : (isArabic ? 'شخصي' : 'Personal')}
            </span>
          </div>
          <p className="text-sm text-gray-400">{modeText.subtitle}</p>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full h-12 px-4 border border-slate-600 bg-slate-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full h-12 px-4 border border-slate-600 bg-slate-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-12"
                  placeholder="Min 6 Characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-xl uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : "LOGIN"}
          </button>

          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-400">
                {t.dontHaveAccount}{" "}
                <Link
                  to={`/signup?mode=${currentMode}`}
                  className="font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {t.signUp}
                </Link>
              </p>
            </div>

            <div className="text-center pt-2 border-t border-slate-700">
              <Link
                to="/choose-mode"
                className="text-sm text-gray-400 hover:text-gray-300 transition-colors inline-flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {t.backToMode}
              </Link>
            </div>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;
