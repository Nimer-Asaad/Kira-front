import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const CVSection = () => {
  const { t } = useTranslation();
  const [cvStatus, setCvStatus] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [expandedSkills, setExpandedSkills] = useState(false);

  // Fetch CV status on mount
  useEffect(() => {
    fetchCVStatus();
  }, []);

  const fetchCVStatus = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(API_PATHS.USER_CV_STATUS);
      setCvStatus(data.status);
      setParsedData(data.parsedData);
    } catch (error) {
      console.error("Error fetching CV status:", error);
      // Not an error if CV doesn't exist yet
      setCvStatus(null);
      setParsedData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file only");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("cvFile", file);

      const { data } = await axiosInstance.put(API_PATHS.USER_CV, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update CV status and parsed data
      setCvStatus(data.status);
      setParsedData(data.parsedData);
      alert("CV uploaded and parsed successfully!");
    } catch (error) {
      console.error("Error uploading CV:", error);
      const message = error?.response?.data?.message || "Failed to upload CV";
      alert(message);
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 lg:p-8">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t("pages.profile.cvManagement")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t("pages.profile.uploadCV")}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* CV Status */}
        {cvStatus ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-800 dark:text-green-200">{t("pages.profile.uploadedCV")}</p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  {t("pages.profile.lastUpdated")}: {new Date(cvStatus.lastUpdated).toLocaleDateString()} at {new Date(cvStatus.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                {cvStatus.cvUrl && (
                  <a
                    href={cvStatus.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 dark:text-green-400 hover:underline mt-2 inline-block"
                  >
                    {t("pages.profile.download")} →
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">{t("pages.profile.noCVUploaded")}</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">{t("pages.profile.uploadNew")}</p>
              </div>
            </div>
          </div>
        )}

        {/* CV Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">{t("pages.profile.uploadCV")}</label>
          <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleCVUpload}
              disabled={uploading}
              className="hidden"
              id="cv-upload-input"
            />
            <label htmlFor="cv-upload-input" className="cursor-pointer">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                {uploading ? "Uploading and parsing..." : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">PDF files only, max 10MB</p>
              {uploading && (
                <div className="mt-3 flex justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Parsed Data */}
        {parsedData && Object.keys(parsedData).length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Extracted Profile Information</h3>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded">
                {Object.keys(parsedData).length} fields
              </span>
            </div>

            {/* Skills Section */}
            {parsedData.extractedSkills && parsedData.extractedSkills.length > 0 && (
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <button
                  onClick={() => setExpandedSkills(!expandedSkills)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Skills</h4>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${expandedSkills ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>

                {expandedSkills && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {parsedData.extractedSkills.map((skill, idx) => (
                      <div key={idx} className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-full px-3 py-1">
                        <span className="text-sm text-gray-900 dark:text-slate-100">{skill.name || skill}</span>
                        {skill.proficiency && (
                          <span className="text-xs text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                            {skill.proficiency}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Other Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(parsedData).map(([key, value]) => {
                // Skip skills as we showed them separately
                if (key === "extractedSkills" || !value) return null;

                return (
                  <div key={key} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide mb-1">{key.replace(/([A-Z])/g, " $1")}</p>
                    <p className="text-sm text-gray-900 dark:text-slate-100 line-clamp-3">{String(value)}</p>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-gray-500 dark:text-slate-400 italic">
              These fields are extracted from your CV and used for task recommendations. They are read-only and automatically updated when you re-upload your CV.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CVSection;
