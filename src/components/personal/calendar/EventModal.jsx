import { useState, useEffect } from "react";
import moment from "moment";
import { useTranslation } from "react-i18next";

const EventModal = ({ isOpen, onClose, onSave, onDelete, event }) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    start: "",
    end: "",
    allDay: false,
    color: "blue",
    reminderMinutes: null,
    reminderMethod: "in_app",
    repeat: "none",
    repeatUntil: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
        location: event.location || "",
        start: event.allDay
          ? moment(event.start).format("YYYY-MM-DD")
          : moment(event.start).format("YYYY-MM-DDTHH:mm"),
        end: event.allDay
          ? moment(event.end).format("YYYY-MM-DD")
          : moment(event.end).format("YYYY-MM-DDTHH:mm"),
        allDay: event.allDay || false,
        color: event.color || "blue",
        reminderMinutes: event.reminderMinutes || null,
        reminderMethod: event.reminderMethod || "in_app",
        repeat: event.repeat || "none",
        repeatUntil: event.repeatUntil ? moment(event.repeatUntil).format("YYYY-MM-DD") : "",
      });
    } else {
      // Default to today, 1 hour block
      const now = moment();
      setFormData({
        title: "",
        description: "",
        location: "",
        start: now.format("YYYY-MM-DDTHH:mm"),
        end: now.add(1, "hour").format("YYYY-MM-DDTHH:mm"),
        allDay: false,
        color: "blue",
        reminderMinutes: null,
        reminderMethod: "in_app",
        repeat: "none",
        repeatUntil: "",
      });
    }
    setError("");
  }, [event, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError(t('personal.calendar.validation.titleRequired'));
      return;
    }

    const startDate = moment(formData.start);
    const endDate = moment(formData.end);

    if (!startDate.isValid() || !endDate.isValid()) {
      setError(t('personal.calendar.validation.invalidDate'));
      return;
    }

    if (!formData.allDay && startDate >= endDate) {
      setError(t('personal.calendar.validation.endTimeError'));
      return;
    }

    if (formData.repeat !== "none" && formData.repeatUntil) {
      const repeatUntilDate = moment(formData.repeatUntil);
      if (repeatUntilDate < startDate) {
        setError(t('personal.calendar.validation.repeatError'));
        return;
      }
    }

    const eventData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      location: formData.location.trim(),
      start: formData.allDay
        ? startDate.startOf("day").toISOString()
        : startDate.toISOString(),
      end: formData.allDay
        ? endDate.endOf("day").toISOString()
        : endDate.toISOString(),
      allDay: formData.allDay,
      color: formData.color,
      reminderMinutes: formData.reminderMinutes || null,
      reminderMethod: formData.reminderMethod,
      repeat: formData.repeat,
      repeatUntil: formData.repeat !== "none" && formData.repeatUntil
        ? moment(formData.repeatUntil).endOf("day").toISOString()
        : null,
    };

    onSave(eventData);
  };

  const handleAllDayToggle = (checked) => {
    setFormData({
      ...formData,
      allDay: checked,
      start: checked
        ? moment(formData.start).format("YYYY-MM-DD")
        : moment(formData.start).format("YYYY-MM-DDTHH:mm"),
      end: checked
        ? moment(formData.end).format("YYYY-MM-DD")
        : moment(formData.end).format("YYYY-MM-DDTHH:mm"),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card-premium w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {event ? t('personal.calendar.editEvent') : t('personal.calendar.createEvent')}
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

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('personal.calendar.form.title')} *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${i18n.language === 'ar' ? 'text-right' : ''}`}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('personal.calendar.form.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${i18n.language === 'ar' ? 'text-right' : ''}`}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('personal.calendar.form.location')}
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent ${i18n.language === 'ar' ? 'text-right' : ''}`}
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.allDay}
              onChange={(e) => handleAllDayToggle(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="allDay" className="mx-2 text-sm font-medium text-gray-700">
              {t('personal.calendar.form.allDay')}
            </label>
          </div>

          {/* Date/Time Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.allDay ? t('personal.calendar.form.startDate') : t('personal.calendar.form.startDateTime')} *
              </label>
              <input
                type={formData.allDay ? "date" : "datetime-local"}
                value={formData.start}
                onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.allDay ? t('personal.calendar.form.endDate') : t('personal.calendar.form.endDateTime')} *
              </label>
              <input
                type={formData.allDay ? "date" : "datetime-local"}
                value={formData.end}
                onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('personal.calendar.form.color')}
            </label>
            <div className="flex gap-2">
              {["blue", "purple", "green", "orange", "red", "gray"].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${formData.color === color
                      ? "border-gray-800 scale-110"
                      : "border-gray-300 hover:border-gray-400"
                    }`}
                  style={{
                    backgroundColor:
                      color === "blue" ? "#3B82F6" :
                        color === "purple" ? "#A855F7" :
                          color === "green" ? "#10B981" :
                            color === "orange" ? "#F97316" :
                              color === "red" ? "#EF4444" :
                                "#6B7280",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Reminder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('personal.calendar.form.reminder')}
              </label>
              <select
                value={formData.reminderMinutes || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reminderMinutes: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                <option value="">{t('personal.calendar.form.none')}</option>
                <option value="5">{t('personal.calendar.form.minBefore', { count: 5 })}</option>
                <option value="10">{t('personal.calendar.form.minBefore', { count: 10 })}</option>
                <option value="30">{t('personal.calendar.form.minBefore', { count: 30 })}</option>
                <option value="60">{t('personal.calendar.form.hourBefore')}</option>
                <option value="1440">{t('personal.calendar.form.dayBefore')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('personal.calendar.form.reminderMethod')}
              </label>
              <select
                value={formData.reminderMethod}
                onChange={(e) => setFormData({ ...formData, reminderMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                <option value="in_app">{t('personal.calendar.form.inApp')}</option>
                <option value="browser">{t('personal.calendar.form.browser')}</option>
                <option value="none">{t('personal.calendar.form.none')}</option>
              </select>
            </div>
          </div>

          {/* Repeat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('personal.calendar.form.repeat')}
            </label>
            <select
              value={formData.repeat}
              onChange={(e) => setFormData({ ...formData, repeat: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent mb-2"
            >
              <option value="none">{t('personal.calendar.form.none')}</option>
              <option value="daily">{t('personal.calendar.form.daily')}</option>
              <option value="weekly">{t('personal.calendar.form.weekly')}</option>
              <option value="monthly">{t('personal.calendar.form.monthly')}</option>
            </select>
            {formData.repeat !== "none" && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('personal.calendar.form.repeatUntil')}
                </label>
                <input
                  type="date"
                  value={formData.repeatUntil}
                  onChange={(e) => setFormData({ ...formData, repeatUntil: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {event && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-150 font-medium"
              >
                {t('personal.calendar.delete')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-150 font-medium"
            >
              {t('personal.calendar.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-150 font-medium"
            >
              {event ? t('personal.calendar.updateEvent') : t('personal.calendar.createEvent')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;

