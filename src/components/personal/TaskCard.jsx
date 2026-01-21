import { useTranslation } from "react-i18next";

const TaskCard = ({ task, onClick }) => {
  const { t } = useTranslation();
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t("dashboard.noDueDate");
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const checklistProgress = task.checklist || [];
  const completedCount = checklistProgress.filter((item) => item.done).length;
  const totalCount = checklistProgress.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className="card-premium p-6 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-fadeIn"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-800 mb-1 truncate">{task.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{task.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
          {task.status === "in-progress" ? "In Progress" : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
        </span>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
        </span>
      </div>

      {totalCount > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">Checklist Progress</span>
            <span className="text-xs font-semibold text-gray-800">
              {completedCount}/{totalCount}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Due: {formatDate(task.dueDate)}</span>
        <span>{new Date(task.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export default TaskCard;

