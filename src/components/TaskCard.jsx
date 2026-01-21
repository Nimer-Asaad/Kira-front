import { formatDate, getStatusColor, getPriorityColor, calculateProgress } from "../utils/helper";
import { useTranslation } from "react-i18next";

const TaskCard = ({ task, onClick }) => {
  const { t } = useTranslation();
  const progress = calculateProgress(task?.checklist || []);
  const statusClass = getStatusColor((task?.status || "").toLowerCase());
  const priorityClass = getPriorityColor((task?.priority || "").toLowerCase());

  const formatStatus = (status) => {
    const statusStr = (status || "").toLowerCase();
    if (statusStr === "pending") return t("manageTasks.pending");
    if (statusStr === "in-progress") return t("manageTasks.inProgress");
    if (statusStr === "completed") return t("manageTasks.completed");
    return status || "Unknown";
  };

  return (
    <div
      onClick={onClick}
      className="card-premium p-6 cursor-pointer group animate-fadeIn"
    >
      {/* Header with Title and Priority */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="flex-text-container text-title text-slate-900 group-hover:text-indigo-600 transition-all duration-300 text-truncate-2">
          {task?.title}
        </h3>
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${priorityClass} whitespace-nowrap flex-shrink-0 transition-all duration-200 group-hover:scale-105`}>
          {(task?.priority || "").toUpperCase()}
        </span>
      </div>

      {/* Description */}
      {task?.description ? (
        <p className="text-sm text-slate-600 line-clamp-2 mb-4 font-medium">{task.description}</p>
      ) : null}

      {/* Status and Due Date */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all duration-200 group-hover:scale-105 ${statusClass}`}>
          {formatStatus(task?.status)}
        </span>
        {task?.dueDate ? (
          <div className="flex items-center text-xs text-slate-600 font-medium bg-slate-100 px-3 py-1.5 rounded-lg">
            <svg className="w-4 h-4 mr-1.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(task.dueDate)}
          </div>
        ) : null}
        {task?.requiredAssigneesCount && task.requiredAssigneesCount > 1 ? (
          <div className="flex items-center text-xs text-slate-600 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
            <svg className="w-4 h-4 mr-1.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {t("dashboard.needs")}: {task.requiredAssigneesCount} {t("dashboard.employees")}
          </div>
        ) : null}
      </div>

      {/* Progress Bar */}
      {task?.checklist && task.checklist.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-700 mb-2 font-semibold">
            <span>{t("dashboard.progress")}</span>
            <span className="text-indigo-600 font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner">
            <div
              className="h-2.5 bg-indigo-500 rounded-full transition-all duration-700 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {task.checklist.filter(i => i.done).length} {t("dashboard.of")} {task.checklist.length} {t("dashboard.tasksCompleted")}
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
