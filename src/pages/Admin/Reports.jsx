import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import StatCard from "../../components/StatCard";
import DonutChart from "../../components/DonutChart";
import BarChartCard from "../../components/BarChartCard";
import ChatButton from "../../components/ChatButton";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const adminLinks = [
  {
    path: "/admin/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    path: "/admin/tasks",
    label: "Manage Tasks",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    path: "/admin/create-task",
    label: "Create Task",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    path: "/admin/users",
    label: "Team Members",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    path: "/admin/reports",
    label: "Reports",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

const Reports = () => {
  const { user } = useAuth();
  const [taskReport, setTaskReport] = useState(null);
  const [teamReport, setTeamReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("month"); // week, month, year
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [taskRes, teamRes] = await Promise.all([
        axiosInstance.get(`${API_PATHS.TASK_REPORT}?range=${dateRange}`).catch(() => ({ data: null })),
        axiosInstance.get(`${API_PATHS.TEAM_REPORT}?range=${dateRange}`).catch(() => ({ data: null })),
      ]);
      setTaskReport(taskRes.data);
      setTeamReport(teamRes.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      setExporting(true);
      const endpoint = type === "tasks" ? API_PATHS.TASK_REPORT : API_PATHS.TEAM_REPORT;
      const response = await axiosInstance.get(`${endpoint}?range=${dateRange}&export=true`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${type}-report-${dateRange}-${new Date().toISOString().split("T")[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

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

  const taskStats = taskReport?.stats || {};
  const teamStats = teamReport?.stats || {};

  const taskDistributionData = [
    { name: "Completed", value: taskStats.completed || 0, color: "#10b981" },
    { name: "In Progress", value: taskStats.inProgress || 0, color: "#2563eb" },
    { name: "Pending", value: taskStats.pending || 0, color: "#f59e0b" },
    { name: "Overdue", value: taskStats.overdue || 0, color: "#ef4444" },
  ];

  const teamPerformanceData = [
    { name: "High Performers", value: teamStats.highPerformers || 0 },
    { name: "Average", value: teamStats.average || 0 },
    { name: "Needs Improvement", value: teamStats.needsImprovement || 0 },
  ];

  const completionRateData = [
    { name: "On Time", value: taskStats.onTime || 0 },
    { name: "Late", value: taskStats.late || 0 },
    { name: "Early", value: taskStats.early || 0 },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <Sidebar links={adminLinks} />
      <main className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64 min-h-screen w-full overflow-x-auto animate-fadeIn">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slideUp">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-indigo-600 mb-2">
                Reports
              </h1>
              <p className="text-sm text-slate-600 font-medium">Detailed analytics and insights</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Date Range Selector */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-indigo-300"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>

              {/* Export Buttons */}
              <button
                onClick={() => handleExport("tasks")}
                disabled={exporting}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg hover:bg-indigo-700 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Tasks
              </button>
              <button
                onClick={() => handleExport("team")}
                disabled={exporting}
                className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Team
              </button>
            </div>
          </div>

          {/* Task Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard
              label="Total Tasks"
              value={taskStats.total || 0}
              accent="blue"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <StatCard
              label="Completed"
              value={taskStats.completed || 0}
              accent="green"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="In Progress"
              value={taskStats.inProgress || 0}
              accent="blue"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            />
            <StatCard
              label="Overdue"
              value={taskStats.overdue || 0}
              accent="red"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          {/* Team Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard
              label="Total Team Members"
              value={teamStats.totalMembers || 0}
              accent="purple"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
            />
            <StatCard
              label="Active Members"
              value={teamStats.activeMembers || 0}
              accent="green"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="Avg. Completion Rate"
              value={`${teamStats.avgCompletionRate || 0}%`}
              accent="blue"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <DonutChart title="Task Distribution" data={taskDistributionData} />
            <BarChartCard title="Team Performance" data={teamPerformanceData} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <BarChartCard title="Completion Rate" data={completionRateData} />

            {/* Summary Card */}
            <div className="card-premium p-6 animate-fadeIn" style={{ animationDelay: '200ms' }}>
              <h3 className="text-lg font-bold text-indigo-600 mb-4">
                Summary
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-300">
                  <span className="text-sm font-semibold text-blue-700">Completion Rate</span>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md transition-all duration-300">
                  <span className="text-sm font-semibold text-green-700">On-Time Rate</span>
                  <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {taskStats.total > 0 ? Math.round((taskStats.onTime / taskStats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-100 hover:shadow-md transition-all duration-300">
                  <span className="text-sm font-semibold text-yellow-700">Team Productivity</span>
                  <span className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                    {teamStats.avgCompletionRate || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {user && <ChatButton currentUser={user} />}
    </div>
  );
};

export default Reports;

