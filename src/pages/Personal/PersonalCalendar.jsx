import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import useCalendarEvents from "../../hooks/useCalendarEvents";
import reminderService from "../../utils/reminderService";
import CalendarHeader from "../../components/personal/calendar/CalendarHeader";
import CalendarView from "../../components/personal/calendar/CalendarView";
import EventModal from "../../components/personal/calendar/EventModal";
import AgendaPanel from "../../components/personal/calendar/AgendaPanel";
import toast from "react-hot-toast";

const PersonalCalendar = () => {
  const { t } = useTranslation();
  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);

  const { events, loading: eventsLoading, refreshEvents } = useCalendarEvents(view, currentDate);

  // Start reminder service
  useEffect(() => {
    reminderService.start(events, refreshEvents);

    return () => {
      reminderService.stop();
    };
  }, [events, refreshEvents]);

  // Update reminder service when events change
  useEffect(() => {
    reminderService.updateEvents(events);
  }, [events]);

  const handleViewChange = (newView) => {
    setView(newView);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handlePrev = () => {
    const newDate = moment(currentDate);
    if (view === "month") {
      newDate.subtract(1, "month");
    } else if (view === "week") {
      newDate.subtract(1, "week");
    } else {
      newDate.subtract(1, "day");
    }
    setCurrentDate(newDate.toDate());
  };

  const handleNext = () => {
    const newDate = moment(currentDate);
    if (view === "month") {
      newDate.add(1, "month");
    } else if (view === "week") {
      newDate.add(1, "week");
    } else {
      newDate.add(1, "day");
    }
    setCurrentDate(newDate.toDate());
  };

  const handleNewEvent = () => {
    setSelectedEvent(null);
    setSelectedDate(null);
    setIsEventModalOpen(true);
  };

  const handleEventClick = (event) => {
    // For recurring events, we need to handle the original event
    if (event.originalId) {
      // Fetch the original event
      axiosInstance
        .get(API_PATHS.PERSONAL_CALENDAR_EVENT(event.originalId))
        .then((response) => {
          setSelectedEvent(response.data);
          setIsEventModalOpen(true);
        })
        .catch((error) => {
          console.error("Error fetching event:", error);
          toast.error(t('personal.calendar.failedLoadEvent'));
        });
    } else {
      setSelectedEvent(event);
      setIsEventModalOpen(true);
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (eventData) => {
    setLoading(true);
    try {
      if (selectedEvent) {
        // Update existing event
        await axiosInstance.patch(API_PATHS.PERSONAL_CALENDAR_EVENT(selectedEvent._id), eventData);
        toast.success(t('personal.calendar.eventUpdated'));
      } else {
        // Create new event
        await axiosInstance.post(API_PATHS.PERSONAL_CALENDAR_CREATE, eventData);
        toast.success(t('personal.calendar.eventCreated'));
      }
      setIsEventModalOpen(false);
      setSelectedEvent(null);
      setSelectedDate(null);
      refreshEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error(error.response?.data?.message || t('personal.calendar.failedSaveEvent'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent || !window.confirm(t('personal.calendar.confirmDeleteEvent'))) {
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.delete(API_PATHS.PERSONAL_CALENDAR_EVENT(selectedEvent._id));
      toast.success(t('personal.calendar.eventDeleted'));
      setIsEventModalOpen(false);
      setSelectedEvent(null);
      refreshEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error(error.response?.data?.message || t('personal.calendar.failedDeleteEvent'));
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill modal with selected date
  const getInitialEvent = () => {
    if (selectedEvent) {
      return selectedEvent;
    }
    if (selectedDate) {
      const date = moment(selectedDate);
      return {
        start: date.format("YYYY-MM-DDTHH:mm"),
        end: date.add(1, "hour").format("YYYY-MM-DDTHH:mm"),
      };
    }
    return null;
  };

  return (
    <>
      <CalendarHeader
        view={view}
        onViewChange={handleViewChange}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onToday={handleToday}
        onPrev={handlePrev}
        onNext={handleNext}
        onNewEvent={handleNewEvent}
      />

      {eventsLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <CalendarView
              view={view}
              currentDate={currentDate}
              events={events}
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
            />
          </div>
          <div className="lg:col-span-1">
            <AgendaPanel events={events} />
          </div>
        </div>
      )}

      {isEventModalOpen && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => {
            setIsEventModalOpen(false);
            setSelectedEvent(null);
            setSelectedDate(null);
          }}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          event={getInitialEvent()}
        />
      )}
    </>
  );
};

export default PersonalCalendar;
