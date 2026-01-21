const PlannerBlockCard = ({ block, onEdit, onDelete, onUpdateStatus }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800";
      case "skipped":
        return "bg-gray-100 text-gray-800";
      case "planned":
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getColorTagDot = (colorTag) => {
    switch (colorTag) {
      case "blue":
        return "bg-blue-500";
      case "purple":
        return "bg-purple-500";
      case "green":
        return "bg-green-500";
      case "orange":
        return "bg-orange-500";
      default:
        return "bg-gray-300";
    }
  };

  const formatTime = (time) => {
    return time; // Already in HH:mm format
  };

  return (
    <div className="card-premium p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {block.colorTag !== "none" && (
              <div className={`w-3 h-3 rounded-full ${getColorTagDot(block.colorTag)}`} />
            )}
            <span className="text-sm font-semibold text-gray-600">
              {formatTime(block.start)} - {formatTime(block.end)}
            </span>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(block.status)}`}>
              {block.status.toUpperCase()}
            </span>
            {block.taskId && (
              <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                Linked Task
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{block.title}</h3>
          {block.note && (
            <p className="text-sm text-gray-600 mb-2">{block.note}</p>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {block.status !== "done" && (
            <button
              onClick={() => onUpdateStatus("done")}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Mark as done"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          {block.status !== "skipped" && (
            <button
              onClick={() => onUpdateStatus("skipped")}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Mark as skipped"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit block"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete block"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlannerBlockCard;

