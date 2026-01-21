import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

export default function TaskListModal({ trainee, isOpen, onClose }) {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({}); // kept for future but inputs are read-only in HR
  const [aiStatus, setAiStatus] = useState({ configured: false, model: "" });
  const [rescoreLoading, setRescoreLoading] = useState({}); // { [taskId]: true }
  const [editingPoints, setEditingPoints] = useState({}); // { [taskId]: newPoints }
  const [savingPoints, setSavingPoints] = useState({}); // { [taskId]: true }
  const traineeId = trainee?._id;
  const canEvaluate = trainee && (trainee.trainingStatus === 'submitted' || trainee.trainingStatus === 'expired');
  const [hrScore, setHrScore] = useState(trainee?.hrFinalScore ?? "");
  const [hrNotes, setHrNotes] = useState(trainee?.hrNotes ?? "");
  const [savingEval, setSavingEval] = useState(false);

  useEffect(() => {
    if (!isOpen || !traineeId) return;
    fetchTasks();
    fetchAiStatus();
  }, [isOpen, traineeId]);

  const fetchAiStatus = async () => {
    try {
      const { data } = await axiosInstance.get(API_PATHS.HR_AI_STATUS);
      setAiStatus(data || { configured: false, model: "" });
    } catch {
      setAiStatus({ configured: false, model: "" });
    }
  };

  const saveEvaluation = async () => {
    if (!canEvaluate) return;
    const score = Number(hrScore);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      alert("Score must be between 0 and 100");
      return;
    }
    try {
      setSavingEval(true);
      await axiosInstance.put(API_PATHS.HR_TRAINEE_EVALUATION(traineeId), { hrFinalScore: score, hrNotes });
      alert("Evaluation saved");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to save evaluation");
    } finally {
      setSavingEval(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await axiosInstance.get(API_PATHS.HR_TRAINEE_TASKS(traineeId));
      setTasks(data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const parseNotes = (t) => {
    try {
      return JSON.parse(t.evaluationNotes || "{}");
    } catch {
      return {};
    }
  };

  const rescore = async (taskId) => {
    setRescoreLoading((prev) => ({ ...prev, [taskId]: true }));
    try {
      // Prefer new endpoint; fallback to old if needed
      let resp;
      try {
        resp = await axiosInstance.post(API_PATHS.HR_TRAINING_TASK_RESCORE(taskId));
      } catch (err) {
        if (err?.response?.status === 404) {
          resp = await axiosInstance.post(API_PATHS.HR_TRAINEE_TASK_RESCORE(traineeId, taskId));
        } else {
          throw err;
        }
      }
      const { data } = resp;
      const updatedTask = data?.task;
      const pts = (updatedTask && typeof updatedTask.earnedPoints === 'number') ? updatedTask.earnedPoints : data?.points;
      // Optimistically update the local task so UI reflects immediately
      if (updatedTask?._id) {
        setTasks((prev) => prev.map((t) => t._id === updatedTask._id ? { ...t, earnedPoints: updatedTask.earnedPoints, status: updatedTask.status } : t));
      }
      alert(`Rescored: ${pts || 0} pts`);
      // Still refetch to pull any additional notes/fields
      await fetchTasks();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to rescore");
    } finally {
      setRescoreLoading((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  const saveEditedPoints = async (taskId) => {
    const newPoints = editingPoints[taskId];
    if (newPoints === undefined || newPoints === null) {
      alert("Please enter points");
      return;
    }

    setSavingPoints((prev) => ({ ...prev, [taskId]: true }));
    try {
      const { data } = await axiosInstance.patch(
        API_PATHS.HR_TRAINING_TASK_UPDATE_POINTS(taskId),
        { earnedPoints: parseInt(newPoints, 10) }
      );

      const updatedTask = data?.task;
      if (updatedTask?._id) {
        setTasks((prev) => prev.map((t) => t._id === updatedTask._id ? { ...t, earnedPoints: updatedTask.earnedPoints } : t));
        setEditingPoints((prev) => ({ ...prev, [taskId]: undefined }));
        alert(`Points updated: ${updatedTask.earnedPoints} pts`);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update points");
    } finally {
      setSavingPoints((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] overflow-hidden modal-enter">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{t('hr.evaluation.trainingTasks')} — {trainee?.applicantId?.fullName || "Trainee"}</h3>
            <p className="text-xs text-gray-500">{t('hr.evaluation.viewAiFeedback')}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs border ${aiStatus.configured ? "bg-green-50 text-green-700 border-green-100" : "bg-yellow-50 text-yellow-700 border-yellow-100"}`}>
              {t('hr.evaluation.aiStatus')}: {aiStatus.configured ? `${t('hr.evaluation.on')} (${aiStatus.model})` : t('hr.evaluation.off')}
            </span>
            <button className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200" onClick={onClose}>{t('common.close')}</button>
          </div>
        </div>
        <div className="p-4 overflow-y-auto">
          {/* Evaluation Section (HR) */}
          <div className="mb-4 border rounded-lg p-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{t('hr.evaluation.trainingStatus')}:</span>
                <span className={`px-2 py-0.5 text-xs rounded-full border ${canEvaluate ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                  {trainee?.trainingStatus || 'active'}
                </span>
              </div>
            </div>
            {canEvaluate ? (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">{t('hr.evaluation.score')}</label>
                    <input type="number" min="0" max="100" value={hrScore}
                      onChange={(e) => setHrScore(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">{t('hr.evaluation.notes')}</label>
                    <input type="text" value={hrNotes} onChange={(e) => setHrNotes(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder={t('hr.evaluation.notes')} />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={saveEvaluation}
                    disabled={savingEval}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-60"
                  >
                    {savingEval ? t('common.loading') : t('hr.evaluation.save')}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">{t('hr.evaluation.availableAfterSubmit')}</p>
            )}
          </div>
          {loading ? (
            <div className="py-10 text-center">{t("common.loading")}</div>
          ) : error ? (
            <div className="text-red-600 text-center">{error}</div>
          ) : tasks.length === 0 ? (
            <div className="text-gray-500 text-center">{t('hr.evaluation.noTasks')}</div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => {
                const notes = parseNotes(task);
                const hasSubmission = !!(task.submission && (task.submission.repoUrl || task.submission.codeSnippet || task.submission.notes));
                return (
                  <div key={task._id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{task.title}</h4>
                        <p className="text-xs text-gray-500">{t('tasks.status')}: {task.status} · {t('common.target') || 'Target'}: {task.maxPoints || 0} · {t('hr.evaluation.points')}: {task.earnedPoints || 0}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs border bg-blue-50 text-blue-700 border-blue-100">{task.type}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{task.description}</p>

                    {/* AI Notes */}
                    <div className="mt-3 bg-gray-50 border border-gray-200 rounded p-4">
                      <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">{t('hr.evaluation.aiTechnicalAssessment')}</p>
                        {task.aiEvaluation?.deductionJustification && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-bold shadow-sm">{t('hr.evaluation.analysisCompleted')}</span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-gray-800 mb-4 bg-white/50 p-2 rounded border border-gray-100 italic">
                        "{notes.aiFeedback || task.aiEvaluation?.shortFeedback}"
                      </p>

                      {task.aiEvaluation?.deductionJustification || notes.deductionJustification ? (
                        <div className="mb-5 bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm">
                          <p className="text-xs font-bold text-red-800 mb-2.5 flex items-center gap-2 uppercase tracking-wide">
                            <span>⚠️</span> {t('hr.evaluation.deductionAnalysis')}:
                          </p>
                          <p className="text-sm font-medium text-red-900 leading-relaxed whitespace-pre-wrap">
                            {task.aiEvaluation?.deductionJustification || notes.deductionJustification}
                          </p>
                        </div>
                      ) : null}

                      {/* Criteria Breakdown */}
                      {Array.isArray(task.aiEvaluation?.breakdown) && task.aiEvaluation.breakdown.length > 0 && (
                        <div className="mb-5">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">{t('hr.evaluation.criteriaPerformance')}:</p>
                          <div className="grid grid-cols-1 gap-2.5">
                            {task.aiEvaluation.breakdown.map((item, idx) => (
                              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-sm font-bold text-gray-800">{item.criterion}</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-sm font-mono font-bold ${item.score === item.maxPoints ? 'text-green-600' : 'text-amber-600'}`}>
                                      {item.score}/{item.maxPoints}
                                    </span>
                                    {item.score < item.maxPoints && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>}
                                  </div>
                                </div>
                                {item.reasoning && (
                                  <p className="text-[11px] text-gray-600 leading-relaxed font-medium italic border-t border-gray-50 pt-2 mt-1.5 pr-2">
                                    • {item.reasoning}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {Array.isArray(notes.aiChecks) && notes.aiChecks.length > 0 && (
                        <div className="space-y-3 mt-4 pt-4 border-t border-indigo-100">
                          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{t('hr.evaluation.verificationChecklist')}:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                            {notes.aiChecks.map((c, i) => (
                              <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${c.pass ? 'bg-green-50/40 border-green-100' : 'bg-red-50/40 border-red-100'}`}>
                                <span className={`flex-shrink-0 mt-0.5 font-bold ${c.pass ? "text-green-600" : "text-red-600"}`}>
                                  {c.pass ? "✓" : "✗"}
                                </span>
                                <div className="min-w-0">
                                  <p className={`text-xs font-bold ${c.pass ? "text-green-900" : "text-red-900"}`}>{c.name}</p>
                                  <p className={`text-[10px] leading-snug mt-0.5 ${c.pass ? "text-green-700" : "text-red-700"}`}>{c.details}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Read-only submission view */}
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{t('hr.evaluation.repoUrl')}</label>
                        <input
                          type="url"
                          placeholder="https://github.com/user/repo"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50"
                          value={(task.submission?.repoUrl || "")}
                          readOnly
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{t('hr.evaluation.keyCodeSnippet')}</label>
                        <textarea
                          rows={3}
                          placeholder="No submission yet"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50"
                          value={(task.submission?.codeSnippet || "")}
                          readOnly
                          disabled
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">{t('hr.evaluation.submissionNotes')}</label>
                        <textarea
                          rows={2}
                          placeholder="No submission yet"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 resize-none"
                          value={(task.submission?.notes || "")}
                          readOnly
                          disabled
                        />
                        {!hasSubmission && (
                          <p className="text-xs text-gray-500 mt-2 italic">{t('hr.evaluation.waitingForSubmission')}</p>
                        )}
                      </div>
                    </div>

                    {/* Edit Points Section */}
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">{t('hr.evaluation.points')}:</span>
                        <span className="text-lg font-bold text-amber-700">{task.earnedPoints || 0} / {task.maxPoints || 0}</span>
                      </div>
                      {editingPoints[task._id] !== undefined ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="number"
                            min="0"
                            max={task.maxPoints || 100}
                            value={editingPoints[task._id]}
                            onChange={(e) => setEditingPoints((prev) => ({ ...prev, [task._id]: e.target.value }))}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                            placeholder={t('hr.evaluation.enterNewPoints')}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEditedPoints(task._id)}
                              disabled={savingPoints[task._id]}
                              className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold transition-colors"
                            >
                              {savingPoints[task._id] ? t('common.saving') : t('common.save')}
                            </button>
                            <button
                              onClick={() => setEditingPoints((prev) => ({ ...prev, [task._id]: undefined }))}
                              className="flex-1 sm:flex-none px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                            >
                              {t('common.cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingPoints((prev) => ({ ...prev, [task._id]: task.earnedPoints || 0 }))}
                          className="text-sm text-amber-700 hover:text-amber-800 font-bold underline decoration-2 underline-offset-4"
                        >
                          ✏️ {t('hr.evaluation.editPoints')}
                        </button>
                      )}
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        className={`px-3 py-2 text-sm rounded flex items-center gap-2 ${hasSubmission ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                        onClick={() => hasSubmission && rescore(task._id)}
                        disabled={!hasSubmission || rescoreLoading[task._id]}
                      >
                        {rescoreLoading[task._id] ? (
                          <>
                            <span className="animate-spin inline-block w-4 h-4 border-b-2 border-white rounded-full" />
                            {t("common.loading")}
                          </>
                        ) : t('hr.evaluation.aiRescore')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
