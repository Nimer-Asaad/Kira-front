import { useTranslation } from "react-i18next";
import { formatDate, getPriorityColor, getStatusColor } from "../utils/helper";

const TableRecentTasks = ({ tasks = [] }) => {
  const { t } = useTranslation();

  const formatStatus = (status) => {
    const statusStr = (status || "").toLowerCase();
    if (statusStr === "pending") return t("manageTasks.pending");
    if (statusStr === "in-progress") return t("manageTasks.inProgress");
    if (statusStr === "completed") return t("manageTasks.completed");
    return status || "Unknown";
  };

  return (
    <div className="card-premium overflow-hidden animate-fadeIn" style={{ animationDelay: '200ms' }}>
      <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/30">
        <h3 className="text-lg font-bold text-indigo-600">{t("dashboard.recentTasks")}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t("dashboard.title_col")}</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t("dashboard.status_col")}</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t("dashboard.priority_col")}</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t("dashboard.due_col")}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500 text-sm font-medium">
                  {t("dashboard.noTasks")}
                </td>
              </tr>
            ) : (
              tasks.map((task, index) => (
                <tr 
                  key={task._id} 
                  className="hover:bg-indigo-50/50 transition-all duration-200 animate-fadeIn"
                  style={{ animationDelay: `${250 + index * 50}ms` }}
                >
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                    <div className="max-w-xs truncate" title={task.title}>
                      {task.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 inline-flex text-xs font-bold rounded-full shadow-sm transition-all duration-200 hover:scale-105 ${getStatusColor(
                      (task.status || "").toLowerCase()
                    )}`}>
                      {formatStatus(task.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 inline-flex text-xs font-bold rounded-full shadow-sm transition-all duration-200 hover:scale-105 ${getPriorityColor(
                      (task.priority || "").toLowerCase()
                    )}`}>
                      {(task.priority || "").toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{formatDate(task.dueDate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableRecentTasks;
