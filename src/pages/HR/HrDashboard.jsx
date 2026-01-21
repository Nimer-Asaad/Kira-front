import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import HrLayout from "../../components/HrLayout";
import StatCard from "../../components/StatCard";
import DonutChart from "../../components/DonutChart";
import axiosInstance from "../../utils/axiosInstance";
import API_PATHS from "../../utils/apiPaths";

const SortableTh = ({ label, onClick, active, dir, align = "center" }) => {
  const alignClass = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";
  return (
    <th
      className={`px-4 py-3 font-semibold text-slate-700 cursor-pointer select-none ${alignClass}`}
      onClick={onClick}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (dir === "asc" ? "▲" : "▼") : ""}
      </span>
    </th>
  );
};

const HrDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [trainees, setTrainees] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [evalForm, setEvalForm] = useState({ hrFinalScore: "", hrDecision: "", hrNotes: "" });
  const [savingEval, setSavingEval] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState("hrFinalScore");
  const [sortDir, setSortDir] = useState("desc");
  const eligibleForPromotion = (t) => {
    const completion = t?.progress?.completionRate || 0;
    const finalScore = t?.hrFinalScore ?? 0;
    if (t?.hrDecision === "ready_to_promote") return true;
    return completion >= 80 && finalScore >= 95;
  };

  const handlePromote = (trainee) => {
    if (!eligibleForPromotion(trainee)) return;
    // Redirect to Admin page where promotion decision will be made
    navigate("/admin/users", { state: { openEvaluatedTraineesTab: true } });
  };

  const handleReopenTraining = async (trainee) => {
    const ok = window.confirm(`Reopen training for ${trainee.displayName}? They will be able to submit again.`);
    if (!ok) return;
    try {
      await axiosInstance.post(API_PATHS.TRAINEE_REOPEN_TRAINING(trainee.traineeId || trainee._id));
      alert("Training reopened successfully");
      await fetchDashboard();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to reopen training");
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, traineesRes] = await Promise.all([
        axiosInstance.get(API_PATHS.HR_TRAINEE_STATS),
        axiosInstance.get(API_PATHS.HR_DASHBOARD_TRAINEES),
      ]);
      setStats(statsRes.data);
      const filtered = (traineesRes.data || [])
        .filter((t) => !["cancelled", "withdrawn", "archived"].includes(t.status))
        .sort((a, b) => (b.hrFinalScore || 0) - (a.hrFinalScore || 0));
      setTrainees(filtered);
      setError("");
    } catch (err) {
      setError("Failed to load HR dashboard");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTrainees = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    return trainees
      .filter((t) => {
        const statusOk = !statusFilter || t.status === statusFilter || (statusFilter === "ready_to_promote" && t.status === "eligible_for_promotion");
        if (!statusOk) return false;
        if (!q) return true;
        const hay = `${t.displayName || ""} ${t.email || ""} ${t.position || ""}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        const getVal = (t) => {
          if (sortKey === "progress") return t?.progress?.completionRate || 0;
          if (sortKey === "training") return t?.computedTrainingScore || 0;
          if (sortKey === "status") return t?.status || "";
          return t?.hrFinalScore ?? 0;
        };
        const va = getVal(a);
        const vb = getVal(b);
        if (typeof va === "string") return va.localeCompare(vb) * dir;
        return (vb - va) * dir;
      });
  }, [trainees, search, statusFilter, sortKey, sortDir]);

  const counts = stats?.counts || {};
  const ready = stats?.ready || 0;

  const openEvaluate = (trainee) => {
    setSelectedTrainee(trainee);
    const hasSaved = trainee?.hrFinalScore !== null && trainee?.hrFinalScore !== undefined;
    const defaultScore = hasSaved ? trainee.hrFinalScore : (trainee.suggestedHrScore ?? "");
    const defaultDecision = hasSaved ? (trainee.hrDecision || "") : (trainee.suggestedDecision || "");
    const defaultNotes = hasSaved ? (trainee.hrNotes || "") : (trainee.suggestedNotes || "");
    setEvalForm({
      hrFinalScore: defaultScore,
      hrDecision: defaultDecision,
      hrNotes: defaultNotes,
    });
  };

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "status" ? "asc" : "desc");
    }
  };

  const saveEvaluation = async () => {
    if (!selectedTrainee) return;
    setSavingEval(true);
    try {
      await axiosInstance.put(
        API_PATHS.HR_TRAINEE_EVALUATION(selectedTrainee.traineeId),
        {
          hrFinalScore: Number(evalForm.hrFinalScore),
          hrDecision: evalForm.hrDecision,
          hrNotes: evalForm.hrNotes,
        }
      );
      setSelectedTrainee(null);
      await fetchDashboard();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to save evaluation");
    } finally {
      setSavingEval(false);
    }
  };

  // Distribution data for donut chart
  const distributionData = useMemo(
    () => [
      { name: t("hr.dashboard.trial"), value: counts.trial || 0, color: "#3b82f6" },
      { name: t("hr.dashboard.partTime"), value: counts.part_time_candidate || 0, color: "#f59e0b" },
      { name: t("hr.dashboard.readyToPromote"), value: ready, color: "#10b981" },
    ],
    [counts, ready, t]
  );

  if (loading) {
    return (
      <HrLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </HrLayout>
    );
  }

  return (
    <HrLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slideUp">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-indigo-600 mb-2">
            {t("hr.dashboard.title")}
          </h1>
          <p className="text-sm text-slate-600 font-medium">{t("hr.dashboard.subtitle")}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          <StatCard
            label={t("hr.dashboard.traineesInTrial")}
            value={counts.trial || 0}
            accent="blue"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
          <StatCard
            label={t("hr.dashboard.partTimeCandidates")}
            value={counts.part_time_candidate || 0}
            accent="yellow"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M7 20H2v-2a3 3 0 015.856-1.487M15 6a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <StatCard
            label={t("hr.dashboard.readyToPromote")}
            value={ready || 0}
            accent="green"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
        </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Distribution Chart */}
          <DonutChart
            title={t("hr.dashboard.distribution")}
            data={distributionData}
            height={300}
          />

          {/* Summary Stats */}
          <div className="card-premium p-6 animate-fadeIn" style={{ animationDelay: '150ms' }}>
            <h3 className="text-lg font-bold text-indigo-600 mb-4">{t("hr.dashboard.summary")}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-300">
                <span className="text-sm font-semibold text-blue-700">{t("hr.dashboard.traineesInTrial")}</span>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{counts.trial || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-100 hover:shadow-md transition-all duration-300">
                <span className="text-sm font-semibold text-yellow-700">{t("hr.dashboard.partTimeCandidates")}</span>
                <span className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">{counts.part_time_candidate || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md transition-all duration-300">
                <span className="text-sm font-semibold text-green-700">{t("hr.dashboard.readyToPromote")}</span>
                <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{ready || 0}</span>
              </div>
            </div>
          </div>
        </div>

      {/* Trainee Evaluation Table */}
      <div className="card-premium p-6 animate-fadeIn" style={{ animationDelay: '200ms' }}>
          <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-indigo-600">{t("hr.dashboard.evaluationTable")}</h3>
              <p className="text-sm text-slate-600 font-medium mt-1">{t("hr.dashboard.sortableBy")}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("hr.dashboard.searchPlaceholder")}
                className="px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-indigo-300 min-w-0 flex-1 sm:flex-initial"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-indigo-300 whitespace-nowrap"
              >
                <option value="">{t("hr.dashboard.allStatus")}</option>
                <option value="trial">{t("hr.dashboard.trial")}</option>
                <option value="part_time_candidate">{t("hr.dashboard.partTime")}</option>
                <option value="ready_to_promote">{t("hr.dashboard.readyToPromote")}</option>
                <option value="promoted">{t("hr.dashboard.promoted")}</option>
                <option value="paused">{t("hr.dashboard.paused")}</option>
                <option value="frozen">{t("hr.dashboard.frozen")}</option>
              </select>
            </div>
          </div>

          {filteredTrainees.length === 0 ? (
            <div className="card-premium p-8 text-center">
              <p className="text-sm text-slate-600 font-medium">{t("hr.dashboard.noTrainees")}</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="min-w-[1000px] w-full text-sm">
                <thead className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200">
                  <tr>
                    <SortableTh label={t("hr.dashboard.columnRank")} onClick={() => toggleSort("hrFinalScore")} active={sortKey === "hrFinalScore"} dir={sortDir} align="left" />
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">{t("hr.dashboard.columnName")}</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">{t("hr.dashboard.columnEmail")}</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">{t("hr.dashboard.columnPosition")}</th>
                    <SortableTh label={t("hr.dashboard.columnStatus")} onClick={() => toggleSort("status")} active={sortKey === "status"} dir={sortDir} />
                    <SortableTh label={t("hr.dashboard.columnTrainingScore")} onClick={() => toggleSort("training")} active={sortKey === "training"} dir={sortDir} />
                    <SortableTh label={t("hr.dashboard.columnProgress")} onClick={() => toggleSort("progress")} active={sortKey === "progress"} dir={sortDir} />
                    <SortableTh label={t("hr.dashboard.columnHrScore")} onClick={() => toggleSort("hrFinalScore")} active={sortKey === "hrFinalScore"} dir={sortDir} />
                    <th className="px-4 py-3 text-center font-semibold text-slate-700">{t("hr.dashboard.columnDecision")}</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700">{t("hr.dashboard.columnLastEvaluated")}</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700">{t("hr.dashboard.columnActions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTrainees.map((trainee, idx) => {
                    const reviewed = trainee.progress?.reviewed || 0;
                    const total = trainee.progress?.total || 0;
                    const progressPercent = total > 0 ? Math.round((reviewed / total) * 100) : 0;
                    const rank = idx + 1;
                    const evaluatedAt = trainee.evaluatedAt ? new Date(trainee.evaluatedAt).toLocaleString() : "—";
                    return (
                      <tr 
                        key={trainee.traineeId || trainee._id}
                        className="hover:bg-indigo-50/50 transition-all duration-200 animate-fadeIn"
                        style={{ animationDelay: `${250 + idx * 50}ms` }}
                      >
                        <td className="px-4 py-3 text-left font-semibold text-slate-900">{rank}</td>
                        <td className="px-4 py-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate max-w-[150px]" title={trainee.displayName || "Unknown"}>{trainee.displayName || "Unknown"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <div className="truncate max-w-[200px]" title={trainee.email || ""}>{trainee.email || ""}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <div className="truncate max-w-[120px]" title={trainee.position || "-"}>{trainee.position || "-"}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs font-bold rounded-full shadow-sm border border-blue-200">
                            {trainee.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-900">{trainee.computedTrainingScore || 0} pts</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-20 bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                              <div className="bg-indigo-500 h-full rounded-full transition-all duration-700 ease-out shadow-sm" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <span className="text-xs text-slate-600 w-16 text-right font-semibold">{reviewed}/{total}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-1">{progressPercent}%</p>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-900">{trainee.hrFinalScore ?? "—"}</td>
                        <td className="px-4 py-3 text-center text-slate-700 font-medium">{trainee.hrDecision || "—"}</td>
                        <td className="px-4 py-3 text-center text-slate-700 font-medium">{evaluatedAt}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2 justify-end">
                            <button
                              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-lg hover:bg-indigo-700 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
                              onClick={() => openEvaluate(trainee)}
                            >
                              Evaluate
                            </button>
                            <button
                              className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all duration-300 ${eligibleForPromotion(trainee) ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-xl hover:scale-105 active:scale-95" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                              onClick={() => handlePromote(trainee)}
                              disabled={!eligibleForPromotion(trainee)}
                              title={eligibleForPromotion(trainee) ? "Send to Admin for hiring decision" : "Not ready yet"}
                            >
                              Admin Decision
                            </button>
                            <button
                              className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-lg hover:bg-orange-700 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
                              onClick={() => handleReopenTraining(trainee)}
                              title="Allow trainee to submit training again"
                            >
                              Reopen
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Evaluation Modal */}
        {selectedTrainee && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="card-premium w-full max-w-xl border-2 border-indigo-100 shadow-2xl modal-enter">
              <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/30 flex items-center justify-between rounded-t-2xl">
                <div>
                  <h3 className="text-lg font-bold text-indigo-600">{t("hr.dashboard.evaluateTrainee")}</h3>
                  <p className="text-sm text-slate-600 font-medium mt-1">{selectedTrainee.displayName} · {selectedTrainee.email}</p>
                </div>
                <button className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full p-2 transition-all duration-200 hover:scale-110" onClick={() => setSelectedTrainee(null)}>✕</button>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 hover:shadow-md transition-all duration-300">
                    <p className="text-slate-600 font-medium">Training Score (reviewed)</p>
                    <p className="text-xl font-bold text-indigo-600 mt-1">{selectedTrainee.totalEarnedPoints || 0} pts</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
                    <p className="text-slate-600 font-medium">Progress (reviewed)</p>
                    <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-1">{selectedTrainee.progress?.reviewed || 0}/{selectedTrainee.progress?.total || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 hover:shadow-md transition-all duration-300">
                    <p className="text-slate-600 font-medium">Completion Rate</p>
                    <p className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mt-1">{selectedTrainee.progress?.completionRate || 0}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-100 hover:shadow-md transition-all duration-300">
                    <p className="text-slate-600 font-medium">Timing</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">On-time: {selectedTrainee.timing?.onTime || 0} · Early: {selectedTrainee.timing?.early || 0} · Late: {selectedTrainee.timing?.late || 0}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">HR Final Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={evalForm.hrFinalScore}
                    onChange={(e) => setEvalForm((prev) => ({ ...prev, hrFinalScore: e.target.value }))}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-indigo-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">{t("hr.dashboard.decision")}</label>
                  <select
                    value={evalForm.hrDecision}
                    onChange={(e) => setEvalForm((prev) => ({ ...prev, hrDecision: e.target.value }))}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-indigo-300 text-sm"
                  >
                    <option value="">{t("hr.dashboard.selectDecision")}</option>
                    <option value="trial">{t("hr.dashboard.trial")}</option>
                    <option value="needs_improvement">{t("hr.dashboard.needsImprovement")}</option>
                    <option value="part_time">{t("hr.dashboard.partTime")}</option>
                    <option value="ready_to_promote">{t("hr.dashboard.readyToPromote")}</option>
                    <option value="promoted">{t("hr.dashboard.promoted")}</option>
                    <option value="rejected">{t("hr.dashboard.rejected")}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">{t("hr.dashboard.notes")}</label>
                  <textarea
                    rows={3}
                    value={evalForm.hrNotes}
                    onChange={(e) => setEvalForm((prev) => ({ ...prev, hrNotes: e.target.value }))}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-indigo-300 text-sm"
                    placeholder={t("hr.dashboard.addNotesPlaceholder")}
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-b-2xl">
                <button
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-white rounded-xl transition-all duration-200 border border-slate-200"
                  onClick={() => setSelectedTrainee(null)}
                  disabled={savingEval}
                >
                  Cancel
                </button>
                <button
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl hover:bg-indigo-700 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={saveEvaluation}
                  disabled={savingEval}
                >
                  {savingEval ? "Saving..." : "Save Evaluation"}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 shadow-sm animate-fadeIn">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}
    </HrLayout>
  );
};

export default HrDashboard;
