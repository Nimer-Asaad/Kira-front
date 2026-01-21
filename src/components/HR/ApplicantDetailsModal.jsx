import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const stageOptions = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"];

const ApplicantDetailsModal = ({ isOpen, applicant, onClose, onUpdate, onDelete, onUploadCv, onGenerateAiSummary, viewOnly = false }) => {
  const [stage, setStage] = useState(applicant?.stage || "Applied");
  const [notes, setNotes] = useState(applicant?.notes || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    setStage(applicant?.stage || "Applied");
    setNotes(applicant?.notes || "");
  }, [applicant]);

  if (!isOpen || !applicant) return null;

  const handleSave = async () => {
    if (!onUpdate) return;
    setSaving(true);
    try {
      const updated = await onUpdate(applicant._id, { stage, notes });

      // Close the modal after operations
      if (onClose) onClose();

      // Navigate to trainees page when hired
      if (stage === "Hired") {
        try {
          window.location.href = "/hr/trainees";
        } catch {}
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed");
      return;
    }
    setUploading(true);
    try {
      await onUploadCv(applicant._id, file);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!onGenerateAiSummary) return;
    setAiLoading(true);
    try {
      await onGenerateAiSummary(applicant._id);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Applicant Details</h3>
            <p className="text-sm text-gray-500">{applicant.email}</p>
          </div>
          <div className="flex items-center gap-3">
            {!viewOnly && (
              <button
                onClick={() => onDelete && onDelete(applicant._id)}
                className="px-3 py-2 text-sm font-semibold text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Full Name</p>
              <p className="text-base font-semibold text-gray-900">{applicant.fullName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Position</p>
              <p className="text-base font-semibold text-gray-900">{applicant.position || "—"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                {stageOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Created</p>
              <p className="text-base font-semibold text-gray-900">{new Date(applicant.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => !viewOnly && setNotes(e.target.value)}
              readOnly={viewOnly}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
              placeholder="Add interview notes, feedback, etc."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                CV
              </div>
              {(() => {
                const origin = API_BASE_URL.replace(/\/api$/, "");
                const rawUrl = applicant.cv?.url;
                const cvLink = rawUrl
                  ? (rawUrl.startsWith("http") ? rawUrl : `${origin}${rawUrl}`)
                  : null;
                return cvLink ? (
                <a
                  href={cvLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 text-sm font-semibold hover:underline"
                >
                  View CV
                </a>
                ) : (
                  <span className="text-xs text-gray-500">No CV uploaded</span>
                );
              })()}
            </div>

            <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm font-semibold w-fit disabled:opacity-50 disabled:cursor-not-allowed" style={viewOnly ? {opacity: 0.5, cursor: 'not-allowed'} : {}}>
              {uploading ? "Uploading..." : "Upload PDF"}
              <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} disabled={viewOnly} />
            </label>
          </div>

          {/* AI Summary Section */}
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z" />
                </svg>
                AI Summary
              </div>
              <button
                onClick={handleGenerateSummary}
                disabled={aiLoading || !applicant.cv?.filename}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {aiLoading && (
                  <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {aiLoading ? "Analyzing CV..." : "Generate AI Summary"}
              </button>
            </div>

            {applicant.aiSummary ? (
              <div className="border border-gray-200 rounded-lg p-3 text-sm text-gray-800 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Candidate Level</p>
                    <p className="font-semibold">{applicant.aiSummary.candidate_level || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Years Experience</p>
                    <p className="font-semibold">{applicant.aiSummary.years_experience_estimate ?? "—"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500">Top Skills</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(applicant.aiSummary.top_skills || []).map((s, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-100">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Strengths</p>
                    <p className="mt-1">{Array.isArray(applicant.aiSummary.strengths) ? applicant.aiSummary.strengths.join(", ") : (applicant.aiSummary.strengths || "—")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Risks or Gaps</p>
                    <p className="mt-1">{Array.isArray(applicant.aiSummary.risks_or_gaps) ? applicant.aiSummary.risks_or_gaps.join(", ") : (applicant.aiSummary.risks_or_gaps || "—")}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-gray-500">Overall Score</div>
                  <div className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs border border-green-100">
                    {applicant.aiSummary.overall_score ?? "—"}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-gray-500">Short Summary</p>
                  <p className="mt-1">{applicant.aiSummary.short_summary || "—"}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">No AI summary yet.</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Close</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicantDetailsModal;
