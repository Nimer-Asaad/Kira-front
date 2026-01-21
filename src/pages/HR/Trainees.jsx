import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import HrLayout from "../../components/HrLayout";
import ApplicantDetailsModal from "../../components/HR/ApplicantDetailsModal";
import TaskListModal from "../../components/HR/TaskListModal";

const Trainees = () => {
  const { t } = useTranslation();
  const [acceptedApplicants, setAcceptedApplicants] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [generatingFor, setGeneratingFor] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [selected, setSelected] = useState(null);
  const [tasksModalFor, setTasksModalFor] = useState(null);
  const navigate = useNavigate();

  const filteredTrainees = useMemo(() => {
    const regex = new RegExp(search, "i");
    return trainees.filter(trainee => {
      const a = trainee.applicantId || {};
      // Hide cancelled trainees from this list
      if (trainee.status === "cancelled") return false;
      return (!statusFilter || trainee.status === statusFilter) && (
        !search || regex.test(a.fullName || "") || regex.test(a.email || "") || regex.test(trainee.position || "")
      );
    });
  }, [trainees, search, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [apps, trs] = await Promise.all([
        axiosInstance.get(API_PATHS.HR_APPLICANTS, { params: { stage: "Hired" } }),
        axiosInstance.get(API_PATHS.HR_TRAINEES),
      ]);
      // Show hired applicants that do NOT have a trainee, OR have a cancelled trainee
      const hiredPending = (apps.data || []).filter(a => {
        if (!a.traineeId) return true; // No trainee yet
        const trainee = trs.data.find(t => t._id === a.traineeId);
        if (!trainee) return true; // Stale trainee link: treat as pending
        return trainee?.status === "cancelled"; // Or trainee is cancelled
      });
      setAcceptedApplicants(hiredPending);
      setTrainees(trs.data || []);
    } catch (err) {
      console.error("Error loading trainees", err);
      setError("Failed to load trainees");
    } finally {
      setLoading(false);
    }
  };
  // No revert from training pipeline; evaluation completes lifecycle

  useEffect(() => { fetchData(); }, []);

  const createTrainee = async (applicantId) => {
    try {
      await axiosInstance.post(API_PATHS.HR_TRAINEE_FROM_APPLICANT(applicantId));
      await fetchData();
    } catch (err) {
      if (err?.response?.status === 409) {
        alert("Trainee already exists for this applicant");
        await fetchData();
      } else {
        alert(err?.response?.data?.message || "Failed to create trainee");
      }
    }
  };

  const handleUpdateApplicant = async (id, payload) => {
    try {
      const { data } = await axiosInstance.patch(API_PATHS.HR_APPLICANT_BY_ID(id), payload);
      // If moved back to Applied, go to Applicants page
      if (payload.stage === "Applied") {
        setSelected(null);
        navigate("/hr/applicants");
        return data;
      }
      // Otherwise just refresh current lists
      await fetchData();
      return data;
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update applicant");
    }
  };

  const handleDeleteApplicant = async (id) => {
    if (!window.confirm("Delete this applicant?")) return;
    try {
      await axiosInstance.delete(API_PATHS.HR_APPLICANT_BY_ID(id));
      setSelected(null);
      await fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete applicant");
    }
  };

  const handleUploadCv = async (id, file) => {
    const formData = new FormData();
    formData.append("cv", file);
    try {
      const { data } = await axiosInstance.post(API_PATHS.HR_APPLICANT_CV(id), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchData();
      setSelected(data);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to upload CV");
    }
  };

  const handleGenerateAiSummary = async (id) => {
    try {
      const { data } = await axiosInstance.post(API_PATHS.HR_APPLICANT_AI_SUMMARY(id));
      await fetchData();
      setSelected((prev) => (prev && prev._id === id ? { ...prev, aiSummary: data } : prev));
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to generate AI summary");
    }
  };

  const generateTasksAI = async (traineeId) => {
    try {
      setGeneratingFor(traineeId);
      // Check existing tasks count
      const { data: existing } = await axiosInstance.get(API_PATHS.HR_TRAINEE_TASKS(traineeId));
      const hasExisting = Array.isArray(existing) && existing.length > 0;
      if (hasExisting) {
        const ok = window.confirm("This trainee already has training tasks. Generating again will DELETE the existing tasks and replace them with new ones. Continue?");
        if (!ok) { setGeneratingFor(null); return; }
      }
      await axiosInstance.post(API_PATHS.HR_TRAINEE_GENERATE_TASKS(traineeId), { mode: "ai", replace: hasExisting });
      await fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to generate tasks");
    } finally {
      setGeneratingFor(null);
    }
  };

  const generateTasksPDF = async (traineeId) => {
    if (!pdfFile) return alert("Upload a PDF first");
    try {
      setGeneratingFor(traineeId);
      const fd = new FormData();
      fd.append("pdf", pdfFile);
      await axiosInstance.post(API_PATHS.HR_TRAINEE_GENERATE_TASKS_PDF(traineeId), fd, { headers: { "Content-Type": "multipart/form-data" } });
      await fetchData();
      setPdfFile(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to generate tasks from PDF");
    } finally {
      setGeneratingFor(null);
    }
  };

  const promote = async (traineeId) => {
    try {
      await axiosInstance.post(API_PATHS.HR_TRAINEE_PROMOTE(traineeId));
      await fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to promote trainee");
    }
  };

  const linkAccount = async (trainee) => {
    if (!window.confirm(`Link login account for ${trainee.applicantId?.fullName}?`)) return;
    try {
      const { data } = await axiosInstance.post(API_PATHS.HR_TRAINEE_LINK_USER(trainee._id));
      await fetchData();
      const message = data.emailSent 
        ? `✅ Account linked and email sent!\n\nEmail: ${data.email}\nTemp Password: ${data.tempPassword}\n\n${data.emailMessage}`
        : `⚠️ Account linked but email failed\n\nEmail: ${data.email}\nTemp Password: ${data.tempPassword}\n\nPlease share credentials manually`;
      alert(message);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to link account");
    }
  };

  // Lifecycle actions
  const pauseTrainee = async (traineeId, fullName) => {
    const reason = window.prompt(`Pause training for ${fullName}?\n\nEnter pause reason:`, "");
    if (reason === null) return;
    try {
      await axiosInstance.patch(API_PATHS.HR_TRAINEE_PAUSE(traineeId), { reason });
      await fetchData();
      alert("Trainee paused successfully");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to pause trainee");
    }
  };

  const freezeTrainee = async (traineeId, fullName) => {
    const reason = window.prompt(`Freeze training for ${fullName}?\n\nEnter freeze reason (admin hold):`, "");
    if (reason === null) return;
    try {
      await axiosInstance.patch(API_PATHS.HR_TRAINEE_FREEZE(traineeId), { reason });
      await fetchData();
      alert("Trainee frozen successfully");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to freeze trainee");
    }
  };

  const resumeTrainee = async (traineeId, fullName) => {
    if (!window.confirm(`Resume training for ${fullName}? (Return to trial status)`)) return;
    try {
      await axiosInstance.patch(API_PATHS.HR_TRAINEE_RESUME(traineeId));
      await fetchData();
      alert("Trainee resumed to trial status");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to resume trainee");
    }
  };

  const cancelTrainee = async (traineeId, fullName) => {
    const reason = window.prompt(`Cancel training for ${fullName}?\n\nThis is final. Enter cancellation reason:`, "");
    if (reason === null) return;
    try {
      await axiosInstance.patch(API_PATHS.HR_TRAINEE_CANCEL(traineeId), { reason });
      await fetchData();
      alert("Trainee training cancelled");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to cancel trainee");
    }
  };

  const approveWithdraw = async (traineeId, fullName) => {
    if (!window.confirm(`Approve withdrawal for ${fullName}?`)) return;
    try {
      await axiosInstance.patch(API_PATHS.HR_TRAINEE_WITHDRAW_APPROVE(traineeId));
      await fetchData();
      alert("Withdrawal approved");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to approve withdrawal");
    }
  };

  const rejectWithdraw = async (traineeId, fullName) => {
    if (!window.confirm(`Reject withdrawal for ${fullName}? (Return to trial)`)) return;
    try {
      await axiosInstance.patch(API_PATHS.HR_TRAINEE_WITHDRAW_REJECT(traineeId));
      await fetchData();
      alert("Withdrawal rejected, trainee returned to trial");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to reject withdrawal");
    }
  };

  const revertCancel = async (traineeId, fullName) => {
    if (!window.confirm(`Undo cancellation for ${fullName}? (Return to trial status)`)) return;
    try {
      await axiosInstance.patch(API_PATHS.HR_TRAINEE_REVERT_CANCEL(traineeId));
      await fetchData();
      alert("Cancellation reverted, trainee returned to trial");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to revert cancellation");
    }
  };

  const revertToHired = async (traineeId, fullName) => {
    if (!window.confirm(`Revert ${fullName} back to Hired status?\n\nThis will:\n• Delete all training tasks\n• Remove from Trainees list\n• Return to Hired Applicants\n\nContinue?`)) return;
    try {
      await axiosInstance.delete(API_PATHS.HR_TRAINEE_REVERT_TO_HIRED(traineeId));
      await fetchData();
      alert(t("hr.trainees.revertSuccess"));
    } catch (err) {
      alert(err?.response?.data?.message || t("hr.trainees.revertSuccess"));
    }
  };

  return (
    <HrLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("hr.trainees.title")}</h1>
          <p className="text-sm text-gray-500">{t("hr.trainees.subtitle")}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3 flex-wrap md:items-end">
          <div className="relative flex-1 min-w-48">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("hr.trainees.searchTrainee")}
              className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
          >
            <option value="">{t("hr.trainees.allStatus")}</option>
            <option value="trial">{t("hr.trainees.trial")}</option>
            <option value="needs_improvement">{t("hr.trainees.needsImprovement")}</option>
            <option value="part_time_candidate">{t("hr.trainees.partTimeCandidate")}</option>
            <option value="eligible_for_promotion">{t("hr.trainees.eligibleForPromotion")}</option>
            <option value="promoted">{t("hr.trainees.promoted")}</option>
            <option value="paused">{t("hr.trainees.paused")}</option>
            <option value="frozen">{t("hr.trainees.frozen")}</option>
            <option value="cancelled">{t("hr.trainees.cancelled")}</option>
            <option value="withdraw_requested">{t("hr.trainees.withdrawRequested")}</option>
            <option value="withdrawn">{t("hr.trainees.withdrawn")}</option>
          </select>
          <div className="flex items-center gap-2">
            <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
            <span className="text-xs text-gray-500">{t("hr.trainees.uploadPDF")}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 text-red-600 font-semibold">{error}</div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Hired Applicants (not yet trainees) */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t("hr.trainees.hiredApplicants")}</h2>
            {acceptedApplicants.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-gray-500">{t("hr.trainees.noHiredApplicants")}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {acceptedApplicants.map((a) => {
                  const trainee = trainees.find(t => t._id === a.traineeId);
                  const isCancelled = trainee?.status === "cancelled";
                  const isStale = a.traineeId && !trainee; // applicant points to missing trainee
                  const canConvert = !a.traineeId || isCancelled || isStale;
                  return (
                  <div key={a._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{a.fullName}</h3>
                        <p className="text-sm text-gray-500">{a.email}</p>
                        <p className="text-sm text-gray-600 mt-1">{a.position || "-"}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        isCancelled ? "bg-red-50 text-red-700 border-red-100" : "bg-green-50 text-green-700 border-green-100"
                      }`}>{isCancelled ? t("hr.trainees.cancelled") : t("hr.traineeTasks.hired")}</span>
                    </div>
                    {isCancelled && trainee?.cancelReason && (
                      <p className="mt-2 text-xs text-red-600 italic">{t("hr.traineeTasks.reason")}: {trainee.cancelReason}</p>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
                        onClick={() => setSelected(a)}
                      >
                        {t("hr.traineeTasks.details")}
                      </button>
                      <button
                        className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                          canConvert
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        onClick={() => canConvert && createTrainee(a._id)}
                        disabled={!canConvert}
                      >
                        {canConvert ? t("hr.trainees.convertToTrainee") : t("hr.trainees.traineeCreated")}
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trainees */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t("hr.trainees.title")}</h2>
            {filteredTrainees.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-gray-500">{t("hr.trainees.noTraineesList")}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTrainees.map(function(trainee){
                  const reviewed = trainee.reviewedTasksCount ?? trainee.completedTasksCount ?? 0;
                  const total = trainee.totalTasksCount ?? trainee.requiredTasksCount ?? 0;
                  const progressPct = total > 0 ? (reviewed / total) * 100 : 0;
                  const earnedPoints = trainee.totalEarnedPoints ?? trainee.score ?? 0;
                  return (
                  <div key={trainee._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{trainee.applicantId?.fullName || "-"}</h3>
                        <p className="text-sm text-gray-500">{trainee.applicantId?.email || "-"}</p>
                        <p className="text-sm text-gray-600 mt-1">{trainee.position || "-"}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        trainee.status === "trial" ? "bg-blue-50 text-blue-700 border-blue-100" :
                        trainee.status === "paused" ? "bg-yellow-50 text-yellow-700 border-yellow-100" :
                        trainee.status === "frozen" ? "bg-orange-50 text-orange-700 border-orange-100" :
                        trainee.status === "cancelled" ? "bg-red-50 text-red-700 border-red-100" :
                        trainee.status === "withdraw_requested" ? "bg-purple-50 text-purple-700 border-purple-100" :
                        trainee.status === "withdrawn" ? "bg-gray-50 text-gray-700 border-gray-100" :
                        "bg-green-50 text-green-700 border-green-100"
                      }`}>{t(`hr.trainees.${trainee.status}`)}</span>
                    </div>
                    <div className="mt-3 text-sm text-gray-600 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{t("hr.trainees.scoreProgress")}</span>
                        <span className="text-lg font-bold text-blue-600">{earnedPoints} pts | {reviewed}/{total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all" 
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      {trainee.pausedReason && <p className="text-yellow-700 text-xs">⏸ {t("hr.trainees.pausedLabel")}: {trainee.pausedReason}</p>}
                      {trainee.frozenReason && <p className="text-orange-700 text-xs">❄️ {t("hr.trainees.frozenLabel")}: {trainee.frozenReason}</p>}
                      {trainee.cancelReason && <p className="text-red-700 text-xs">✘ {t("hr.trainees.cancelledLabel")}: {trainee.cancelReason}</p>}
                      {trainee.withdrawReason && <p className="text-purple-700 text-xs">↩️ {t("hr.trainees.withdrawalLabel")}: {trainee.withdrawReason}</p>}
                    </div>
                    
                    {/* Main action buttons */}
                    <div className="mt-5 flex flex-wrap gap-2">
                      {(["trial", "needs_improvement", "part_time_candidate", "eligible_for_promotion"].includes(trainee.status)) && (
                        <>
                          <button
                            className="px-3 py-2 bg-gray-100 text-gray-800 rounded text-xs font-semibold hover:bg-gray-200"
                            onClick={() => setTasksModalFor(trainee)}
                            title={t("hr.trainees.viewTasks")}
                          >
                            {t("hr.trainees.viewTasks")}
                          </button>
                          <button
                            className="px-3 py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 flex items-center gap-2"
                            onClick={() => generateTasksAI(trainee._id)}
                            disabled={generatingFor === trainee._id}
                            title={t("hr.trainees.generateAI")}
                          >
                            {generatingFor === trainee._id ? (
                              <>
                                <span className="animate-spin inline-block w-4 h-4 border-b-2 border-white rounded-full" />
                                {t("hr.trainees.generating")}
                              </>
                            ) : (
                              <>
                                <span>🤖</span> {t("hr.trainees.generateAI")}
                              </>
                            )}
                          </button>
                          <button
                            className="px-3 py-2 bg-slate-600 text-white rounded text-xs font-semibold hover:bg-slate-700"
                            onClick={() => linkAccount(trainee)}
                            title="Link trainee account"
                          >
                            Link
                          </button>
                          <button
                            className="px-3 py-2 bg-gray-700 text-white rounded text-xs font-semibold hover:bg-gray-800"
                            onClick={() => generateTasksPDF(trainee._id)}
                            disabled={generatingFor === trainee._id || !pdfFile}
                            title={t("hr.trainees.distributePDF")}
                          >
                            {t("hr.trainees.PDF")}
                          </button>
                          <button
                            className="px-3 py-2 bg-red-500 text-white rounded text-xs font-semibold hover:bg-red-600"
                            onClick={() => revertToHired(trainee._id, trainee.applicantId?.fullName)}
                            title={t("hr.trainees.backToHired")}
                          >
                            {t("hr.trainees.backToHired")}
                          </button>
                        </>
                      )}
                    </div>
                    
                    {/* Lifecycle action buttons */}
                    <div className="mt-4 border-t pt-3 flex flex-wrap gap-2">
                      {trainee.status === "trial" && (
                        <>
                          <button
                            className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold hover:bg-yellow-200"
                            onClick={() => pauseTrainee(trainee._id, trainee.applicantId?.fullName)}
                            title={t("hr.trainees.pauseTitle")}
                          >
                            ⏸ {t("hr.trainees.pause")}
                          </button>
                          <button
                            className="px-3 py-2 bg-orange-100 text-orange-700 rounded text-xs font-semibold hover:bg-orange-200"
                            onClick={() => freezeTrainee(trainee._id, trainee.applicantId?.fullName)}
                            title={t("hr.trainees.freezeTitle")}
                          >
                            ❄️ {t("hr.trainees.freeze")}
                          </button>
                          <button
                            className="px-3 py-2 bg-red-100 text-red-700 rounded text-xs font-semibold hover:bg-red-200"
                            onClick={() => cancelTrainee(trainee._id, trainee.applicantId?.fullName)}
                            title={t("hr.trainees.cancelTitle")}
                          >
                            ✘ {t("hr.trainees.cancel")}
                          </button>
                        </>
                      )}
                      {(trainee.status === "paused" || trainee.status === "frozen" || trainee.status === "cancelled") && (
                        <button
                          className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700"
                          onClick={() => {
                            if (trainee.status === "cancelled") {
                              revertCancel(trainee._id, trainee.applicantId?.fullName);
                            } else {
                              resumeTrainee(trainee._id, trainee.applicantId?.fullName);
                            }
                          }}
                          title={t("hr.trainees.continueTitle")}
                        >
                          ▶️ {t("hr.trainees.continue")}
                        </button>
                      )}
                      {trainee.status === "withdraw_requested" && (
                        <>
                          <button
                            className="px-3 py-2 bg-green-100 text-green-700 rounded text-xs font-semibold hover:bg-green-200"
                            onClick={() => approveWithdraw(trainee._id, trainee.applicantId?.fullName)}
                            title={t("hr.trainees.approveTitle")}
                          >
                            ✓ {t("hr.trainees.approve")}
                          </button>
                          <button
                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded text-xs font-semibold hover:bg-blue-200"
                            onClick={() => rejectWithdraw(trainee._id, trainee.applicantId?.fullName)}
                            title={t("hr.trainees.rejectTitle")}
                          >
                            ↩️ {t("hr.trainees.reject")}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  );
                })}


              </div>
            )}
          </div>
        </div>
      )}
      <ApplicantDetailsModal
        isOpen={!!selected}
        applicant={selected}
        onClose={() => setSelected(null)}
        onUpdate={handleUpdateApplicant}
        onDelete={handleDeleteApplicant}
        onUploadCv={handleUploadCv}
        onGenerateAiSummary={handleGenerateAiSummary}
        viewOnly={true}
      />
      <TaskListModal
        isOpen={!!tasksModalFor}
        trainee={tasksModalFor}
        onClose={() => setTasksModalFor(null)}
      />
    </HrLayout>
  );
};

export default Trainees;
