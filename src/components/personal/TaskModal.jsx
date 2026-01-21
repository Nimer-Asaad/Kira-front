import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const TaskModal = ({ isOpen, onClose, task, onUpdate, onDelete }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    dueDate: "",
    checklist: [],
  });
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "pending",
        priority: task.priority || "medium",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
        checklist: task.checklist || [],
      });
      setIsEditing(false);
    }
  }, [task]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('dashboard.noDueDate');
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleSave = async () => {
    setError("");

    if (!formData.title.trim() || !formData.description.trim()) {
      setError(t('personal.calendar.validation.titleRequired'));
      return;
    }

    setLoading(true);
    try {
      await onUpdate(task._id, {
        ...formData,
        dueDate: formData.dueDate || null,
      });
      setIsEditing(false);
      toast.success(t('tasks.taskUpdated'));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    setLoading(true);
    try {
      await onUpdate(task._id, {
        ...formData,
        status: "completed",
      });
      setIsEditing(false);
      toast.success(t('tasks.taskUpdated'));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(task._id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete task");
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const toggleChecklistItem = async (index) => {
    const updatedChecklist = [...formData.checklist];
    updatedChecklist[index].done = !updatedChecklist[index].done;
    setFormData({ ...formData, checklist: updatedChecklist });

    // Auto-save checklist toggle
    try {
      await onUpdate(task._id, {
        ...formData,
        checklist: updatedChecklist,
      });
      toast.success("Checklist updated!");
    } catch (err) {
      // Revert on error
      setFormData({ ...formData, checklist: formData.checklist });
      toast.error("Failed to update checklist");
    }
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const updatedChecklist = [...formData.checklist, { text: newChecklistItem.trim(), done: false }];
      setFormData({ ...formData, checklist: updatedChecklist });
      setNewChecklistItem("");
    }
  };

  const removeChecklistItem = (index) => {
    setFormData({
      ...formData,
      checklist: formData.checklist.filter((_, i) => i !== index),
    });
  };

  const completedCount = formData.checklist.filter((item) => item.done).length;
  const totalCount = formData.checklist.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (!isOpen || !task) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="card-premium w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-800 dark:to-indigo-900/30 flex items-center justify-between rounded-t-2xl sticky top-0 z-10">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('buttons.viewTask') || "Task Details"}</h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full p-2 transition-all duration-200 hover:scale-110"
            >
              ✕
            </button>
          </div>

          <div className="px-6 py-6 space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-3">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Title Section */}
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xl font-semibold text-gray-800 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white"
                  placeholder={t('pages.createTask.taskTitle')}
                />
              ) : (
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {formData.title}
                </h3>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                {isEditing ? (
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full border-2 border-gray-300 focus:ring-2 focus:ring-blue-600 bg-white text-gray-800"
                  >
                    <option value="low">{t('tasks.low')} {t('tasks.priority').toUpperCase()}</option>
                    <option value="medium">{t('tasks.medium')} {t('tasks.priority').toUpperCase()}</option>
                    <option value="high">{t('tasks.high')} {t('tasks.priority').toUpperCase()}</option>
                  </select>
                ) : (
                  <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getPriorityColor(formData.priority)}`}>
                    {t(`tasks.${formData.priority}`).toUpperCase()} {t('tasks.priority').toUpperCase()}
                  </span>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                    />
                  ) : (
                    <span>{t('tasks.dueDate')}: {formData.dueDate ? formatDate(formData.dueDate) : t('dashboard.noDueDate')}</span>
                  )}
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="ml-2 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    >
                      {t('common.edit')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.description')} {isEditing && <span className="text-red-500">*</span>}
              </label>
              {isEditing ? (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                  placeholder={t('pages.createTask.descriptionPlaceholder')}
                />
              ) : (
                <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                  {formData.description}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tasks.status')}
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white text-gray-900 ${!isEditing ? "bg-gray-50 cursor-not-allowed" : ""
                  }`}
              >
                <option value="pending">{t("tasks.pending")}</option>
                <option value="in-progress">{t("tasks.inProgress")}</option>
                <option value="completed">{t("tasks.completed")}</option>
              </select>
            </div>

            {/* Checklist */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  {t('pages.createTask.checklist')}
                </label>
                {totalCount > 0 && (
                  <span className="text-sm text-gray-500">
                    {completedCount} {t("dashboard.of")} {totalCount} {t("dashboard.tasksCompleted")} ({progressPercent}%)
                  </span>
                )}
              </div>

              {totalCount > 0 && (
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Add new checklist item */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addChecklistItem())}
                  placeholder={t('pages.createTask.checklistItemPlaceholder')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                />
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 font-semibold"
                >
                  {t('common.add') || "Add"}
                </button>
              </div>

              {/* Checklist items */}
              {formData.checklist.length > 0 && (
                <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                  {formData.checklist.map((item, index) => (
                    <label
                      key={index}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-white p-3 rounded-lg transition-all duration-150 group"
                    >
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => toggleChecklistItem(index)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span
                        className={`flex-1 transition-all duration-150 ${item.done
                            ? "line-through text-gray-400"
                            : "text-gray-700 group-hover:text-gray-900"
                          }`}
                      >
                        {item.text}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeChecklistItem(index);
                        }}
                        className="text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-all duration-150 font-medium disabled:bg-blue-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('common.saving') || "Saving..."}
                      </span>
                    ) : (
                      t('common.save')
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      // Reset to original task data
                      if (task) {
                        setFormData({
                          title: task.title || "",
                          description: task.description || "",
                          status: task.status || "pending",
                          priority: task.priority || "medium",
                          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
                          checklist: task.checklist || [],
                        });
                      }
                    }}
                    disabled={loading}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-150 font-medium"
                  >
                    {t('common.cancel')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleMarkComplete}
                    disabled={loading || formData.status === "completed"}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-150 font-medium disabled:bg-green-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                    {t('buttons.markComplete')}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-150 font-medium disabled:bg-red-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                    {t('common.delete')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="card-premium w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('common.confirm')}</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                {t('manageTasks.confirmDelete')}
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? t('common.loading') : t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskModal;
