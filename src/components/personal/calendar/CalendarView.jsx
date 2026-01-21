import moment from "moment";
import { useTranslation } from "react-i18next";

const CalendarView = ({ view, currentDate, events, onEventClick, onDateClick }) => {
  const { t, i18n } = useTranslation();

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

  if (view === "month") {
    return <MonthView currentDate={currentDate} events={events} onEventClick={onEventClick} onDateClick={onDateClick} getColorClass={getColorClass} t={t} i18n={i18n} />;
  } else if (view === "week") {
    return <WeekView currentDate={currentDate} events={events} onEventClick={onEventClick} onDateClick={onDateClick} getColorClass={getColorClass} t={t} i18n={i18n} />;
  } else {
    return <DayView currentDate={currentDate} events={events} onEventClick={onEventClick} onDateClick={onDateClick} getColorClass={getColorClass} t={t} i18n={i18n} />;
  }
};

const MonthView = ({ currentDate, events, onEventClick, onDateClick, getColorClass, t, i18n }) => {
  const start = moment(currentDate).startOf("month").startOf("week");
  const end = moment(currentDate).endOf("month").endOf("week");
  const days = [];
  const day = start.clone();

  while (day <= end) {
    days.push(day.clone());
    day.add(1, "day");
  }

  const weekDays = [
    t('personal.calendar.days.sun'),
    t('personal.calendar.days.mon'),
    t('personal.calendar.days.tue'),
    t('personal.calendar.days.wed'),
    t('personal.calendar.days.thu'),
    t('personal.calendar.days.fri'),
    t('personal.calendar.days.sat')
  ];

  const getEventsForDay = (date) => {
    return events.filter((event) => {
      const eventStart = moment(event.start);
      const eventEnd = moment(event.end);
      return date.isSameOrAfter(eventStart, "day") && date.isSameOrBefore(eventEnd, "day");
    });
  };

  return (
    <div className="card-premium overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((day) => (
          <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700 bg-gray-50">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((date, idx) => {
          const isCurrentMonth = date.month() === moment(currentDate).month();
          const isToday = date.isSame(moment(), "day");
          const dayEvents = getEventsForDay(date);

          return (
            <div
              key={idx}
              className={`min-h-[100px] p-2 border-b border-gray-200 ${i18n.language === 'ar' ? 'border-l' : 'border-r'} ${!isCurrentMonth ? "bg-gray-50" : "bg-white"
                } hover:bg-gray-50 cursor-pointer transition-colors`}
              onClick={() => onDateClick(date.toDate())}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : isCurrentMonth ? "text-gray-900" : "text-gray-400"}`}>
                {date.format("D")}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className={`text-xs p-1 rounded ${getColorClass(event.color)} text-white truncate cursor-pointer hover:opacity-80`}
                    title={event.title}
                  >
                    {moment(event.start).format("h:mm A")} {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500">+{dayEvents.length - 3} {t('personal.calendar.more')}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WeekView = ({ currentDate, events, onEventClick, onDateClick, getColorClass, i18n }) => {
  const start = moment(currentDate).startOf("week");
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(start.clone().add(i, "days"));
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDay = (date) => {
    return events.filter((event) => {
      const eventStart = moment(event.start);
      const eventEnd = moment(event.end);
      return date.isSameOrAfter(eventStart, "day") && date.isSameOrBefore(eventEnd, "day");
    });
  };

  return (
    <div className="card-premium overflow-hidden">
      <div className="grid grid-cols-8 border-b border-gray-200">
        <div className="p-3 bg-gray-50"></div>
        {days.map((day) => {
          // Localize day name
          day.locale(i18n.language === 'ar' ? 'ar' : 'en');
          return (
            <div
              key={day.format("YYYY-MM-DD")}
              className={`p-3 text-center border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 ${i18n.language === 'ar' ? 'border-r' : 'border-l'}`}
              onClick={() => onDateClick(day.toDate())}
            >
              <div className="text-xs text-gray-600">{day.format("ddd")}</div>
              <div className={`text-lg font-semibold ${day.isSame(moment(), "day") ? "text-blue-600" : "text-gray-900"}`}>
                {day.format("D")}
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-8 max-h-[600px] overflow-y-auto">
        <div className={`border-gray-200 ${i18n.language === 'ar' ? 'border-l' : 'border-r'}`}>
          {hours.map((hour) => (
            <div key={hour} className="h-16 border-b border-gray-100 p-2 text-xs text-gray-500">
              {hour.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          return (
            <div key={day.format("YYYY-MM-DD")} className={`border-b border-gray-200 ${i18n.language === 'ar' ? 'border-l' : 'border-r'}`}>
              {hours.map((hour) => (
                <div key={hour} className="h-16 border-b border-gray-100 relative">
                  {dayEvents
                    .filter((event) => {
                      const eventStart = moment(event.start);
                      return eventStart.hour() === hour || (eventStart.hour() < hour && moment(event.end).hour() > hour);
                    })
                    .map((event) => (
                      <div
                        key={event._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        className={`absolute left-0 right-0 mx-1 p-1 text-xs rounded ${getColorClass(event.color)} text-white cursor-pointer hover:opacity-80 z-10`}
                        style={{
                          top: moment(event.start).minute() * (16 / 60),
                          height: `${moment(event.end).diff(moment(event.start), "minutes") * (16 / 60)}px`,
                        }}
                        title={event.title}
                      >
                        {moment(event.start).format("h:mm A")} {event.title}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DayView = ({ currentDate, events, onEventClick, onDateClick, getColorClass, i18n }) => {
  const day = moment(currentDate);
  // Set locale
  day.locale(i18n.language === 'ar' ? 'ar' : 'en');

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const dayEvents = events.filter((event) => {
    const eventStart = moment(event.start);
    const eventEnd = moment(event.end);
    return day.isSameOrAfter(eventStart, "day") && day.isSameOrBefore(eventEnd, "day");
  });

  return (
    <div className="card-premium overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="text-lg font-semibold text-gray-900">{day.format("dddd, MMMM D, YYYY")}</div>
      </div>
      <div className="grid grid-cols-2 max-h-[600px] overflow-y-auto">
        <div className={`border-gray-200 ${i18n.language === 'ar' ? 'border-l' : 'border-r'}`}>
          {hours.map((hour) => (
            <div key={hour} className="h-16 border-b border-gray-100 p-2 text-sm text-gray-500">
              {hour.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>
        <div>
          {hours.map((hour) => (
            <div key={hour} className="h-16 border-b border-gray-100 relative">
              {dayEvents
                .filter((event) => {
                  const eventStart = moment(event.start);
                  return eventStart.hour() === hour || (eventStart.hour() < hour && moment(event.end).hour() > hour);
                })
                .map((event) => (
                  <div
                    key={event._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className={`absolute left-0 right-0 mx-1 p-2 rounded ${getColorClass(event.color)} text-white cursor-pointer hover:opacity-80 z-10`}
                    style={{
                      top: moment(event.start).minute() * (16 / 60),
                      height: `${Math.max(32, moment(event.end).diff(moment(event.start), "minutes") * (16 / 60))}px`,
                    }}
                    title={event.title}
                  >
                    <div className="text-xs font-semibold">{moment(event.start).format("h:mm A")}</div>
                    <div className="text-sm font-medium">{event.title}</div>
                    {event.location && <div className="text-xs opacity-90">{event.location}</div>}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;

