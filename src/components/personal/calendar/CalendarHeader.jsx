import { useTranslation } from "react-i18next";
import moment from "moment";

const CalendarHeader = ({
  view,
  onViewChange,
  currentDate,
  onDateChange,
  onToday,
  onPrev,
  onNext,
  onNewEvent,
}) => {
  const { t, i18n } = useTranslation();

  const formatDate = () => {
    // Ensure moment locale is set to match i18n
    moment.locale(i18n.language === 'ar' ? 'ar' : 'en');

    if (view === "month") {
      return moment(currentDate).format("MMMM YYYY");
    } else if (view === "week") {
      const start = moment(currentDate).startOf("week");
      const end = moment(currentDate).endOf("week");
      if (start.month() === end.month()) {
        return `${start.format("MMM D")} - ${end.format("D, YYYY")}`;
      }
      return `${start.format("MMM D")} - ${end.format("MMM D, YYYY")}`;
    } else {
      return moment(currentDate).format("dddd, MMMM D, YYYY");
    }
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('personal.calendar.title')}</h1>
          <p className="text-gray-600 mt-1">{t('personal.calendar.subtitle')}</p>
        </div>
        <button
          onClick={onNewEvent}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-150 font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2"
        >
          <span className="text-lg">+</span> {t('personal.calendar.newEvent')}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* View Toggles */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-full sm:w-auto overflow-x-auto">
          {["month", "week", "day"].map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 whitespace-nowrap flex-1 sm:flex-none ${view === v
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
                }`}
            >
              {t(`personal.calendar.${v}`)}
            </button>
          ))}
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={onToday}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('personal.calendar.today')}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrev}
              className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${i18n.language === 'ar' ? 'rotate-180' : ''}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-medium text-gray-700 min-w-[200px] text-center dir-ltr">
              {formatDate()}
            </span>
            <button
              onClick={onNext}
              className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${i18n.language === 'ar' ? 'rotate-180' : ''}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;

