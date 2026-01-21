import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Sidebar from "../../components/Sidebar";
import ChatButton from "../../components/ChatButton";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import UserSelectModal from "../../components/UserSelectModal";
import { normalizeAttachments, validateAttachments, debugLogAttachments } from "../../utils/normalizeAttachments";
import { useAuth } from "../../context/AuthContext";

const CreateTask = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const adminLinks = [
    {
      path: "/admin/dashboard",
      label: t("nav.dashboard"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      path: "/admin/tasks",
      label: t("nav.manageTasks"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
    },
    {
      path: "/admin/create-task",
      label: t("nav.createTask"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
    },
    {
      path: "/admin/users",
      label: t("nav.teamMembers"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
  ];

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    assignedTo: [],
    requiredAssigneesCount: 1,
  });
  const [checklist, setChecklist] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [users, setUsers] = useState([]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newAttachment, setNewAttachment] = useState({ name: "", url: "" });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddChecklist = () => {
    if (newChecklistItem.trim()) {
      setChecklist((prev) => [...prev, { text: newChecklistItem, done: false }]);
      setNewChecklistItem("");
    }
  };

  const handleRemoveChecklist = (index) => {
    setChecklist((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddAttachment = () => {
    if (newAttachment.name.trim() && newAttachment.url.trim()) {
      setAttachments((prev) => [...prev, { ...newAttachment }]);
      setNewAttachment({ name: "", url: "" });
    }
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleMember = (userId) => {
    setFormData((prev) => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(userId)
        ? prev.assignedTo.filter((id) => id !== userId)
        : [...prev.assignedTo, userId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Normalize attachments to ensure correct format {name, url}
      const normalizedAttachments = validateAttachments(normalizeAttachments(attachments));
      debugLogAttachments(attachments, normalizedAttachments, "CreateTask");

      // Fix: assignedTo should be single ObjectId, not array
      const assignedToValue = Array.isArray(formData.assignedTo) && formData.assignedTo.length > 0
        ? formData.assignedTo[0]  // Take first user if array
        : (formData.assignedTo || null);  // Use as-is if already single value, or null

      const taskData = {
        ...formData,
        assignedTo: assignedToValue,
        checklist,
        attachments: normalizedAttachments,
      };

      // Debug: Log final payload before sending
      if (import.meta.env.DEV) {
        console.log("[CreateTask] Final payload:", taskData);
        console.log("[CreateTask] Target URL:", API_PATHS.CREATE_TASK);
      }

      await axiosInstance.post(API_PATHS.CREATE_TASK, taskData);

      // Show success message
      alert("✅ Task created successfully!");

      // Reset form
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        assignedTo: [],
        requiredAssigneesCount: 1,
      });
      setChecklist([]);
      setAttachments([]);

      // Navigate to manage tasks page
      navigate("/admin/tasks");
    } catch (error) {
      console.error("Error creating task:", error);
      // Show backend error message if available
      const errorMessage = error.response?.data?.message || "Failed to create task. Please try again.";
      alert(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <Sidebar links={adminLinks} />
      <main className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64 min-h-screen w-full overflow-x-auto animate-fadeIn">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slideUp">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-indigo-600 mb-2">
                {t("pages.createTask.title")}
              </h1>
              <p className="text-sm text-slate-600 font-medium">{t("pages.createTask.description")}</p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Card Container */}
            <div className="card-premium animate-fadeIn">
              <div className="px-6 py-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/30">
              </div>

              <form onSubmit={handleSubmit} className="px-4 py-5 sm:px-6 sm:py-6 space-y-6">
                {/* Title */}
                <div className="animate-fadeIn" style={{ animationDelay: '50ms' }}>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t("pages.createTask.taskTitle")}</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-indigo-300"
                    placeholder={t("pages.createTask.taskTitlePlaceholder")}
                  />
                </div>

                {/* Description */}
                <div className="animate-fadeIn" style={{ animationDelay: '100ms' }}>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t("common.description")}</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-indigo-300 resize-none"
                    placeholder={t("pages.createTask.descriptionPlaceholder")}
                  />
                </div>

                {/* Row: Priority | Due Date | Required Employees */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn" style={{ animationDelay: '150ms' }}>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t("pages.createTask.priority")}</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-indigo-300 font-medium"
                    >
                      <option value="low">{t("tasks.low")}</option>
                      <option value="medium">{t("tasks.medium")}</option>
                      <option value="high">{t("tasks.high")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t("pages.createTask.dueDate")}</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-indigo-300 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t("pages.createTask.assignTo")}</label>
                    <input
                      type="number"
                      name="requiredAssigneesCount"
                      value={formData.requiredAssigneesCount}
                      onChange={handleChange}
                      min="1"
                      required
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-indigo-300 font-medium"
                      placeholder="1"
                    />
                    <p className="text-xs text-slate-500 mt-1">{t("pages.createTask.selectMember")}</p>
                  </div>
                </div>

                {/* Assign To */}
                <div className="animate-fadeIn" style={{ animationDelay: '175ms' }}>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t("pages.createTask.selectMembers")}</label>
                  <button
                    type="button"
                    onClick={() => setShowMemberModal(true)}
                    className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {t("common.select")}
                  </button>
                </div>

                {/* Selected Members pills */}
                {formData.assignedTo.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.assignedTo.map((userId) => {
                      const user = users.find((u) => u._id === userId);
                      return user ? (
                        <span
                          key={userId}
                          className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold border-2 border-indigo-200 flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                        >
                          {user.fullName || user.name}
                          <button
                            type="button"
                            onClick={() => handleToggleMember(userId)}
                            className="text-indigo-600 hover:text-indigo-800 font-bold hover:scale-110 transition-transform duration-200"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Checklist */}
                <div className="space-y-4 animate-fadeIn" style={{ animationDelay: '200ms' }}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-indigo-600">{t("pages.createTask.checklist")}</h2>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      placeholder={t("pages.createTask.checklistItemPlaceholder")}
                      className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-indigo-300"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddChecklist())}
                    />
                    <button
                      type="button"
                      onClick={handleAddChecklist}
                      className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                    >
                      {t("common.save")}
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {checklist.map((item, index) => (
                      <li key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all duration-200 hover:shadow-md animate-fadeIn" style={{ animationDelay: `${250 + index * 50}ms` }}>
                        <span className="text-slate-700 text-sm font-medium">{item.text}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChecklist(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Attachments */}
                <div className="space-y-4 animate-fadeIn" style={{ animationDelay: '250ms' }}>
                  <h2 className="text-base font-bold text-indigo-600">{t("pages.createTask.addChecklistItem")}</h2>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={newAttachment.name}
                      onChange={(e) => setNewAttachment((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Attachment name"
                      className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-indigo-300"
                    />
                    <input
                      type="url"
                      value={newAttachment.url}
                      onChange={(e) => setNewAttachment((prev) => ({ ...prev, url: e.target.value }))}
                      placeholder="Attachment URL"
                      className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-indigo-300"
                    />
                    <button
                      type="button"
                      onClick={handleAddAttachment}
                      className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                    >
                      Add
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {attachments.map((attachment, index) => (
                      <li key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all duration-200 hover:shadow-md animate-fadeIn" style={{ animationDelay: `${300 + index * 50}ms` }}>
                        <div>
                          <p className="text-slate-900 font-semibold text-sm">{attachment.name}</p>
                          <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 text-xs hover:text-indigo-800 hover:underline font-medium">
                            {attachment.url}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(index)}
                          className="text-rose-600 hover:text-rose-800 hover:scale-110 transition-transform duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Submit */}
                <div className="pt-4 animate-fadeIn" style={{ animationDelay: '300ms' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full px-6 py-4 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-base"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t("pages.createTask.creatingTask")}
                      </span>
                    ) : (
                      t("pages.createTask.createTask")
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Member Selection Modal using component */}
            <UserSelectModal
              isOpen={showMemberModal}
              users={users}
              selectedIds={formData.assignedTo}
              onToggle={handleToggleMember}
              onClose={() => setShowMemberModal(false)}
              onConfirm={() => setShowMemberModal(false)}
              title="Select Team Members"
            />
          </div>
        </div>
      </main>
      {user && <ChatButton currentUser={user} />}
    </div>
  );
};

export default CreateTask;
