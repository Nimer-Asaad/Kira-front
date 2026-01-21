// Compute a sensible default API base URL for both browser and Android emulator.
// - If VITE_API_URL is set, we always use that.
// - Otherwise we derive from window.location.hostname so:
//   - Browser at http://localhost:5173 → http://localhost:8000/api
//   - Android emulator at http://10.0.2.2:5173 → http://10.0.2.2:8000/api
let DEFAULT_API_BASE_URL = "http://localhost:8000/api";
if (typeof window !== "undefined") {
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const host = window.location.hostname || "localhost";
  const port = "8000";
  DEFAULT_API_BASE_URL = `${protocol}//${host}:${port}/api`;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL;
export { API_BASE_URL };

export const API_PATHS = {
  // Auth
  SIGNUP: `${API_BASE_URL}/auth/signup`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  ME: `${API_BASE_URL}/auth/me`,

  // Tasks
  CREATE_TASK: `${API_BASE_URL}/tasks`,
  ADMIN_TASKS: `${API_BASE_URL}/tasks/admin`,
  MY_TASKS: `${API_BASE_URL}/tasks/my`,
  TASK_BY_ID: (id) => `${API_BASE_URL}/tasks/${id}`,
  TASK_STATS: `${API_BASE_URL}/tasks/stats`,
  TASK_STATUS: (id) => `${API_BASE_URL}/tasks/${id}/status`,
  TASK_CHECKLIST: (id) => `${API_BASE_URL}/tasks/${id}/checklist`,
  DELETE_TASK: (id) => `${API_BASE_URL}/tasks/${id}`,
  TASK_IMPORT_PDF: `${API_BASE_URL}/tasks/import/pdf`,
  TASK_AUTO_DISTRIBUTE: `${API_BASE_URL}/tasks/auto-distribute`,

  // Users
  USERS: `${API_BASE_URL}/users`,
  CREATE_USER: `${API_BASE_URL}/users`,
  USER_ME: `${API_BASE_URL}/users/me`,
  USER_CV: `${API_BASE_URL}/users/me/cv`,
  USER_CV_STATUS: `${API_BASE_URL}/users/me/cv`,

  // Personal Gmail
  PERSONAL_GMAIL_STATUS: `${API_BASE_URL}/personal/gmail/status`,
  PERSONAL_GMAIL_CONNECT: `${API_BASE_URL}/personal/gmail/connect`,
  PERSONAL_GMAIL_DISCONNECT: `${API_BASE_URL}/personal/gmail/disconnect`,
  PERSONAL_GMAIL_CALLBACK: `${API_BASE_URL}/personal/gmail/callback`,
  PERSONAL_GMAIL_SYNC: `${API_BASE_URL}/personal/emails/sync`,
  PERSONAL_GMAIL_EMAILS: `${API_BASE_URL}/personal/emails`,
  PERSONAL_GMAIL_EMAIL_DETAILS: (id) => `${API_BASE_URL}/personal/emails/${id}`,
  PERSONAL_GMAIL_EMAIL_DELETE: (id) => `${API_BASE_URL}/personal/emails/${id}`,
  PERSONAL_GMAIL_EMAIL_MARK_READ: (id) => `${API_BASE_URL}/personal/emails/${id}/mark-read`,
  PERSONAL_GMAIL_SUMMARIZE: (id) => `${API_BASE_URL}/personal/emails/${id}/summarize`,

  // Personal Tasks
  PERSONAL_TASKS: `${API_BASE_URL}/personal/tasks`,
  PERSONAL_TASK_BY_ID: (id) => `${API_BASE_URL}/personal/tasks/${id}`,

  // Personal Planner
  PERSONAL_PLANNER: (date) => `${API_BASE_URL}/personal/planner?date=${date}`,
  PERSONAL_PLANNER_BLOCK: (blockId) => `${API_BASE_URL}/personal/planner/block/${blockId}`,

  // Personal Calendar
  PERSONAL_CALENDAR: (from, to) => `${API_BASE_URL}/personal/calendar?from=${from}&to=${to}`,
  PERSONAL_CALENDAR_CREATE: `${API_BASE_URL}/personal/calendar`,
  PERSONAL_CALENDAR_EVENT: (id) => `${API_BASE_URL}/personal/calendar/${id}`,
  USER_AVATAR: `${API_BASE_URL}/users/me/avatar`,
  USER_BY_ID: (id) => `${API_BASE_URL}/users/${id}`,
  USER_STATS: (id) => `${API_BASE_URL}/users/${id}/stats`,
  TEAM_STATS: `${API_BASE_URL}/users/team/stats`,
  UPDATE_USER_ROLE: (id) => `${API_BASE_URL}/users/${id}/role`,
  DELETE_USER: (id) => `${API_BASE_URL}/users/${id}`,

  // HR
  HR_APPLICANTS: `${API_BASE_URL}/hr/applicants`,
  HR_APPLICANT_BY_ID: (id) => `${API_BASE_URL}/hr/applicants/${id}`,
  HR_APPLICANT_CV: (id) => `${API_BASE_URL}/hr/applicants/${id}/cv`,
  HR_APPLICANT_AI_SUMMARY: (id) => `${API_BASE_URL}/hr/applicants/${id}/ai-summary`,

  // Trainees
  HR_TRAINEES: `${API_BASE_URL}/hr/trainees`,
  HR_TRAINEE_FROM_APPLICANT: (applicantId) => `${API_BASE_URL}/hr/trainees/from-applicant/${applicantId}`,
  HR_TRAINEE_GENERATE_TASKS: (traineeId) => `${API_BASE_URL}/hr/trainees/${traineeId}/generate-tasks`,
  HR_TRAINEE_GENERATE_TASKS_PDF: (traineeId) => `${API_BASE_URL}/hr/trainees/${traineeId}/generate-tasks-pdf`,
  HR_TRAINEE_TASKS: (traineeId) => `${API_BASE_URL}/hr/trainees/${traineeId}/tasks`,
  HR_TRAINEE_TASK_RESCORE: (traineeId, taskId) => `${API_BASE_URL}/hr/trainees/${traineeId}/tasks/${taskId}/rescore`,
  HR_TRAINING_TASK_RESCORE: (taskId) => `${API_BASE_URL}/hr/training-tasks/${taskId}/ai-rescore`,
  HR_TRAINING_TASK_UPDATE_POINTS: (taskId) => `${API_BASE_URL}/hr/training-tasks/${taskId}/points`,
  HR_AI_STATUS: `${API_BASE_URL}/hr/ai/status`,
  HR_TRAINEE_EVALUATE: (traineeId) => `${API_BASE_URL}/hr/trainees/${traineeId}/evaluate`,
  HR_TRAINEE_PROMOTE: (traineeId) => `${API_BASE_URL}/hr/trainees/${traineeId}/promote`,
  HR_TRAINEE_STATS: `${API_BASE_URL}/hr/trainees/stats`,
  HR_DASHBOARD_TRAINEES: `${API_BASE_URL}/hr/dashboard/trainees`,
  HR_TRAINEE_LINK_USER: (traineeId) => `${API_BASE_URL}/hr/trainees/${traineeId}/link-user`,
  HR_TRAINEE_REVERT_TO_HIRED: (traineeId) => `${API_BASE_URL}/hr/trainees/${traineeId}/revert-to-hired`,
  HR_TRAINEE_EVALUATION: (traineeId) => `${API_BASE_URL}/hr/trainees/${traineeId}/evaluation`,
  HR_TRAINEE_ARCHIVE: (traineeId) => `${API_BASE_URL}/hr/trainees/${traineeId}/archive`,
  // Trainee lifecycle actions
  HR_TRAINEE_PAUSE: (traineeId) => `${API_BASE_URL}/hr/trainees/${traineeId}/pause`,
  HR_TRAINEE_FREEZE: (traineeId) => `${API_BASE_URL}/hr/trainees/${traineeId}/freeze`,
  HR_TRAINEE_RESUME: (traineeId) => `${API_BASE_URL}/hr/trainees/${traineeId}/resume`,
  HR_TRAINEE_CANCEL: (traineeId) => `${API_BASE_URL}/hr/trainees/${traineeId}/cancel`,
  HR_TRAINEE_REVERT_CANCEL: (traineeId) => `${API_BASE_URL}/hr/trainees/${traineeId}/revert-cancel`,
  HR_TRAINEE_WITHDRAW_APPROVE: (traineeId) => `${API_BASE_URL}/hr/trainees/${traineeId}/withdraw/approve`,
  HR_TRAINEE_WITHDRAW_REJECT: (traineeId) => `${API_BASE_URL}/hr/trainees/${traineeId}/withdraw/reject`,
  HR_TRAINEES_PROGRESS: `${API_BASE_URL}/hr/trainees/progress`,
  ADMIN_TRAINEES_PROGRESS: `${API_BASE_URL}/hr/trainees/progress`,
  ADMIN_TRAINEE_TASKS: (traineeId) => `${API_BASE_URL}/hr/trainees/${traineeId}/progress-tasks`,

  // Trainee portal
  TRAINEE_MY_TASKS: `${API_BASE_URL}/trainee/me/tasks`,
  TRAINEE_DASHBOARD: `${API_BASE_URL}/trainee/me/dashboard`,
  TRAINEE_SUBMIT_TASK: (taskId) => `${API_BASE_URL}/trainee/tasks/${taskId}/submit`,
  TRAINEE_SUBMIT_TRAINING: `${API_BASE_URL}/trainee/me/submit-training`,
  TRAINEE_REOPEN_TRAINING: (traineeId) => `${API_BASE_URL}/trainee/${traineeId}/reopen-training`,
  TRAINEE_WITHDRAW_REQUEST: `${API_BASE_URL}/trainee/me/withdraw-request`,

  // Gmail Integration
  HR_GMAIL_STATUS: `${API_BASE_URL}/hr/gmail/status`,
  HR_GMAIL_SYNC: `${API_BASE_URL}/hr/gmail/sync`,
  HR_GMAIL_EMAILS: `${API_BASE_URL}/hr/gmail/emails`,
  HR_GMAIL_EMAIL_BY_ID: (id) => `${API_BASE_URL}/hr/gmail/emails/${id}`,
  HR_GMAIL_EMAIL_AI_SUMMARY: (id) => `${API_BASE_URL}/hr/gmail/emails/${id}/ai`,
  HR_GMAIL_EMAIL_ATTACH_CV: (id) => `${API_BASE_URL}/gmail/emails/${id}/attach-cv`,

  // New Comprehensive Gmail Endpoints
  GMAIL_LOCAL_SEARCH: `${API_BASE_URL}/gmail/local/search`,
  GMAIL_SYNC_PAGE: `${API_BASE_URL}/gmail/sync-page`,
  GMAIL_SYNC_STATE: `${API_BASE_URL}/gmail/sync/state`,
  GMAIL_SYNC_RESET: `${API_BASE_URL}/gmail/sync/reset`,
  GMAIL_PROFILE: `${API_BASE_URL}/gmail/profile`,
  GMAIL_FILTER_CVS: `${API_BASE_URL}/gmail/filter-cvs`,

  // Chat
  CHAT: `${API_BASE_URL}/chat`,
  CHAT_SEND: `${API_BASE_URL}/chat/send`,
  CHAT_CONVERSATIONS: `${API_BASE_URL}/chat/conversations`,
  CHAT_UNREAD_COUNT: `${API_BASE_URL}/chat/unread-count`,
  CHAT_AVAILABLE_USERS: `${API_BASE_URL}/chat/available-users`,

  // Assistant
  ASSISTANT_PUBLIC: `${API_BASE_URL}/assistant/public`,

  // Reports
  TASK_REPORT: `${API_BASE_URL}/reports/tasks`,
  TEAM_REPORT: `${API_BASE_URL}/reports/team`,
};

export default API_PATHS;
