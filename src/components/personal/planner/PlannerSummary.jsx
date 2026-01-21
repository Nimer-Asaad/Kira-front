const PlannerSummary = ({ blocks, tasks }) => {
  const totalBlocks = blocks.length;
  const doneBlocks = blocks.filter((b) => b.status === "done").length;
  const skippedBlocks = blocks.filter((b) => b.status === "skipped").length;
  const plannedBlocks = blocks.filter((b) => b.status === "planned").length;

  // Calculate focus time (sum of durations for planned + done blocks)
  const calculateFocusTime = () => {
    let totalMinutes = 0;
    blocks
      .filter((b) => b.status === "planned" || b.status === "done")
      .forEach((block) => {
        const [startHour, startMin] = block.start.split(":").map(Number);
        const [endHour, endMin] = block.end.split(":").map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        totalMinutes += endMinutes - startMinutes;
      });
    return totalMinutes;
  };

  const focusTimeMinutes = calculateFocusTime();
  const focusHours = Math.floor(focusTimeMinutes / 60);
  const focusMins = focusTimeMinutes % 60;

  // Completion percentage
  const completionPercent = totalBlocks > 0 ? Math.round((doneBlocks / totalBlocks) * 100) : 0;

  // Get linked tasks
  const linkedTaskIds = blocks
    .filter((b) => b.taskId)
    .map((b) => b.taskId)
    .filter((id, index, self) => self.indexOf(id) === index); // Unique IDs

  const linkedTasks = tasks.filter((task) => linkedTaskIds.includes(task._id));

  return (
    <div className="card-premium p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Today's Summary</h2>

      {/* Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Blocks</span>
          <span className="text-lg font-semibold text-gray-900">{totalBlocks}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Completed</span>
          <span className="text-lg font-semibold text-green-600">{doneBlocks}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Skipped</span>
          <span className="text-lg font-semibold text-gray-600">{skippedBlocks}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Planned</span>
          <span className="text-lg font-semibold text-blue-600">{plannedBlocks}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Focus Time</span>
          <span className="text-lg font-semibold text-indigo-600">
            {focusHours}h {focusMins}m
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Completion</span>
          <span className="text-sm font-semibold text-gray-900">{completionPercent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Linked Tasks */}
      {linkedTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Tasks Today</h3>
          <div className="space-y-2">
            {linkedTasks.map((task) => (
              <div
                key={task._id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <p className="text-sm font-medium text-gray-900">{task.title}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {linkedTasks.length === 0 && totalBlocks > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">No tasks linked yet</p>
        </div>
      )}
    </div>
  );
};

export default PlannerSummary;

