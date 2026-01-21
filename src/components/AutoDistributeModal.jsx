import { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const AutoDistributeModal = ({ isOpen, onClose, onDistributeSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("pending");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [cvData, setCvData] = useState(null);
  const [loadingCV, setLoadingCV] = useState(false);
  const [cvError, setCvError] = useState("");

  // Fetch CV analysis when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCVAnalysis();
    }
  }, [isOpen]);

  const fetchCVAnalysis = async () => {
    try {
      setLoadingCV(true);
      setCvError("");
      setCvData(null);

      // Call endpoint to analyze CVs and get recommended tasks
      const response = await axiosInstance.post(API_PATHS.TASK_AUTO_DISTRIBUTE, {
        action: "analyze", // Signal to backend to return CV analysis without actually distributing
        status: status,
      });

      if (response.data.extractedSkills || response.data.recommendedTasks) {
        setCvData({
          extractedSkills: response.data.extractedSkills || [],
          recommendedTasks: response.data.recommendedTasks || [],
        });
      } else {
        setCvError(
          "No CV data available. Please ensure trainees have uploaded their CVs in their profiles."
        );
      }
    } catch (err) {
      console.error("CV analysis error:", err);
      setCvError("Unable to analyze CVs at this time. Proceeding with standard distribution.");
    } finally {
      setLoadingCV(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setResult(null);

      // Call endpoint with actual distribution request
      const response = await axiosInstance.post(API_PATHS.TASK_AUTO_DISTRIBUTE, {
        status: status,
        useCVMatching: cvData ? true : false, // Use CV-based matching if available
      });

      setResult(response.data);

      // Call success callback
      if (onDistributeSuccess) {
        onDistributeSuccess();
      }
    } catch (err) {
      console.error("Auto-distribute error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to auto-distribute tasks"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError("");
    setStatus("pending");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">Auto-Distribute Tasks</h2>
        </div>

        {/* Body */}
        <div className="p-6">
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Status Filter
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending Only</option>
                  <option value="in-progress">In Progress Only</option>
                  <option value="">All Unassigned</option>
                </select>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>How it works:</strong> The system will intelligently assign unassigned
                  tasks to employees based on:
                </p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4 list-disc">
                  <li>Specialization match (50 points)</li>
                  <li>Skill match and level (up to 10 points per skill)</li>
                  <li>Current workload (-12 per active task)</li>
                  <li>Maximum concurrent task limit</li>
                </ul>
              </div>

              {/* CV Analysis Section */}
              {loadingCV && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                    <p className="text-sm text-purple-900">Analyzing trainee CVs and skills...</p>
                  </div>
                </div>
              )}

              {cvError && !loadingCV && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-900 font-medium mb-2">About CV</p>
                  <p className="text-sm text-yellow-800 mb-3">{cvError}</p>
                  <a
                    href="#"
                    className="text-sm text-yellow-900 underline hover:text-yellow-700"
                  >
                    📄 Upload CV in user profile
                  </a>
                </div>
              )}

              {cvData && !loadingCV && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-purple-900 font-semibold">📊 About CV-Based Distribution</p>

                  {/* Extracted Skills */}
                  {cvData.extractedSkills && cvData.extractedSkills.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-purple-900 mb-2">Top Extracted Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {cvData.extractedSkills.slice(0, 5).map((skill, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center gap-1 bg-white border border-purple-300 rounded-full px-3 py-1"
                          >
                            <span className="text-xs font-medium text-purple-900">
                              {skill.name || skill}
                            </span>
                            {skill.proficiency && (
                              <span className="text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                                {skill.proficiency}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Tasks */}
                  {cvData.recommendedTasks && cvData.recommendedTasks.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-purple-900 mb-2">Recommended Tasks:</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {cvData.recommendedTasks.slice(0, 3).map((task, index) => (
                          <div key={index} className="bg-white border border-purple-200 rounded p-2">
                            <div className="flex justify-between items-start gap-2">
                              <p className="text-xs font-medium text-gray-900">{task.title}</p>
                              {task.difficulty && (
                                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                  task.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                  task.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {task.difficulty}
                                </span>
                              )}
                            </div>
                            {task.reason && (
                              <p className="text-xs text-gray-600 mt-1">✓ {task.reason}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Distributing..." : "Auto Distribute"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {result.assignedCount}
                  </div>
                  <div className="text-sm text-green-800">Tasks Assigned</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {result.unassignedCount}
                  </div>
                  <div className="text-sm text-orange-800">Not Assigned</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {result.totalTasks || 0}
                  </div>
                  <div className="text-sm text-blue-800">Total Tasks</div>
                </div>
              </div>

              {/* Assignments Table */}
              {result.assignments && result.assignments.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Assignment Details</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {result.assignments.map((assignment, index) => (
                      <div key={index} className="px-4 py-3">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {assignment.taskTitle}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              👤 {assignment.employeeName}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                          {assignment.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleClose}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close & Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoDistributeModal;
