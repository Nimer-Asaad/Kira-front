import { useState, useEffect, useMemo } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import BarChartCard from "../../components/BarChartCard";
import DonutChart from "../../components/DonutChart";
import moment from "moment";
import { useTranslation } from "react-i18next";

const PersonalReports = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("week"); // week, month, year

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // FIXED: Use PERSONAL_TASKS endpoint to match "My Tasks" page
      const response = await axiosInstance.get(API_PATHS.PERSONAL_TASKS);
      setTasks(response.data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks based on period
  const filteredTasks = useMemo(() => {
    const now = moment();
    return tasks.filter((task) => {
      if (!task.createdAt) return false;
      const taskDate = moment(task.createdAt);

      if (period === "week") {
        return taskDate.isAfter(now.clone().subtract(7, "days"));
      } else if (period === "month") {
        return taskDate.isAfter(now.clone().subtract(30, "days"));
      } else if (period === "year") {
        return taskDate.isAfter(now.clone().subtract(365, "days"));
      }
      return true;
    });
  }, [tasks, period]);

  // Calculate statistics
  const stats = useMemo(() => {
    const completed = filteredTasks.filter((t) => t.status === "completed").length;
    const pending = filteredTasks.filter((t) => t.status === "pending").length;
    const inProgress = filteredTasks.filter((t) => t.status === "in-progress").length;
    const total = filteredTasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Priority breakdown
    const highPriority = filteredTasks.filter((t) => (t.priority || "").toLowerCase() === "high").length;
    const mediumPriority = filteredTasks.filter((t) => (t.priority || "").toLowerCase() === "medium").length;
    const lowPriority = filteredTasks.filter((t) => (t.priority || "").toLowerCase() === "low").length;

    // Overdue tasks
    const overdue = filteredTasks.filter((t) => {
      if (t.status === "completed" || !t.dueDate) return false;
      return moment(t.dueDate).isBefore(moment());
    }).length;

    // On-time completion
    const completedOnTime = filteredTasks.filter((t) => {
      if (t.status !== "completed" || !t.dueDate || !t.updatedAt) return false;
      return moment(t.updatedAt).isBefore(moment(t.dueDate));
    }).length;

    return {
      total,
      completed,
      pending,
      inProgress,
      completionRate,
      highPriority,
      mediumPriority,
      lowPriority,
      overdue,
      completedOnTime,
      onTimeRate: completed > 0 ? Math.round((completedOnTime / completed) * 100) : 0,
    };
  }, [filteredTasks]);

  // Chart data
  const statusData = useMemo(
    () => [
      { name: "Completed", value: stats.completed, color: "#10b981" },
      { name: "In Progress", value: stats.inProgress, color: "#3b82f6" },
      { name: "Pending", value: stats.pending, color: "#f59e0b" },
    ],
    [stats]
  );

  const priorityData = useMemo(
    () => [
      { name: "High", value: stats.highPriority },
      { name: "Medium", value: stats.mediumPriority },
      { name: "Low", value: stats.lowPriority },
    ],
    [stats]
  );

  // Weekly trend data
  const weeklyTrendData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = moment().subtract(i, "days");
      const dayTasks = tasks.filter((t) =>
        moment(t.createdAt).format("YYYY-MM-DD") === date.format("YYYY-MM-DD")
      );
      days.push({
        name: date.format("ddd"),
        value: dayTasks.length,
      });
    }
    return days;
  }, [tasks]);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slideUp">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-indigo-600 mb-2">
            {t('personal.reports.title')}
          </h1>
          <p className="text-sm text-slate-600 font-medium">{t('personal.reports.subtitle')}</p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-md border border-slate-200">
          {["week", "month", "year"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${period === p
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              {t(`personal.reports.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-premium p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-blue-700">{t('personal.reports.totalTasks')}</h3>
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
        </div>

        <div className="card-premium p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-green-700">Completed</h3>
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-green-900">{stats.completed}</p>
          <p className="text-xs text-green-600 mt-1">{stats.completionRate}% completion rate</p>
        </div>

        <div className="card-premium p-6 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-orange-700">Overdue</h3>
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-orange-900">{stats.overdue}</p>
        </div>

        <div className="card-premium p-6 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-purple-700">{t('personal.reports.onTimeRate')}</h3>
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-purple-900">{stats.onTimeRate}%</p>
          <p className="text-xs text-purple-600 mt-1">{stats.completedOnTime} {t('personal.reports.tasksCompleted')}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <DonutChart
          title={t('personal.reports.statusDistribution')}
          data={statusData}
          height={320}
        />

        {/* Priority Breakdown */}
        <BarChartCard
          title={t('personal.reports.priorityBreakdown')}
          data={priorityData}
          height={320}
        />
      </div>

      {/* Weekly Trend */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-bold text-indigo-600 mb-4">{t('personal.reports.weeklyActivity')}</h3>
        <BarChartCard
          title=""
          data={weeklyTrendData}
          height={250}
        />
      </div>

      {/* Performance Summary */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-bold text-indigo-600 mb-4">{t('personal.reports.performanceSummary')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-700">{t('personal.reports.highPriorityTasks')}</p>
              <p className="text-2xl font-bold text-blue-900">{stats.highPriority}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-100">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-yellow-700">{t('personal.dashboard.inProgress')}</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.inProgress}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-green-700">{t('personal.reports.completionRate')}</p>
              <p className="text-2xl font-bold text-green-900">{stats.completionRate}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalReports;


