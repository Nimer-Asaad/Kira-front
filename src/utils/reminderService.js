import moment from "moment";
import toast from "react-hot-toast";

const REMINDER_CHECK_INTERVAL = 30000; // 30 seconds
const REMINDER_LOOKAHEAD_MINUTES = 60; // Check events in next 60 minutes

class ReminderService {
  constructor() {
    this.checkInterval = null;
    this.shownReminders = new Set(); // Track shown reminders to prevent duplicates
    this.events = [];
    this.onEventsUpdate = null;
  }

  start(events, onEventsUpdate) {
    this.events = events;
    this.onEventsUpdate = onEventsUpdate;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkReminders();
    }, REMINDER_CHECK_INTERVAL);

    // Check immediately
    this.checkReminders();
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  checkReminders() {
    const now = moment();
    const lookahead = moment().add(REMINDER_LOOKAHEAD_MINUTES, "minutes");

    for (const event of this.events) {
      // Skip if no reminder set
      if (!event.reminderMinutes || event.reminderMethod === "none") {
        continue;
      }

      const eventStart = moment(event.start);
      const reminderTime = eventStart.clone().subtract(event.reminderMinutes, "minutes");

      // Check if reminder time is between now and lookahead
      if (reminderTime.isBetween(now, lookahead, null, "[)") || reminderTime.isSame(now, "minute")) {
        const reminderKey = `${event._id || event.originalId}_${eventStart.format("YYYY-MM-DD-HH-mm")}`;

        // Skip if already shown
        if (this.shownReminders.has(reminderKey)) {
          continue;
        }

        // Mark as shown
        this.shownReminders.add(reminderKey);

        // Show notification
        this.showReminder(event, eventStart);
      }
    }

    // Clean up old reminders (older than 1 hour)
    const oneHourAgo = moment().subtract(1, "hour");
    for (const key of this.shownReminders) {
      // Extract date from key if possible
      const parts = key.split("_");
      if (parts.length > 1) {
        const dateStr = parts[parts.length - 1];
        const reminderDate = moment(dateStr, "YYYY-MM-DD-HH-mm");
        if (reminderDate.isBefore(oneHourAgo)) {
          this.shownReminders.delete(key);
        }
      }
    }
  }

  showReminder(event, eventStart) {
    const timeStr = eventStart.format("h:mm A");
    const message = `Reminder: ${event.title} starts at ${timeStr}`;

    if (event.reminderMethod === "browser" && "Notification" in window) {
      // Request permission if not granted
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(event.title, {
              body: `Starts at ${timeStr}${event.location ? ` - ${event.location}` : ""}`,
              icon: "/favicon.ico",
            });
          } else {
            // Fallback to toast
            toast(message, {
              icon: "⏰",
              duration: 5000,
            });
          }
        });
      } else if (Notification.permission === "granted") {
        new Notification(event.title, {
          body: `Starts at ${timeStr}${event.location ? ` - ${event.location}` : ""}`,
          icon: "/favicon.ico",
        });
      } else {
        // Fallback to toast
        toast(message, {
          icon: "⏰",
          duration: 5000,
        });
      }
    } else {
      // In-app toast
      toast(message, {
        icon: "⏰",
        duration: 5000,
      });
    }
  }

  updateEvents(events) {
    this.events = events;
  }
}

// Singleton instance
const reminderService = new ReminderService();

export default reminderService;

