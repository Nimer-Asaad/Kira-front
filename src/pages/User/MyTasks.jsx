import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import ChatButton from "../../components/ChatButton";
import TaskCard from "../../components/TaskCard";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { formatDate, getPriorityColor, getStatusColor, calculateProgress } from "../../utils/helper";

const MyTasks = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updatingTask, setUpdatingTask] = useState(false);


  const tabs = [
    { id: "all", label: t("manageTasks.all") },
    { id: "pending", label: t("manageTasks.pending") },
    { id: "in-progress", label: t("manageTasks.inProgress") },
    { id: "completed", label: t("manageTasks.completed") },
  ];

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [activeTab, tasks]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.MY_TASKS);
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    const normalize = (status) => (status || "").toLowerCase();
    if (activeTab === "all") {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter((task) => normalize(task.status) === activeTab));
    }
  };

  const handleViewDetails = (task) => {
    setSelectedTask({
      ...task,
      checklist: (task.checklist || []).map((i) => ({ text: i.text, done: !!i.done })),
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTask(null);
  };

  const handleStatusChange = (e) => {
    setSelectedTask({
      ...selectedTask,
      status: e.target.value,
    });
  };

  const handleChecklistToggle = (index) => {
    const updatedChecklist = [...selectedTask.checklist];
    updatedChecklist[index] = {
      ...updatedChecklist[index],
      done: !updatedChecklist[index].done,
    };
    setSelectedTask({ ...selectedTask, checklist: updatedChecklist });
  };

  const handleSaveTask = async () => {
    try {
      setUpdatingTask(true);
      await Promise.all([
        axiosInstance.patch(API_PATHS.TASK_STATUS(selectedTask._id), {
          status: selectedTask.status,
        }),
        axiosInstance.patch(API_PATHS.TASK_CHECKLIST(selectedTask._id), {
          checklist: selectedTask.checklist,
        }),
      ]);

      // Update local state
      setTasks(
        tasks.map((task) =>
          task._id === selectedTask._id
            ? { ...task, status: selectedTask.status, checklist: selectedTask.checklist }
            : task
        )
      );

      handleCloseModal();
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task. Please try again.");
    } finally {
      setUpdatingTask(false);
    }
  };

  const formatStatus = (status) => {
    const map = {
      pending: t("manageTasks.pending"),
      "in-progress": t("manageTasks.inProgress"),
      completed: t("manageTasks.completed"),
    };
    return map[(status || "").toLowerCase()] || status || "Unknown";
  };

  return (
    <>
      <div className="max-w-7xl mx-auto w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600 mb-6 sm:mb-8 animate-slideUp text-start rtl:text-right">{t("nav.myTasks")}</h1>

        {/* Tabs */}
        <div className="card-premium mb-6 overflow-hidden animate-fadeIn" style={{ animationDelay: '100ms' }}>
          <div className="border-b border-slate-200 overflow-x-auto">
            <nav className="flex -mb-px min-w-fit bg-gradient-to-r from-slate-50 to-indigo-50/30">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative py-4 px-4 sm:px-6 text-sm font-semibold transition-all duration-300 whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                    }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 transition-all duration-300 rounded-t-full"></span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl shadow-sm">
                <div className="bg-gray-100 p-6 rounded-full mb-4">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium mb-1">No {activeTab === 'all' ? '' : activeTab.replace('-', ' ')} tasks found</p>
                <p className="text-gray-400 text-sm">Tasks will appear here once assigned</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onClick={() => handleViewDetails(task)}
                />
              ))
            )}
          </div>
        )}
      </div>
      {/* Modal */}
      {showModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-xl">
              <h2 className="text-2xl font-bold text-gray-800">Task Details</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {selectedTask.title}
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getPriorityColor(
                      (selectedTask.priority || '').toLowerCase()
                    )}`}
                  >
                    {(selectedTask.priority || '').toUpperCase()} PRIORITY
                  </span>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Due: {formatDate(selectedTask.dueDate)}
                  </div>
                </div>
              </div>
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                  {selectedTask.description}
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedTask.status}
                  onChange={handleStatusChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Checklist with Progress */}
              {selectedTask.checklist && selectedTask.checklist.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Checklist
                    </label>
                    <span className="text-sm text-gray-500">
                      {selectedTask.checklist.filter(i => i.done).length} of {selectedTask.checklist.length} completed
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${calculateProgress(selectedTask.checklist)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                    {selectedTask.checklist.map((item, index) => (
                      <label
                        key={index}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-white p-3 rounded-lg transition-all duration-150 group"
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => handleChecklistToggle(index)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <span
                          className={`flex-1 transition-all duration-150 ${item.done ? "line-through text-gray-400" : "text-gray-700 group-hover:text-gray-900"}`}
                        >
                          {item.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned By */}
              {selectedTask.assignedBy && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned By
                  </label>
                  <p className="text-gray-600">
                    {selectedTask.assignedBy.name} ({selectedTask.assignedBy.email})
                  </p>
                </div>
              )}

              {/* Attachments Section */}
              {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {selectedTask.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow duration-150">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{attachment.name || "Attachment"}</p>
                            <p className="text-xs text-gray-500 truncate">{attachment.url}</p>
                          </div>
                        </div>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-3 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-150 flex-shrink-0"
                        >
                          Open
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveTask}
                  disabled={updatingTask}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-all duration-150 font-medium disabled:bg-blue-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  {updatingTask ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : "Save Changes"}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-150 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {user && <ChatButton currentUser={user} />}
    </>
  );
};

export default MyTasks;
