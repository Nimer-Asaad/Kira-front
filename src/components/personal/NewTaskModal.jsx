import { useState } from "react";
import { useTranslation } from "react-i18next";

const NewTaskModal = ({ isOpen, onClose, onCreate }) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim() || !formData.description.trim()) {
      setError(t('personal.calendar.validation.titleRequired'));
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        ...formData,
        dueDate: formData.dueDate || null,
        checklist: formData.checklist,
      };
      await onCreate(taskData);
      // Reset form
      setFormData({
        title: "",
        description: "",
        status: "pending",
        priority: "medium",
        dueDate: "",
        checklist: [],
      });
      setNewChecklistItem("");
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        t('common.error');
      setError(errorMessage);
      console.error("Create task error:", err);
    } finally {
      setLoading(false);
    }
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setFormData({
        ...formData,
        checklist: [...formData.checklist, { text: newChecklistItem.trim(), done: false }],
      });
      setNewChecklistItem("");
    }
  };

  const removeChecklistItem = (index) => {
    setFormData({
      ...formData,
      checklist: formData.checklist.filter((_, i) => i !== index),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="card-premium w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-800 dark:to-indigo-900/30 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('pages.createTask.title')}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full p-2 transition-all duration-200 hover:scale-110"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('pages.createTask.taskTitle')} *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('pages.createTask.description')} *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('tasks.status')}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="pending">{t('tasks.pending')}</option>
                <option value="in-progress">{t('tasks.inProgress')}</option>
                <option value="completed">{t('tasks.completed')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('pages.createTask.priority')}</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="low">{t('tasks.low')}</option>
                <option value="medium">{t('tasks.medium')}</option>
                <option value="high">{t('tasks.high')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('pages.createTask.dueDate')}</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('pages.createTask.checklist')}</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addChecklistItem())}
                placeholder={t('pages.createTask.checklistItemPlaceholder')}
                className="flex-1 px-4 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={addChecklistItem}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 font-semibold"
              >
                {t('common.add') || "Add"}
              </button>
            </div>
            {formData.checklist.length > 0 && (
              <div className="space-y-2">
                {formData.checklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{item.text}</span>
                    <button
                      type="button"
                      onClick={() => removeChecklistItem(index)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all duration-200 border border-slate-200 dark:border-slate-700"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg hover:bg-indigo-700 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('pages.createTask.creatingTask') : t('pages.createTask.createTask')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTaskModal;
