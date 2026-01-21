import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Sidebar from "../../components/Sidebar";
import StatCard from "../../components/StatCard";
import DonutChart from "../../components/DonutChart";
import ChatButton from "../../components/ChatButton";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const traineeLinks = [
  { path: "/trainee/dashboard", label: "Dashboard", labelKey: "common.dashboard", icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>) },
  { path: "/trainee/tasks", label: "Training Tasks", labelKey: "hr.traineeTasks.title", icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>) },
];

export default function TraineeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data } = await axiosInstance.get(API_PATHS.TRAINEE_DASHBOARD);
      setData(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!window.confirm(t("hr.traineeTasks.submitTrainingConfirm", "Submit all training for HR review?"))) return;
    setEvaluating(true);
    try {
      console.log("[Dashboard] Calling:", API_PATHS.TRAINEE_SUBMIT_TRAINING);
      const result = await axiosInstance.post(API_PATHS.TRAINEE_SUBMIT_TRAINING);
      console.log("[Dashboard] Success:", result);
      alert(t("hr.traineeTasks.trainingSubmittedMsg", "Your submission is complete. You will receive an email if we need anything else or if you are hired."));
      await fetchData();
    } catch (err) {
      console.error("[Dashboard] Error:", err);
      alert(err?.response?.data?.message || "Failed to submit training");
    } finally {
      setEvaluating(false);
    }
  };

  // Prepare derived values and memoized datasets BEFORE any early returns (to keep hook order stable)
  const totalsSafe = data?.totals || {};
  const completionRate = totalsSafe?.completionRate || 0;
  const statusBreakdownData = useMemo(() => ([
    { name: "Pending", value: totalsSafe?.pendingTasks || 0, color: "#f59e0b" },
    { name: "In Progress", value: totalsSafe?.inProgressTasks || 0, color: "#2563eb" },
    { name: "Submitted", value: totalsSafe?.submittedTasks || 0, color: "#6366f1" },
    { name: "Reviewed", value: totalsSafe?.reviewedTasks || 0, color: "#10b981" },
  ]), [totalsSafe]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gray-50">
        <Sidebar links={traineeLinks} />
        <main className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64 min-h-screen w-full overflow-x-auto">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen w-full bg-gray-50">
        <Sidebar links={traineeLinks} />
        <main className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64 min-h-screen w-full overflow-x-auto">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 font-semibold text-start rtl:text-right">{error || "No data"}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { trainee, points, timing, recent, traineeStatus } = data || {};
  const statusColors = {
    trial: "bg-blue-100 text-blue-800",
    needs_improvement: "bg-yellow-100 text-yellow-800",
    part_time_candidate: "bg-green-100 text-green-800",
    eligible_for_promotion: "bg-purple-100 text-purple-800",
    promoted: "bg-emerald-100 text-emerald-800",
    paused: "bg-yellow-50 text-yellow-700",
    frozen: "bg-orange-50 text-orange-700",
    cancelled: "bg-red-50 text-red-700",
    withdrawn: "bg-gray-50 text-gray-700",
  };

  const submitted = traineeStatus?.trainingStatus === "submitted";
  const expired = traineeStatus?.trainingStatus === "expired";

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <Sidebar links={traineeLinks} />
      <main className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64 min-h-screen w-full overflow-x-auto">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slideUp rtl:flex-row-reverse">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600 text-start rtl:text-right">{t("hr.traineeTasks.dashboardTitle")}</h1>
              <p className="text-sm text-slate-600 font-medium mt-1 truncate text-start rtl:text-right" title={trainee?.position || "—"}>{t("hr.traineeTasks.position")}: {trainee?.position || "—"}</p>
              <div className="mt-3">
                <span className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap shadow-sm border ${statusColors[trainee?.status] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
                  {trainee?.status || "Unknown"}
                </span>
              </div>
            </div>
            {trainee?.status === "trial" && data?.traineeStatus?.trainingStatus !== "submitted" && data?.traineeStatus?.trainingStatus !== "expired" && (
              <button
                onClick={handleEvaluate}
                disabled={evaluating}
                className="px-5 sm:px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base whitespace-nowrap shrink-0 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
              >
                {evaluating ? t("common.loading") : t("hr.traineeTasks.finishTraining", "Finish Training")}
              </button>
            )}
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label={t("hr.traineeTasks.totalPointsEarned")}
              value={Math.round(points?.totalEarned || 0)}
              accent="blue"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 11V7a1 1 0 012 0v4h4a1 1 0 010 2h-4v4a1 1 0 01-2 0v-4H7a1 1 0 010-2h4z" /></svg>}
            />
            <StatCard
              label={t("hr.traineeTasks.completionRate")}
              value={`${completionRate}%`}
              helperText={`${totalsSafe?.reviewedTasks || 0}/${totalsSafe?.totalTasks || 0} tasks`}
              accent="green"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard
              label={t("hr.traineeTasks.averagePointsPerTask")}
              value={(points?.avgPerReviewed || 0).toFixed(1)}
              accent="purple"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6l-2 4h4l-2 4" /></svg>}
            />
            <StatCard
              label={t("hr.traineeTasks.onTimeSubmissions")}
              value={timing?.onTime || 0}
              helperText={`${t("hr.traineeTasks.early")}: ${timing?.early || 0} | ${t("hr.traineeTasks.late")}: ${timing?.late || 0}`}
              accent="yellow"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
          </div>

          {/* Submitted/Expired Notice */}
          {(submitted || expired) && (
            <div className="rounded-lg border-l-4 rtl:border-l-0 rtl:border-r-4 p-4 bg-purple-50 border-purple-400 mb-4">
              <p className="text-sm text-purple-800 font-semibold text-start rtl:text-right">{submitted ? t("hr.traineeTasks.delivered", "Delivered") : t("hr.traineeTasks.expired", "Expired")}</p>
              <p className="text-sm text-purple-700 mt-1 text-start rtl:text-right">{t("hr.traineeTasks.trainingSubmittedMsg", "Your submission is complete. You will receive an email if we need anything else or if you are hired.")}</p>
            </div>
          )}

          {/* Progress */}
          <div className="card-premium p-6 animate-fadeIn" style={{ animationDelay: '150ms' }}>
            <h3 className="text-base font-bold text-indigo-600 mb-4 text-start rtl:text-right">{t("hr.traineeTasks.overallProgress")}</h3>
            <div className="relative w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
              <div className="bg-indigo-500 h-full rounded-full transition-all duration-700 ease-out shadow-sm" style={{ width: `${Math.min(completionRate, 100)}%` }} />
            </div>
            <p className="text-sm text-slate-600 font-semibold mt-2 text-end rtl:text-start">{completionRate}% {t("common.complete", "Complete")}</p>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <DonutChart title={t("hr.traineeTasks.statusBreakdown")} data={statusBreakdownData} />

            {/* Recent Activity */}
            <div className="card-premium p-4 animate-fadeIn" style={{ animationDelay: '200ms' }}>
              <h3 className="text-base font-bold text-indigo-600 mb-3 text-start rtl:text-right">{t("hr.traineeTasks.recentActivity")}</h3>
              {(!recent || recent.length === 0) ? (
                <p className="text-sm text-slate-600 font-medium text-start rtl:text-right">{t("hr.traineeTasks.noRecentActivity")}</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recent.map((r, idx) => (
                    <div key={r.taskId} className="py-3 flex items-center justify-between gap-3 rtl:flex-row-reverse animate-fadeIn" style={{ animationDelay: `${250 + idx * 50}ms` }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate text-start rtl:text-right" title={r.title}>{r.title}</p>
                        <p className="text-xs text-slate-600 font-medium text-start rtl:text-right">{new Date(r.updatedAt).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${r.status === 'reviewed' ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200' : r.status === 'submitted' ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-200' : r.status === 'in-progress' ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200' : 'bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-yellow-200'}`}>{r.status}</span>
                        <p className="text-xs text-slate-600 font-semibold mt-1">{t("hr.traineeTasks.earned")}: {r.earnedPoints || 0} {t("hr.traineeTasks.points")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tip */}
          <div className="mt-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm animate-fadeIn" style={{ animationDelay: '250ms' }}>
            <p className="text-sm text-blue-800 font-medium">💡 {t("hr.traineeTasks.earlySubmissionTip")}</p>
          </div>
        </div>
      </main>
      {user && <ChatButton currentUser={user} />}
    </div>
  );
}
