import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "../../components/Sidebar";
import StatCard from "../../components/StatCard";
import DonutChart from "../../components/DonutChart";
import BarChartCard from "../../components/BarChartCard";
import TableRecentTasks from "../../components/TableRecentTasks";
import ChatButton from "../../components/ChatButton";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const Dashboard = () => {
  const { t } = useTranslation();

  const adminLinks = [
    {
      path: "/admin/dashboard",
      label: t("nav.dashboard"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      path: "/admin/tasks",
      label: t("nav.manageTasks"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      path: "/admin/create-task",
      label: t("nav.createTask"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      path: "/admin/users",
      label: t("nav.teamMembers"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
  ];

  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axiosInstance.get(API_PATHS.TASK_STATS);
        setStats(data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const counts = stats?.counts || {};
  const priority = stats?.priority || {};
  const recentTasks = stats?.recentTasks || [];

  const distributionData = useMemo(
    () => [
      { name: t("dashboard.pending"), value: counts.pending || 0, color: "#f59e0b" },
      { name: t("dashboard.inProgress"), value: counts.inProgress || 0, color: "#3b82f6" },
      { name: t("dashboard.completed"), value: counts.completed || 0, color: "#10b981" },
    ],
    [counts, t]
  );

  const priorityData = useMemo(
    () => [
      { name: t("dashboard.lowPriority"), value: priority.low || 0 },
      { name: t("dashboard.mediumPriority"), value: priority.medium || 0 },
      { name: t("dashboard.highPriority"), value: priority.high || 0 },
    ],
    [priority, t]
  );

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
        <Sidebar links={adminLinks} />
        <main className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64 min-h-screen w-full overflow-x-auto">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <Sidebar links={adminLinks} />
      <main className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64 min-h-screen w-full overflow-x-auto animate-fadeIn">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slideUp">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-indigo-600 mb-2">
                {t("dashboard.title")}
              </h1>
              <p className="text-sm text-slate-600 font-medium">{t("dashboard.overview")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard
              label={t("dashboard.totalTasks")}
              value={counts.total || 0}
              accent="blue"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <StatCard
              label={t("dashboard.pending")}
              value={counts.pending || 0}
              accent="yellow"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label={t("dashboard.inProgress")}
              value={counts.inProgress || 0}
              accent="blue"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            />
            <StatCard
              label={t("dashboard.completed")}
              value={counts.completed || 0}
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
              title={t("dashboard.taskDistribution")}
              data={distributionData}
              height={300}
            />

            {/* Summary Stats */}
            <div className="card-premium p-6 animate-fadeIn" style={{ animationDelay: '150ms' }}>
              <h3 className="text-lg font-bold text-indigo-600 mb-4">{t("dashboard.summary")}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-300">
                  <span className="text-sm font-semibold text-blue-700">{t("dashboard.totalTasks")}</span>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{counts.total || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-100 hover:shadow-md transition-all duration-300">
                  <span className="text-sm font-semibold text-yellow-700">{t("dashboard.pending")}</span>
                  <span className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">{counts.pending || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md transition-all duration-300">
                  <span className="text-sm font-semibold text-green-700">{t("dashboard.completed")}</span>
                  <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{counts.completed || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <TableRecentTasks tasks={recentTasks} />
        </div>
      </main>
      {user && <ChatButton currentUser={user} />}
    </div>
  );
};

export default Dashboard;
