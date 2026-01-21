import { useState, useEffect, useMemo } from "react";
import StatCard from "../../components/StatCard";
import DonutChart from "../../components/DonutChart";
import BarChartCard from "../../components/BarChartCard";
import TableRecentTasks from "../../components/TableRecentTasks";
import ChatButton from "../../components/ChatButton";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { useTranslation } from "react-i18next";

const PersonalDashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    todayTasks: 0,
  });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch personal tasks
      // FIXED: Use PERSONAL_TASKS endpoint to match "My Tasks" page
      const tasksResponse = await axiosInstance.get(API_PATHS.PERSONAL_TASKS);
      const fetchedTasks = tasksResponse.data || [];
      setTasks(fetchedTasks);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayTasks = fetchedTasks.filter((task) => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime();
      });

      setStats({
        totalTasks: fetchedTasks.length,
        completedTasks: fetchedTasks.filter((t) => t.status === "completed").length,
        pendingTasks: fetchedTasks.filter((t) => t.status === "pending" || t.status === "in-progress").length,
        todayTasks: todayTasks.length,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const distributionData = useMemo(
    () => [
      { name: "Pending", value: stats.pendingTasks || 0, color: "#f59e0b" },
      { name: "In Progress", value: tasks.filter((t) => t.status === "in-progress").length || 0, color: "#3b82f6" },
      { name: "Completed", value: stats.completedTasks || 0, color: "#10b981" },
    ],
    [stats, tasks]
  );

  const priorityData = useMemo(() => {
    const priorityCounts = {
      low: tasks.filter((t) => (t.priority || "").toLowerCase() === "low").length,
      medium: tasks.filter((t) => (t.priority || "").toLowerCase() === "medium").length,
      high: tasks.filter((t) => (t.priority || "").toLowerCase() === "high").length,
    };
    return [
      { name: "Low", value: priorityCounts.low || 0 },
      { name: "Medium", value: priorityCounts.medium || 0 },
      { name: "High", value: priorityCounts.high || 0 },
    ];
  }, [tasks]);

  const recentTasks = useMemo(() => {
    return tasks
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [tasks]);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slideUp">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-indigo-600 mb-2">
              {t('personal.dashboard.title')}
            </h1>
            <p className="text-sm text-slate-600 font-medium">{t('personal.dashboard.subtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            label={t('personal.dashboard.totalTasks')}
            value={stats.totalTasks}
            accent="blue"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <StatCard
            label={t('personal.dashboard.pending')}
            value={stats.pendingTasks}
            accent="yellow"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label={t('personal.dashboard.inProgress')}
            value={tasks.filter((t) => t.status === "in-progress").length}
            accent="blue"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <StatCard
            label={t('personal.dashboard.completed')}
            value={stats.completedTasks}
            accent="green"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Distribution Chart */}
          <DonutChart
            title={t('personal.dashboard.taskDistribution')}
            data={distributionData}
            height={300}
          />

          {/* Summary Stats */}
          <div className="card-premium p-6 animate-fadeIn" style={{ animationDelay: '150ms' }}>
            <h3 className="text-lg font-bold text-indigo-600 mb-4">{t('personal.dashboard.summary')}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-300">
                <span className="text-sm font-semibold text-blue-700">{t('personal.dashboard.totalTasks')}</span>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{stats.totalTasks}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-100 hover:shadow-md transition-all duration-300">
                <span className="text-sm font-semibold text-yellow-700">{t('personal.dashboard.pending')}</span>
                <span className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">{stats.pendingTasks}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md transition-all duration-300">
                <span className="text-sm font-semibold text-green-700">{t('personal.dashboard.completed')}</span>
                <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.completedTasks}</span>
              </div>
            </div>
          </div>
        </div>

        <TableRecentTasks tasks={recentTasks} />
      </div>
      {user && <ChatButton currentUser={user} />}
    </>
  );
};

export default PersonalDashboard;

