import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import ChatButton from "../../components/ChatButton";
import StatCard from "../../components/StatCard";
import DonutChart from "../../components/DonutChart";
import BarChartCard from "../../components/BarChartCard";
import TableRecentTasks from "../../components/TableRecentTasks";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { formatDate, getPriorityColor, getStatusColor } from "../../utils/helper";

const UserDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });
  const [priorityStats, setPriorityStats] = useState({
    low: 0,
    medium: 0,
    high: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.MY_TASKS);
      const tasks = response.data;

      const normalize = (status) => (status || "").toLowerCase();

      const taskStats = {
        total: tasks.length,
        pending: tasks.filter((t) => normalize(t.status) === "pending").length,
        inProgress: tasks.filter((t) => normalize(t.status) === "in-progress").length,
        completed: tasks.filter((t) => normalize(t.status) === "completed").length,
      };

      const priorityCount = {
        low: tasks.filter((t) => (t.priority || "").toLowerCase() === "low").length,
        medium: tasks.filter((t) => (t.priority || "").toLowerCase() === "medium").length,
        high: tasks.filter((t) => (t.priority || "").toLowerCase() === "high").length,
      };

      setStats(taskStats);
      setPriorityStats(priorityCount);

      const sortedTasks = [...tasks].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setRecentTasks(sortedTasks.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const distributionData = useMemo(
    () => [
      { name: t("dashboard.pending"), value: stats.pending || 0, color: "#f59e0b" },
      { name: t("dashboard.inProgress"), value: stats.inProgress || 0, color: "#2563eb" },
      { name: t("dashboard.completed"), value: stats.completed || 0, color: "#10b981" },
    ],
    [stats, t]
  );

  const priorityData = useMemo(
    () => [
      { name: t("dashboard.lowPriority"), value: priorityStats.low || 0 },
      { name: t("dashboard.mediumPriority"), value: priorityStats.medium || 0 },
      { name: t("dashboard.highPriority"), value: priorityStats.high || 0 },
    ],
    [priorityStats, t]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slideUp">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600 text-start rtl:text-right">{t("dashboard.myDashboard")}</h1>
          <p className="text-sm text-slate-600 font-medium mt-1 text-start rtl:text-right">{t("dashboard.overviewTasks")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label={t("dashboard.totalTasks")}
          value={stats.total || 0}
          accent="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          label={t("dashboard.pending")}
          value={stats.pending || 0}
          accent="yellow"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label={t("dashboard.inProgress")}
          value={stats.inProgress || 0}
          accent="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <StatCard
          label={t("dashboard.completed")}
          value={stats.completed || 0}
          accent="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DonutChart title={t("dashboard.taskDistribution")} data={distributionData} />
        <BarChartCard title={t("dashboard.priorityLevels")} data={priorityData} />
      </div>

      <TableRecentTasks tasks={recentTasks} />
      {user && <ChatButton currentUser={user} />}
    </>
  );
};

export default UserDashboard;
