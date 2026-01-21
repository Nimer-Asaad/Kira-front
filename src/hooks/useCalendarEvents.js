import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import moment from "moment";

const useCalendarEvents = (view, currentDate) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    if (!currentDate) return;

    setLoading(true);
    setError(null);

    try {
      // Calculate date range based on view
      let from, to;
      const start = moment(currentDate).startOf("day");

      if (view === "month") {
        from = start.clone().startOf("month").startOf("week").toISOString();
        to = start.clone().endOf("month").endOf("week").toISOString();
      } else if (view === "week") {
        from = start.clone().startOf("week").toISOString();
        to = start.clone().endOf("week").toISOString();
      } else {
        // day view
        from = start.toISOString();
        to = start.clone().endOf("day").toISOString();
      }

      const response = await axiosInstance.get(API_PATHS.PERSONAL_CALENDAR(from, to));
      setEvents(response.data || []);
    } catch (err) {
      console.error("Error fetching calendar events:", err);
      setError(err.response?.data?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [view, currentDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const refreshEvents = useCallback(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refreshEvents };
};

export default useCalendarEvents;

