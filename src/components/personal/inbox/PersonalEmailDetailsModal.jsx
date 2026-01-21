import { useState } from 'react';
// import { useAuth } from '../../context/AuthContext'; // Removed
import axiosInstance from '../../../utils/axiosInstance'; // Correct path
import API_PATHS from '../../../utils/apiPaths'; // Correct path

const PersonalEmailDetailsModal = ({ email, onClose, onUpdate }) => {
    const [aiSummary, setAiSummary] = useState(email.aiSummary);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [summaryError, setSummaryError] = useState(null);

    // Removed convert logic/states

    const handleGenerateSummary = async () => {
        setLoadingSummary(true);
        setSummaryError(null);
        try {
            // Use PERSONAL Endpoint
            const response = await axiosInstance.post(
                API_PATHS.PERSONAL_GMAIL_SUMMARIZE(email._id)
            );
            setAiSummary(response.data.aiSummary);
            onUpdate({ ...email, aiSummary: response.data.aiSummary });
        } catch (err) {
            if (err.response?.status === 503) {
                setSummaryError('OpenAI is not configured on the server.');
            } else if (err.response?.status === 400) {
                setSummaryError('Email body is empty; cannot summarize.');
            } else {
                setSummaryError('Failed to generate summary');
            }
            console.error('Summary error:', err);
        } finally {
            setLoadingSummary(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-6">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900 mb-1 break-words">
                            {email.subject || '(no subject)'}
                        </h2>
                        <div className="space-y-1 text-sm text-gray-600">
                            <p>
                                <span className="font-semibold">From:</span>{' '}
                                {email.fromName || email.fromEmail || 'Unknown'}
                            </p>
                            <p>
                                <span className="font-semibold">To:</span> {email.to?.join(', ') || 'Unknown'}
                            </p>
                            <p>
                                <span className="font-semibold">Date:</span> {formatDate(email.date)}
                            </p>
                        </div>
                    </div>

                    {/* REMOVED: Convert Buttons */}

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 text-gray-500 hover:text-gray-700 text-2xl leading-none flex-shrink-0"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Email Body */}
                    {(email.bodyHtml || email.bodyText || email.snippet) && (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Preview</h3>
                            {email.bodyHtml ? (
                                <div
                                    className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-sm text-gray-700 max-h-80 overflow-y-auto overflow-x-auto"
                                    style={{ wordBreak: 'break-word' }}
                                    dangerouslySetInnerHTML={{
                                        __html: `<style>img{max-width:100% !important;height:auto !important;} table{width:100% !important; table-layout: fixed !important;} body{width:100% !important; overflow-wrap: break-word !important;}</style>${email.bodyHtml}`,
                                    }}
                                />
                            ) : (
                                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-sm text-gray-700 whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                                    {email.bodyText || email.snippet}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Snippet fallback */}
                    {!email.bodyText && !email.bodyHtml && email.snippet && (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Preview</h3>
                            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
                                {email.snippet}
                            </div>
                        </div>
                    )}

                    {/* AI Summary Section */}
                    <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">AI Summary</h3>
                            <button
                                onClick={handleGenerateSummary}
                                disabled={loadingSummary}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${loadingSummary
                                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                {loadingSummary ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Analyzing...
                                    </span>
                                ) : aiSummary ? (
                                    'Regenerate'
                                ) : (
                                    'Summarize'
                                )}
                            </button>
                        </div>

                        {summaryError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-red-700">{summaryError}</p>
                            </div>
                        )}

                        {aiSummary ? (
                            <div className="space-y-4">
                                {/* Summary */}
                                {aiSummary.summary && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Summary</h4>
                                        <p className="text-sm text-gray-600 bg-gray-50 rounded p-3 border border-gray-200">
                                            {aiSummary.summary}
                                        </p>
                                    </div>
                                )}

                                {/* Key Points */}
                                {aiSummary.key_points && aiSummary.key_points.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Points</h4>
                                        <ul className="space-y-1">
                                            {aiSummary.key_points.map((point, i) => (
                                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                                    <span className="text-blue-600 font-bold flex-shrink-0 mt-0.5">•</span>
                                                    <span>{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Action Items */}
                                {aiSummary.action_items && aiSummary.action_items.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Action Items</h4>
                                        <ul className="space-y-1">
                                            {aiSummary.action_items.map((item, i) => (
                                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                                    <span className="text-green-600 font-bold flex-shrink-0 mt-0.5">✓</span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Urgency & Category */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {aiSummary.urgency && (
                                        <div>
                                            <p className="text-xs text-gray-600 font-semibold mb-1">Urgency</p>
                                            <span
                                                className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${aiSummary.urgency === 'high'
                                                    ? 'bg-red-100 text-red-700'
                                                    : aiSummary.urgency === 'medium'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-green-100 text-green-700'
                                                    }`}
                                            >
                                                {aiSummary.urgency.charAt(0).toUpperCase() + aiSummary.urgency.slice(1)}
                                            </span>
                                        </div>
                                    )}
                                    {aiSummary.category && (
                                        <div>
                                            <p className="text-xs text-gray-600 font-semibold mb-1">Category</p>
                                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                                                {aiSummary.category}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Generated At */}
                                {aiSummary.generatedAt && (
                                    <p className="text-xs text-gray-500 border-t border-gray-200 pt-3">
                                        Generated: {new Date(aiSummary.generatedAt).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                                <svg className="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <p className="text-sm text-gray-600">No summary yet. Click "Summarize" to generate one.</p>
                            </div>
                        )}
                    </div>

                    {/* Metadata */}
                    <div className="border-t border-gray-200 pt-4 text-xs text-gray-500 space-y-1">
                        {email.hasAttachments && <p>📎 Has attachments</p>}
                        <p>Gmail ID: {email.gmailId}</p>
                        {email.threadId && <p>Thread ID: {email.threadId}</p>}
                    </div>
                </div>

                {/* Removed Convert Modal */}
            </div>
        </div>
    );
};

export default PersonalEmailDetailsModal;
