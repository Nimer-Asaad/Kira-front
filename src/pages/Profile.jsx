import { useEffect, useMemo, useState, useRef } from "react";
import Sidebar from "../components/Sidebar";
import ChatButton from "../components/ChatButton";
import AvatarCropper from "../components/AvatarCropper";
import ImageLightbox from "../components/ImageLightbox";
import CVSection from "../components/Profile/CVSection";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const Profile = ({ variant = "default" }) => {
  const { user, login } = useAuth();
  const { t, i18n } = useTranslation();
  const isPersonalVariant = variant === "personal" || variant === "user";
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    avatar: "",
    phone: "",
    department: "",
    position: "",
    bio: "",
  });
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState("");
  const fileInputRef = useRef(null);

  const navLinks = useMemo(() => {
    if (isPersonalVariant) return [];

    if (user?.role === "admin") {
      return [
        {
          path: "/admin/dashboard",
          label: t('nav.dashboard'),
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
        },
        {
          path: "/admin/tasks",
          label: t('nav.manageTasks'),
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ),
        },
        {
          path: "/admin/create-task",
          label: t('nav.createTask'),
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          ),
        },
        {
          path: "/admin/users",
          label: t('nav.teamMembers'),
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },
        {
          path: "/profile",
          label: t('nav.profile'),
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118 8.999M15 19l2 2 4-4" />
            </svg>
          ),
        },
      ];
    }

    if (user?.role === "hr") {
      return [
        {
          path: "/hr/dashboard",
          label: t('nav.dashboard'),
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
        },
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
          path: "/hr/applicants",
          label: t('nav.applicants'),
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM6 21v-1a6 6 0 0112 0v1" />
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
        {
          path: "/profile",
          label: t('nav.profile'),
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118 8.999M15 19l2 2 4-4" />
            </svg>
          ),
        },
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
    }

    return [
      {
        path: "/user/dashboard",
        label: t('nav.dashboard'),
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      },
      {
        path: "/user/my-tasks",
        label: t('nav.myTasks'),
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ),
      },
      {
        path: "/profile",
        label: t('nav.profile'),
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118 8.999M15 19l2 2 4-4" />
          </svg>
        ),
      },
    ];
  }, [isPersonalVariant, t, user?.role]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Use auth endpoint for both admin and user
        const { data } = await axiosInstance.get(API_PATHS.ME);
        const avatarUrl = data.avatar || "";
        // If avatar is just a relative path, make it absolute using config or window.location
        const finalAvatar = avatarUrl && !avatarUrl.startsWith("http")
          ? `${API_PATHS.ME.split("/api")[0]}${avatarUrl.startsWith("/") ? "" : "/"}${avatarUrl}`
          : avatarUrl;

        setForm({
          fullName: data.fullName || "",
          email: data.email || "",
          avatar: finalAvatar,
          phone: data.phone || "",
          department: data.department || "",
          position: data.position || "",
          bio: data.bio || "",
        });
        setPreview(finalAvatar);
      } catch (error) {
        console.error("Error loading profile", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const maxSizeMb = 5;
    if (!allowed.includes(file.type)) {
      alert(t('profile.invalidFileType'));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      alert(t('profile.fileTooLarge'));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async ({ file, url }) => {
    const oldPreview = preview; // Save old preview in case of failure
    const formData = new FormData();
    formData.append("avatar", file);

    const attemptUpload = async (method) => {
      return axiosInstance.request({
        url: API_PATHS.USER_AVATAR,
        method,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });
    };

    try {
      setUploading(true);
      // Optimistic preview immediately from cropped image
      setPreview(url);
      // Also store locally so the UI updates even if upload fails
      setForm((prev) => ({ ...prev, avatar: url }));
      if (user) {
        login({ token: user.token, user: { ...user, avatar: url } });
      }

      let res;
      try {
        res = await attemptUpload("put");
      } catch (err) {
        // Fallback to POST if PUT not allowed
        res = await attemptUpload("post");
      }

      const data = res?.data || {};
      if (!data.url) throw new Error(t('profile.noUrlReturned'));

      // Replace optimistic preview with server URL
      setForm((prev) => ({ ...prev, avatar: data.url }));
      setPreview(data.url);
      if (user) {
        login({ token: user.token, user: { ...user, avatar: data.url } });
      }
    } catch (error) {
      console.error("Error uploading avatar", error);
      const serverMsg = error?.response?.data?.message;
      const sizeMsg = error?.response?.status === 413 ? t('profile.imageTooLarge') : "";
      const msg = serverMsg || sizeMsg || t('profile.uploadFailed');
      alert(msg);
      // Keep the local preview so user can still see their chosen image
      setPreview(url || oldPreview);
      setForm((prev) => ({ ...prev, avatar: url || prev.avatar }));
      if (user && url) {
        login({ token: user.token, user: { ...user, avatar: url } });
      }
    } finally {
      setUploading(false);
      setCropSrc("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      // Use auth endpoint for updating both admin and user
      const endpoint = user?.role === "admin" || user?.role === "hr"
        ? API_PATHS.ME
        : API_PATHS.USER_ME;

      const { data } = await axiosInstance.put(endpoint, form);
      if (user) {
        login({ token: user.token, user: { ...user, ...data } });
      }
      alert(t('profile.profileUpdated'));
    } catch (error) {
      console.error("Error updating profile", error);
      const message = error?.response?.data?.message || "Failed to update profile";
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{t('profile.title')}</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">{t('profile.description')}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 lg:p-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10">
            <div className="flex flex-col items-center gap-4">
              <div className="w-28 h-28 rounded-full bg-linear-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-3xl font-bold overflow-hidden shadow-lg cursor-pointer hover:opacity-90 transition-opacity" onClick={() => preview && setLightboxSrc(preview)}>
                {preview ? (
                  <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (user?.fullName || form.fullName || "U").charAt(0).toUpperCase()
                )}
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold">
                {uploading ? t('profile.uploading') : t('profile.chooseImage')}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('profile.fullName')}</label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                    placeholder={t('profile.fullNamePlaceholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('profile.email')}</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                    placeholder={t('profile.emailPlaceholder')}
                    required
                    readOnly
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{t('profile.emailCannotChange')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('profile.phone')}</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                    placeholder={t('profile.phonePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('profile.department')}</label>
                  <input
                    type="text"
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                    placeholder={t('profile.departmentPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('profile.position')}</label>
                  <input
                    type="text"
                    name="position"
                    value={form.position}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                    placeholder={t('profile.positionPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('profile.role')}</label>
                  <input
                    type="text"
                    value={user?.role || ""}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-400"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{t('profile.roleCannotChange')}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('profile.bio')}</label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 resize-none"
                  placeholder={t('profile.bioPlaceholder')}
                />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{t('profile.bioCounter', { count: form.bio.length })}</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? t('profile.saving') : t('profile.saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto mt-6">
        <CVSection />
      </div>
    </>
  );

  const overlays = (
    <>
      {cropSrc && (
        <AvatarCropper
          imageSrc={cropSrc}
          onCancel={() => setCropSrc("")}
          onConfirm={handleCropConfirm}
        />
      )}
      {lightboxSrc && (
        <ImageLightbox
          imageSrc={lightboxSrc}
          onClose={() => setLightboxSrc("")}
        />
      )}
    </>
  );

  if (loading) {
    if (isPersonalVariant) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isPersonalVariant) {
    return (
      <div className="w-full" dir={i18n.dir()}>
        {content}
        {overlays}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar links={navLinks} />
      <main className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64 min-h-screen w-full overflow-x-auto animate-fadeIn px-4 sm:px-6 lg:px-8 py-8 lg:py-10" dir={i18n.dir()}>
        {content}
      </main>
      {user && <ChatButton currentUser={user} />}
      {overlays}
    </div>
  );
};

export default Profile;
