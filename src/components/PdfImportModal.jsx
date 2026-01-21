import { useState, useRef } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const PdfImportModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === "application/pdf" || selectedFile.name.endsWith(".pdf")) {
        setFile(selectedFile);
        setError("");
      } else {
        setError("Please select a valid PDF file");
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await axiosInstance.post(API_PATHS.TASK_IMPORT_PDF, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const summary = {
        createdCount: response.data?.createdCount || 0,
        skippedCount: response.data?.skippedCount || 0,
        fixedCount: response.data?.fixedCount || 0,
        errors: response.data?.errors || [],
      };

      // Reset form
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Close modal and refresh
      if (onImportSuccess) {
        onImportSuccess(summary);
      }
      onClose();
    } catch (err) {
      console.error("PDF import error:", err);
      setError(err.response?.data?.message || err.message || "Failed to import PDF");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Import Tasks from PDF</h2>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select PDF File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            {file && (
              <p className="mt-2 text-sm text-green-600">
                ✓ {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>PDF Format:</strong> Tasks should be structured with:
            </p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4 list-disc">
              <li>Task Title</li>
              <li>Description</li>
              <li>Priority (Low/Medium/High)</li>
              <li>Due Date (YYYY-MM-DD)</li>
              <li>Checklist items (optional)</li>
              <li>Attachments (optional)</li>
            </ul>
          </div>

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
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Importing..." : "Import"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PdfImportModal;
