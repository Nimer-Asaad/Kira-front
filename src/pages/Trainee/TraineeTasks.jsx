import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import Sidebar from "../../components/Sidebar";
import ChatButton from "../../components/ChatButton";
import { useAuth } from "../../context/AuthContext";
import { Home, CheckSquare } from "lucide-react";
import { useTranslation } from "react-i18next";

const TraineeTasks = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [openForms, setOpenForms] = useState({});
  const [openFeedback, setOpenFeedback] = useState({});
  const [submissionData, setSubmissionData] = useState({});
  const [traineeStatus, setTraineeStatus] = useState(null);
  const locked = traineeStatus && (traineeStatus.trainingStatus === 'submitted' || traineeStatus.trainingStatus === 'expired');

  const sidebarLinks = [
    {
      path: "/trainee/dashboard",
      label: "Dashboard",
      labelKey: "common.dashboard",
      icon: <Home className="w-5 h-5" />,
    },
    {
      path: "/trainee/tasks",
      label: "Training Tasks",
      labelKey: "hr.traineeTasks.title",
      icon: <CheckSquare className="w-5 h-5" />,
    },
  ];

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await axiosInstance.get(API_PATHS.TRAINEE_MY_TASKS);
      setTasks(data?.tasks || []);
      setProgress(data?.progress || { completed: 0, total: 0 });
      setTraineeStatus(data?.traineeStatus || null);
    } catch (err) {
      console.error("Error loading trainee tasks", err);
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const finishTraining = async () => {
    if (!window.confirm(t("hr.traineeTasks.submitTrainingConfirm", "Submit all training for HR review?"))) return;
    try {
      await axiosInstance.post(API_PATHS.TRAINEE_SUBMIT_TRAINING);
      await fetchTasks();
      alert(t("hr.traineeTasks.trainingSubmittedMsg", "Your submission is complete. You will receive an email if we need anything else or if you are hired."));
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to submit training");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axiosInstance.patch(API_PATHS.TASK_STATUS(id), { status });
      await fetchTasks();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update status");
    }
  };

  const handleSubmitTask = async (taskId) => {
    if (!window.confirm(t("hr.traineeTasks.submitConfirm"))) {
      return;
    }

    try {
      setSubmitting(taskId);
      const d = submissionData[taskId] || {};
      const payload = { repoUrl: d.repoUrl || "", codeSnippet: d.code || d.codeSnippet || "", notes: d.notes || "" };
      const { data } = await axiosInstance.post(API_PATHS.TRAINEE_SUBMIT_TASK(taskId), payload);
      const task = data.task || {};
      const points = (task.earnedPoints !== undefined ? task.earnedPoints : data.points) ?? 0;
      const breakdown = task.scoringBreakdown || data.breakdown || { basePoints: points, earlyBonus: 0, latePenalty: 0 };
      const timing = breakdown.earlyBonus > 0 ? t("hr.traineeTasks.early") : breakdown.latePenalty > 0 ? t("hr.traineeTasks.late") : t("hr.traineeTasks.onTime");
      alert(
        `${t("hr.traineeTasks.taskSubmitted")}\n\n${t("hr.traineeTasks.points")}: ${points}\n` +
        `${t("hr.traineeTasks.base")}: ${breakdown.basePoints} | ${t("hr.traineeTasks.earlyBonus")}: +${breakdown.earlyBonus} | ${t("hr.traineeTasks.latePenalty")}: -${breakdown.latePenalty}\n` +
        `${t("hr.traineeTasks.timing")}: ${timing}`
      );
      // Close the form and refresh tasks
      setOpenForms(prev => ({ ...prev, [taskId]: false }));
      await fetchTasks();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to submit task");
    } finally {
      setSubmitting(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      reviewed: "bg-green-100 text-green-800 border-green-200",
      submitted: "bg-purple-100 text-purple-800 border-purple-200",
    };
    return badges[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <Sidebar links={sidebarLinks} />
      <main className="lg:pl-64 min-h-screen w-full overflow-x-auto rtl:lg:pl-0 rtl:lg:pr-64 animate-fadeIn">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slideUp">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600 text-start rtl:text-right">{t("hr.traineeTasks.title")}</h1>
              <p className="text-sm text-slate-600 font-medium mt-1 text-start rtl:text-right">{t("hr.traineeTasks.subtitle")}</p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0 rtl:flex-row-reverse">
              <div className="card-premium px-4 sm:px-6 py-3 whitespace-nowrap animate-fadeIn" style={{ animationDelay: '100ms' }}>
                <p className="text-sm text-slate-600 font-medium text-start rtl:text-right">{t("hr.traineeTasks.progress")}</p>
                <p className="text-xl sm:text-2xl font-bold text-indigo-600 text-start rtl:text-right">{progress.completed}/{progress.total}</p>
              </div>
            </div>
          </div>

          {/* Paused/Frozen Warning */}
          {/* Paused/Frozen/Submitted/Expired Notice */}
          {locked && (
            <div className="rounded-lg border-l-4 rtl:border-l-0 rtl:border-r-4 p-4 bg-purple-50 border-purple-400 mb-4">
              <p className="text-sm text-purple-800 font-semibold text-start rtl:text-right">{traineeStatus.trainingStatus === 'submitted' ? (t("hr.traineeTasks.delivered", "Delivered")) : (t("hr.traineeTasks.expired", "Expired"))}</p>
              <p className="text-sm text-purple-700 mt-1 text-start rtl:text-right">{t("hr.traineeTasks.trainingSubmittedMsg", "Your submission is complete. You will receive an email if we need anything else or if you are hired.")}</p>
            </div>
          )}

          {/* Paused/Frozen Warning */}
          {traineeStatus && (traineeStatus.status === 'paused' || traineeStatus.status === 'frozen' || traineeStatus.status === 'cancelled' || traineeStatus.status === 'withdrawn') && (
            <div className={`rounded-lg border-l-4 rtl:border-l-0 rtl:border-r-4 p-4 ${traineeStatus.status === 'paused' ? 'bg-yellow-50 border-yellow-400' :
              traineeStatus.status === 'frozen' ? 'bg-orange-50 border-orange-400' :
                'bg-red-50 border-red-400'
              }`}>
              <div className="flex items-start rtl:flex-row-reverse">
                <svg className="w-6 h-6 mr-3 rtl:mr-0 rtl:ml-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className={`text-sm font-semibold text-start rtl:text-right ${traineeStatus.status === 'paused' ? 'text-yellow-800' :
                    traineeStatus.status === 'frozen' ? 'text-orange-800' :
                      'text-red-800'
                    }`}>
                    {traineeStatus.status === 'paused' ? t("hr.traineeTasks.trainingPaused") :
                      traineeStatus.status === 'frozen' ? t("hr.traineeTasks.trainingFrozen") :
                        traineeStatus.status === 'cancelled' ? t("hr.traineeTasks.trainingCancelled") :
                          t("hr.traineeTasks.withdrawalPending")}
                  </h3>
                  <p className={`text-sm mt-1 text-start rtl:text-right ${traineeStatus.status === 'paused' ? 'text-yellow-700' :
                    traineeStatus.status === 'frozen' ? 'text-orange-700' :
                      'text-red-700'
                    }`}>
                    {traineeStatus.status === 'paused' && traineeStatus.pausedReason && `${t("hr.traineeTasks.reason")}: ${traineeStatus.pausedReason}`}
                    {traineeStatus.status === 'frozen' && traineeStatus.frozenReason && `${t("hr.traineeTasks.reason")}: ${traineeStatus.frozenReason}`}
                    {traineeStatus.status === 'cancelled' && traineeStatus.cancelReason && `${t("hr.traineeTasks.reason")}: ${traineeStatus.cancelReason}`}
                    {traineeStatus.status === 'withdrawn' && traineeStatus.withdrawReason && `${t("hr.traineeTasks.reason")}: ${traineeStatus.withdrawReason}`}
                    {!traineeStatus.pausedReason && !traineeStatus.frozenReason && !traineeStatus.cancelReason && !traineeStatus.withdrawReason && t("hr.traineeTasks.noReasonProvided")}
                  </p>
                  <p className={`text-sm mt-2 font-medium ${traineeStatus.status === 'paused' ? 'text-yellow-800' :
                    traineeStatus.status === 'frozen' ? 'text-orange-800' :
                      'text-red-800'
                    }`}>
                    {t("hr.traineeTasks.cannotSubmitUntilResume")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center">
              <p className="text-gray-500 text-start rtl:text-right">{t("hr.traineeTasks.noTasksAssigned")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map((task, idx) => (
                <div key={task._id} className="card-premium animate-fadeIn hover:-translate-y-1" style={{ animationDelay: `${150 + idx * 50}ms` }}>
                  <div className="p-6">
                    {/* Title & Status */}
                    <div className="flex items-start justify-between gap-3 mb-3 rtl:flex-row-reverse">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1 min-w-0 text-truncate-2 text-start rtl:text-right" title={task.title}>{task.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border flex-shrink-0 whitespace-nowrap ${getStatusBadge(task.status)}`}>
                        {task.status}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 break-words text-start rtl:text-right">{task.description}</p>

                    {/* Points */}
                    <div className="flex items-center justify-between mb-4">
                      {task.earnedPoints !== undefined && task.earnedPoints !== null ? (
                        <div className="text-sm">
                          <span className="text-gray-600">{t("hr.traineeTasks.earned")}: </span>
                          <span className="font-bold text-green-600">{task.earnedPoints} pts</span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">{t("hr.traineeTasks.notSubmitted")}</div>
                      )}
                    </div>

                    {/* Due Date */}
                    {task.dueAt && (
                      <div className="mb-4 text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{t("hr.traineeTasks.due")}: {new Date(task.dueAt).toLocaleDateString()} {new Date(task.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {!locked && task.status !== "completed" && task.status !== "reviewed" && task.status !== "submitted" ? (
                        <>
                          <button
                            onClick={() => updateStatus(task._id, "in-progress")}
                            disabled={locked || (traineeStatus && ['paused', 'frozen', 'cancelled', 'withdrawn'].includes(traineeStatus.status))}
                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-indigo-700 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 border-2 border-indigo-200 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {t("hr.traineeTasks.start")}
                          </button>
                          <button
                            onClick={() => {
                              const isOpening = !openForms[task._id];
                              setOpenForms(prev => ({ ...prev, [task._id]: !prev[task._id] }));
                              if (isOpening && task.submission) {
                                setSubmissionData(prev => ({
                                  ...prev,
                                  [task._id]: {
                                    repoUrl: task.submission.repoUrl || "",
                                    code: task.submission.codeSnippet || "",
                                    codeSnippet: task.submission.codeSnippet || "",
                                    notes: task.submission.notes || "",
                                  }
                                }));
                              }
                            }}
                            disabled={locked || (traineeStatus && ['paused', 'frozen', 'cancelled', 'withdrawn'].includes(traineeStatus.status))}
                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {openForms[task._id] ? t("hr.traineeTasks.hideForm") : t("hr.traineeTasks.submit")}
                          </button>
                          {task.aiEvaluation && (
                            <button
                              onClick={() => setOpenFeedback(prev => ({ ...prev, [task._id]: !prev[task._id] }))}
                              className="flex-1 px-4 py-2.5 text-sm font-semibold text-purple-700 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-2 border-purple-200 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                              {openFeedback[task._id] ? t("hr.traineeTasks.hideFeedback") : t("hr.traineeTasks.feedback")}
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {task.status === "completed" || task.status === "reviewed" ? (
                            <button
                              onClick={() => updateStatus(task._id, "pending")}
                              disabled={locked || (traineeStatus && ['paused', 'frozen', 'cancelled', 'withdrawn'].includes(traineeStatus.status))}
                              className="w-full px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {t("hr.traineeTasks.reopen")}
                            </button>
                          ) : (
                            <div className="w-full px-4 py-2.5 text-xs text-purple-700 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl text-center font-semibold">
                              {t("hr.traineeTasks.awaitingHRReview")}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {/* AI Feedback (minimal, expandable) */}
                    {task.aiEvaluation && openFeedback[task._id] && (
                      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-sm text-gray-800 text-start rtl:text-right"><span className="font-semibold">{t("hr.traineeTasks.feedback")}:</span> {task.aiEvaluation.shortFeedback || t("hr.traineeTasks.noFeedback")}</p>
                        {Array.isArray(task.aiEvaluation.breakdown) && task.aiEvaluation.breakdown.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-600 mb-1 text-start rtl:text-right">{t("hr.traineeTasks.breakdown")}:</p>
                            <ul className="text-sm space-y-1">
                              {task.aiEvaluation.breakdown.map((b, i) => (
                                <li key={i} className="flex justify-between rtl:flex-row-reverse">
                                  <span className="text-gray-700">{b.criterion}</span>
                                  <span className="font-medium text-gray-900">{b.score}/{b.maxPoints}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Submission Form */}
                    {!locked && openForms[task._id] && task.status !== "completed" && (
                      <div className="mt-4 border-t pt-4 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1 text-start rtl:text-right">{t("hr.traineeTasks.repositoryURL")}</label>
                          <input
                            type="url"
                            placeholder={t("hr.traineeTasks.repositoryPlaceholder")}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-start rtl:text-right"
                            value={submissionData[task._id]?.repoUrl || ""}
                            onChange={(e) => setSubmissionData(prev => ({ ...prev, [task._id]: { ...(prev[task._id] || {}), repoUrl: e.target.value } }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1 text-start rtl:text-right">{t("hr.traineeTasks.keyCodeSnippet")}</label>
                          <textarea
                            rows={4}
                            placeholder={t("hr.traineeTasks.codeSnippetPlaceholder")}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-start rtl:text-right"
                            value={submissionData[task._id]?.code || submissionData[task._id]?.codeSnippet || ""}
                            onChange={(e) => setSubmissionData(prev => ({ ...prev, [task._id]: { ...(prev[task._id] || {}), code: e.target.value, codeSnippet: e.target.value } }))}
                          />
                          <p className="text-xs text-gray-500 mt-1 text-start rtl:text-right">{t("hr.traineeTasks.codeSnippetHint")}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1 text-start rtl:text-right">{t("hr.traineeTasks.notes")}</label>
                          <textarea
                            rows={2}
                            placeholder={t("hr.traineeTasks.notesPlaceholder")}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-start rtl:text-right"
                            value={submissionData[task._id]?.notes || ""}
                            onChange={(e) => setSubmissionData(prev => ({ ...prev, [task._id]: { ...(prev[task._id] || {}), notes: e.target.value } }))}
                          />
                        </div>
                        <div className="flex justify-end rtl:justify-start">
                          <button
                            onClick={() => handleSubmitTask(task._id)}
                            disabled={submitting === task._id}
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {submitting === task._id ? t("hr.traineeTasks.submitting") : t("hr.traineeTasks.validateAndSubmit")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Minimal AI feedback view */}
          {/* Show shortFeedback and simple breakdown toggle inside each card (already retained by task object) */}
        </div>
      </main>
      {/* Finish Training CTA */}
      {!locked && (
        <div className="fixed bottom-6 right-6 rtl:right-auto rtl:left-6">
          <button onClick={finishTraining} className="px-5 py-3 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg font-semibold">
            {t("hr.traineeTasks.finishTraining", "Finish Training")}
          </button>
        </div>
      )}
      {user && <ChatButton currentUser={user} />}
    </div>
  );
};

export default TraineeTasks;
