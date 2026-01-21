import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import TaskCard from "../../components/personal/TaskCard";
import TaskModal from "../../components/personal/TaskModal";
import NewTaskModal from "../../components/personal/NewTaskModal";
import toast from "react-hot-toast";

const PersonalTasks = () => {
  const { t, i18n } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      if (searchQuery) params.append("search", searchQuery);
      if (sortBy) params.append("sort", sortBy);

      const response = await axiosInstance.get(`${API_PATHS.PERSONAL_TASKS}?${params.toString()}`);
      setTasks(response.data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error(error.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await axiosInstance.post(API_PATHS.PERSONAL_TASKS, taskData);
      toast.success("Task created successfully!");
      await fetchTasks();
      return response.data;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  };

  const handleUpdateTask = async (taskId, taskData) => {
    try {
      const response = await axiosInstance.patch(API_PATHS.PERSONAL_TASK_BY_ID(taskId), taskData);
      toast.success("Task updated successfully!");
      // Update local state immediately
      setTasks(tasks.map(t => t._id === taskId ? { ...t, ...taskData } : t));
      // Refresh from server
      await fetchTasks();
      return response.data;
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axiosInstance.delete(API_PATHS.PERSONAL_TASK_BY_ID(taskId));
      toast.success("Task deleted successfully!");
      await fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  // Client-side filtering (if needed as fallback)
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) || task.description.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }

    // Sort
    if (sortBy === "dueDate") {
      filtered.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    } else if (sortBy === "priority") {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      filtered.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    } else {
      // newest first (default)
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return filtered;
  }, [tasks, searchQuery, statusFilter, priorityFilter, sortBy]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slideUp">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-indigo-600 mb-2">
            {t('personal.tasks.title')}
          </h1>
          <p className="text-sm text-slate-600 font-medium">{t('personal.tasks.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsNewTaskOpen(true)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:bg-indigo-700 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('personal.tasks.newTask')}
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn" style={{ animationDelay: "100ms" }}>
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              fetchTasks();
            }}
            placeholder={t('personal.tasks.searchPlaceholder')}
            className={`w-full px-4 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${i18n.language === 'ar' ? 'text-right' : ''}`}
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              fetchTasks();
            }}
            className="w-full px-4 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="all">{t('personal.tasks.allStatus')}</option>
            <option value="pending">{t('tasks.pending')}</option>
            <option value="in-progress">{t('tasks.inProgress')}</option>
            <option value="completed">{t('tasks.completed')}</option>
          </select>
        </div>
        <div>
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              fetchTasks();
            }}
            className="w-full px-4 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="all">{t('personal.tasks.allPriority')}</option>
            <option value="low">{t('tasks.low')}</option>
            <option value="medium">{t('tasks.medium')}</option>
            <option value="high">{t('tasks.high')}</option>
          </select>
        </div>
        <div>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              fetchTasks();
            }}
            className="w-full px-4 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="newest">{t('personal.tasks.newestFirst')}</option>
            <option value="dueDate">{t('personal.tasks.dueDate')}</option>
            <option value="priority">{t('personal.tasks.priority')}</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="card-premium p-12 text-center animate-fadeIn">
          <svg
            className="w-16 h-16 mx-auto text-slate-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('personal.tasks.noTasksFound')}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
              ? t('personal.tasks.tryAdjustingFilters')
              : t('personal.tasks.createFirstTask')}
          </p>
          {!searchQuery && statusFilter === "all" && priorityFilter === "all" && (
            <button
              onClick={() => setIsNewTaskOpen(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 hover:shadow-lg transition-all duration-200"
            >
              {t('personal.tasks.createTask')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard key={task._id} task={task} onClick={() => handleTaskClick(task)} />
          ))}
        </div>
      )}

      {/* Modals */}
      <NewTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        onCreate={handleCreateTask}
      />
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
};

export default PersonalTasks;
