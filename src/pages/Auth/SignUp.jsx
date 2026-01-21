import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useMode } from "../../context/ModeContext";
import { useTheme } from "../../context/ThemeContext";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import AuthLayout from "../../components/AuthLayout";

const SignUp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { setMode } = useMode();
  const { language } = useTheme();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    adminInviteToken: "",
  });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
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
        title: 'Create Admin Account — Company',
        subtitle: 'Enter your admin invite code to create a company workspace',
        inviteToken: 'Admin Invite Token',
        inviteTokenPlaceholder: 'Enter your 6-digit code',
        tokenRequired: 'Invite token is required for company signup',
      },
      personal: {
        title: 'Create Account — Personal',
        subtitle: 'Sign up to access your personal workspace',
      },
      backToMode: 'Back to mode selection',
      alreadyHaveAccount: 'Already have an account?',
      login: 'Login',
      errors: {
        personalOnly: 'This account is for Personal workspace only. Please login through the Personal workspace.',
        companyOnly: 'This account is for Company workspace only. Please login through the Company workspace.',
      }
    },
    ar: {
      company: {
        title: 'إنشاء حساب مدير — شركة',
        subtitle: 'أدخل كود الدعوة الخاص بك لإنشاء مساحة عمل للشركة',
        inviteToken: 'كود دعوة المدير',
        inviteTokenPlaceholder: 'أدخل الكود المكون من 6 أرقام',
        tokenRequired: 'كود الدعوة مطلوب للتسجيل في وضع الشركة',
      },
      personal: {
        title: 'إنشاء حساب — شخصي',
        subtitle: 'سجل للوصول إلى مساحة العمل الشخصية',
      },
      backToMode: 'العودة إلى اختيار الوضع',
      alreadyHaveAccount: 'لديك حساب بالفعل؟',
      login: 'تسجيل الدخول',
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

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (currentMode === 'company') {
        const token = formData.adminInviteToken.trim();
        if (!token) {
          setError(t.company.tokenRequired);
          setLoading(false);
          return;
        }

        // Admin registration (ONLY PATH for company mode)
        const response = await axiosInstance.post("/auth/admin/signup", {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          adminInviteToken: token,
        });

        // Upload avatar if provided
        if (avatarFile && response.data?.token) {
          const formDataAvatar = new FormData();
          formDataAvatar.append("avatar", avatarFile);
          await axiosInstance.post(API_PATHS.USER_AVATAR, formDataAvatar, {
            headers: {
              "Content-Type": "multipart/form-data",
              "Authorization": `Bearer ${response.data.token}`
            },
          });
        }

        login(response.data);
        navigate("/admin/dashboard");
      } else {
        // Personal registration
        const payload = {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          mode: 'personal'
        };

        const response = await axiosInstance.post(API_PATHS.SIGNUP, payload);
        const userToLogin = response.data?.user || response.data;
        const role = userToLogin?.role;

        // Upload avatar if provided
        if (avatarFile && response.data?.token) {
          const formDataAvatar = new FormData();
          formDataAvatar.append("avatar", avatarFile);
          await axiosInstance.post(API_PATHS.USER_AVATAR, formDataAvatar, {
            headers: {
              "Content-Type": "multipart/form-data",
              "Authorization": `Bearer ${response.data.token}`
            },
          });
        }

        login(response.data);
        navigate("/personal/dashboard");
      }
    } catch (err) {
      console.error("Signup error:", err);
      if (!err.response) {
        setError("Network Error: Unable to connect to server.");
      } else {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || "Registration failed. Please try again.";
        setError(errorMessage);
      }
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

        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-[28px] leading-tight font-semibold text-white">{modeText.title}</h2>
            <span className="px-2 py-1 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/30">
              {currentMode === 'company' ? (isArabic ? 'شركة' : 'Company') : (isArabic ? 'شخصي' : 'Personal')}
            </span>
          </div>
          <p className="text-sm text-gray-400">{modeText.subtitle}</p>
          <div className="pt-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg flex items-center justify-center text-white text-2xl font-semibold mx-auto lg:mx-0 overflow-hidden hover:scale-105 transition-transform group"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{formData.fullName ? getInitials(formData.fullName) : 'JD'}</span>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">Click to upload avatar</p>
          </div>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4">
              <p className="text-sm text-red-400 whitespace-pre-line">{error}</p>
            </div>
          )}

          <div className="auth-grid grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full h-12 px-4 border border-slate-600 bg-slate-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="John Doe"
              />
            </div>

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
                  autoComplete="new-password"
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

            {currentMode === 'company' && (
              <div>
                <label htmlFor="adminInviteToken" className="block text-sm font-medium text-gray-300 mb-2">
                  {t.company.inviteToken} <span className="text-red-500">*</span>
                </label>
                <input
                  id="adminInviteToken"
                  name="adminInviteToken"
                  type="text"
                  required
                  value={formData.adminInviteToken}
                  onChange={handleChange}
                  className="w-full h-12 px-4 border border-slate-600 bg-slate-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder={t.company.inviteTokenPlaceholder}
                />
              </div>
            )}
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
                Creating account...
              </span>
            ) : "SIGN UP"}
          </button>

          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-400">
                {t.alreadyHaveAccount}{" "}
                <Link
                  to={`/login?mode=${currentMode}`}
                  className="font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {t.login}
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

export default SignUp;
