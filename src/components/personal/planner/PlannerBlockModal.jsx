import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

// Simple UUID generator
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const PlannerBlockModal = ({ isOpen, onClose, onSave, block, tasks, existingBlocks }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    start: "09:00",
    end: "10:00",
    title: "",
    note: "",
    taskId: "",
    status: "planned",
    colorTag: "none",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (block) {
      setFormData({
        start: block.start,
        end: block.end,
        title: block.title,
        note: block.note || "",
        taskId: block.taskId || "",
        status: block.status,
        colorTag: block.colorTag || "none",
      });
    } else {
      setFormData({
        start: "09:00",
        end: "10:00",
        title: "",
        note: "",
        taskId: "",
        status: "planned",
        colorTag: "none",
      });
    }
    setError("");
  }, [block, isOpen]);

  const validateTime = (start, end) => {
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      return t('personal.calendar.validation.endTimeError');
    }
    return null;
  };

  const checkOverlap = (start, end, excludeId = null) => {
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    for (const existingBlock of existingBlocks) {
      if (excludeId && existingBlock.id === excludeId) continue;

      const [existingStartHour, existingStartMin] = existingBlock.start.split(":").map(Number);
      const [existingEndHour, existingEndMin] = existingBlock.end.split(":").map(Number);
      const existingStartMinutes = existingStartHour * 60 + existingStartMin;
      const existingEndMinutes = existingEndHour * 60 + existingEndMin;

      if (startMinutes < existingEndMinutes && endMinutes > existingStartMinutes) {
        return `Overlaps with "${existingBlock.title}" (${existingBlock.start} - ${existingBlock.end})`;
      }
    }
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError(t('personal.calendar.validation.titleRequired'));
      return;
    }

    const timeError = validateTime(formData.start, formData.end);
    if (timeError) {
      setError(timeError);
      return;
    }

    const overlapError = checkOverlap(formData.start, formData.end, block?.id);
    if (overlapError) {
      setError(overlapError);
      return;
    }

    const blockData = {
      id: block?.id || generateId(),
      start: formData.start,
      end: formData.end,
      title: formData.title.trim(),
      note: formData.note.trim(),
      taskId: formData.taskId || null,
      status: formData.status,
      colorTag: formData.colorTag,
    };

    onSave(blockData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card-premium w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {block ? (t('personal.planner.updateBlock') || "Update Block") : t('personal.planner.addBlock')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-all duration-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Time Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('personal.planner.form.startTime')} *
              </label>
              <input
                type="time"
                value={formData.start}
                onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('personal.planner.form.endTime')} *
              </label>
              <input
                type="time"
                value={formData.end}
                onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('personal.planner.form.title')} *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder={t('personal.planner.placeholders.title')}
              required
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('personal.planner.form.note')}
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder={t('personal.planner.placeholders.note')}
            />
          </div>

          {/* Link to Task */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('personal.planner.form.linkToTask')}
            </label>
            <select
              value={formData.taskId}
              onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="">{t('personal.planner.colors.none')}</option>
              {tasks.map((task) => (
                <option key={task._id} value={task._id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('personal.planner.form.status')}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="planned">{t('personal.planner.status.planned')}</option>
              <option value="done">{t('personal.planner.status.done')}</option>
              <option value="skipped">{t('personal.planner.status.skipped')}</option>
            </select>
          </div>

          {/* Color Tag */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('personal.planner.form.colorTag')}
            </label>
            <div className="flex gap-2">
              {["none", "blue", "purple", "green", "orange"].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, colorTag: color })}
                  className={`px-3 py-2 rounded-lg border-2 transition-all ${formData.colorTag === color
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                    }`}
                >
                  {color === "none" ? (
                    <span className="text-sm">{t(`personal.planner.colors.${color}`)}</span>
                  ) : (
                    <div className={`w-6 h-6 rounded-full ${color === "blue" ? "bg-blue-500" :
                        color === "purple" ? "bg-purple-500" :
                          color === "green" ? "bg-green-500" :
                            "bg-orange-500"
                      }`} title={t(`personal.planner.colors.${color}`)} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-150 font-medium"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-150 font-medium"
            >
              {block ? (t('personal.planner.updateBlock') || "Update Block") : t('personal.planner.addBlock')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlannerBlockModal;
