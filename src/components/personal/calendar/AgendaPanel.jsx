import moment from "moment";
import { useTranslation } from "react-i18next";

const AgendaPanel = ({ events }) => {
  const { t, i18n } = useTranslation();

  // Get events for next 7 days
  const today = moment().startOf("day");
  const next7Days = Array.from({ length: 7 }, (_, i) => today.clone().add(i, "days"));

  const getEventsForDay = (date) => {
    return events
      .filter((event) => {
        const eventStart = moment(event.start);
        const eventEnd = moment(event.end);
        return date.isSameOrAfter(eventStart, "day") && date.isSameOrBefore(eventEnd, "day");
      })
      .sort((a, b) => moment(a.start) - moment(b.start));
  };

  const getColorClass = (color) => {
    const colors = {
      blue: "bg-blue-500",
      purple: "bg-purple-500",
      green: "bg-green-500",
      orange: "bg-orange-500",
      red: "bg-red-500",
      gray: "bg-gray-500",
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="card-premium p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{t('personal.calendar.upcomingEvents')}</h2>
      <div className="space-y-4">
        {next7Days.map((day) => {
          const dayEvents = getEventsForDay(day);
          // Set locale for formatting
          day.locale(i18n.language === 'ar' ? 'ar' : 'en');

          return (
            <div key={day.format("YYYY-MM-DD")}>
              <div className={`text-sm font-semibold mb-2 ${day.isSame(moment(), "day") ? "text-blue-600" : "text-gray-700"
                }`}>
                {day.isSame(moment(), "day") ? t('personal.calendar.today') : day.format("dddd, MMM D")}
              </div>
              {dayEvents.length === 0 ? (
                <div className="text-xs text-gray-400 italic">{t('personal.calendar.noEvents')}</div>
              ) : (
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <div
                      key={event._id}
                      className={`p-2 bg-gray-50 rounded-lg ${i18n.language === 'ar' ? 'border-r-4' : 'border-l-4'}`}
                      style={{
                        [i18n.language === 'ar' ? 'borderRightColor' : 'borderLeftColor']:
                          event.color === "blue" ? "#3B82F6" :
                            event.color === "purple" ? "#A855F7" :
                              event.color === "green" ? "#10B981" :
                                event.color === "orange" ? "#F97316" :
                                  event.color === "red" ? "#EF4444" :
                                    "#6B7280",
                      }}
                    >
                      <div className="text-sm font-medium text-gray-900">{event.title}</div>
                      <div className="text-xs text-gray-500">
                        {event.allDay
                          ? t('personal.calendar.allDay')
                          : `${moment(event.start).format("h:mm A")} - ${moment(event.end).format("h:mm A")}`}
                      </div>
                      {event.location && (
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <span>📍</span> {event.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgendaPanel;

