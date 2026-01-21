import { useState } from "react";
import moment from "moment";
import toast from "react-hot-toast";

const EmailDetails = ({ email, onSummarize, onDelete, onClose }) => {
  const [summarizing, setSummarizing] = useState(false);
  const [activeTab, setActiveTab] = useState("body");

  if (!email) {
    return (
      <div className="card-premium p-8 text-center">
        <p className="text-slate-500">Select an email to view details</p>
      </div>
    );
  }

  const handleSummarize = async () => {
    setSummarizing(true);
    try {
      await onSummarize(email._id);
      toast.success("Email summarized successfully!");
    } catch (error) {
      toast.error("Failed to summarize email");
    } finally {
      setSummarizing(false);
    }
  };

  const handleCopySummary = () => {
    if (email.aiSummary) {
      const text = `${email.aiSummary}\n\n${email.aiBullets?.map((b) => `• ${b}`).join("\n") || ""}`;
      navigator.clipboard.writeText(text);
      toast.success("Summary copied to clipboard!");
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      Work: "bg-blue-100 text-blue-800",
      Bills: "bg-red-100 text-red-800",
      Social: "bg-green-100 text-green-800",
      Promotions: "bg-purple-100 text-purple-800",
      Urgent: "bg-orange-100 text-orange-800",
      Other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || colors.Other;
  };

  // Render email content
  const renderEmailContent = () => (
    <>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 mb-2">{email.subject}</h2>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div>
                <span className="font-medium">From:</span> {email.fromName || email.fromEmail}
                <span className="text-slate-400 ml-1">&lt;{email.fromEmail}&gt;</span>
              </div>
              <div>
                <span className="font-medium">Date:</span> {moment(email.receivedAt).format("MMMM D, YYYY [at] h:mm A")}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {email.category && (
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getCategoryColor(email.category)}`}>
                {email.category}
              </span>
            )}
            {email.importance && (
              <span className="px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-800 rounded-full">
                Importance: {email.importance}/5
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!email.aiSummary && (
            <button
              onClick={handleSummarize}
              disabled={summarizing}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:bg-indigo-700 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {summarizing ? "Summarizing..." : "Summarize with AI"}
            </button>
          )}
          {email.aiSummary && (
            <button
              onClick={handleCopySummary}
              className="px-6 py-3 bg-slate-600 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all duration-150"
            >
              Copy Summary
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this email?")) {
                onDelete(email._id);
                if (onClose) onClose();
              }
            }}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all duration-150"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-4">
        <div className="flex">
          {["body", "summary", "meta"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === "body" && (
          <div>
            {email.bodyHtml ? (
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
              />
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans">
                {email.bodyText || email.snippet || "No content"}
              </pre>
            )}
          </div>
        )}

        {activeTab === "summary" && (
          <div>
            {email.aiSummary ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Summary</h3>
                  <p className="text-slate-700">{email.aiSummary}</p>
                </div>
                {email.aiBullets && email.aiBullets.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Key Points</h3>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {email.aiBullets.map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {email.aiTodo && email.aiTodo.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Action Items</h3>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {email.aiTodo.map((todo, idx) => (
                        <li key={idx}>{todo}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {email.lastSummarizedAt && (
                  <p className="text-xs text-slate-500">
                    Summarized: {moment(email.lastSummarizedAt).format("MMMM D, YYYY [at] h:mm A")}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">No summary available</p>
                <button
                  onClick={handleSummarize}
                  disabled={summarizing}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:bg-indigo-700 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {summarizing ? "Summarizing..." : "Generate AI Summary"}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "meta" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Gmail Message ID</h3>
              <p className="text-sm text-slate-600 font-mono">{email.gmailMessageId}</p>
            </div>
            {email.threadId && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Thread ID</h3>
                <p className="text-sm text-slate-600 font-mono">{email.threadId}</p>
              </div>
            )}
            {email.labels && email.labels.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Labels</h3>
                <div className="flex flex-wrap gap-2">
                  {email.labels.map((label, idx) => (
                    <span key={idx} className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  // If onClose is provided, render as modal
  if (onClose) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="card-premium w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
            <h2 className="text-xl font-bold text-gray-900">{email.subject}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-all duration-200"
            >
              ✕
            </button>
          </div>
          <div className="px-6 py-4">
            {renderEmailContent()}
          </div>
        </div>
      </div>
    );
  }

  // Otherwise render as regular component
  return (
    <div className="card-premium">
      <div className="p-6">
        {renderEmailContent()}
      </div>
    </div>
  );
};

export default EmailDetails;
